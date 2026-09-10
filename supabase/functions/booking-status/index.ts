import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const BodySchema = z.object({
  booking_id: z.string().uuid(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  note: z.string().max(1000).optional().or(z.literal('')),
  engineer_name: z.string().max(120).optional().or(z.literal('')),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: userRes } = await admin.auth.getUser(token)
  const user = userRes?.user
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', user.id)
  const allowed = (roles ?? []).some((r: { role: string }) => r.role === 'admin' || r.role === 'engineer')
  if (!allowed) return json({ error: 'Forbidden' }, 403)

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const parsed = BodySchema.safeParse(raw)
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const { booking_id, status, note, engineer_name } = parsed.data

  const { data: before } = await admin
    .from('service_bookings')
    .select('id,status,public_ref,service_title,customer_name,customer_email')
    .eq('id', booking_id)
    .maybeSingle()
  if (!before) return json({ error: 'Booking not found' }, 404)

  const patch: Record<string, unknown> = { status }
  if (engineer_name) patch.engineer_name = engineer_name

  const { error: upErr } = await admin.from('service_bookings').update(patch).eq('id', booking_id)
  if (upErr) return json({ error: 'Could not update the booking' }, 500)

  const { data: profile } = await admin.from('profiles').select('display_name,email').eq('id', user.id).maybeSingle()

  await admin.from('booking_updates').insert({
    booking_id,
    from_status: before.status,
    to_status: status,
    note: note || null,
    author_id: user.id,
    author_name: profile?.display_name ?? profile?.email ?? 'Staff',
  })

  let notified = 'skipped'
  if (before.customer_email) {
    try {
      const res = await sendTemplateEmail('booking-status', before.customer_email, {
        templateData: {
          customerName: before.customer_name,
          serviceTitle: before.service_title,
          ref: before.public_ref,
          status,
          note: note || '',
        },
        idempotencyKey: `booking-status-${booking_id}-${status}`,
      })
      notified = res.sent ? 'sent' : res.reason
      await admin.from('email_health_events').insert({ email_type: 'booking-status', recipient_email: before.customer_email, status: notified })
    } catch (e) {
      notified = 'failed'
      await admin.from('email_health_events').insert({ email_type: 'booking-status', recipient_email: before.customer_email, status: 'failed', error_message: e instanceof Error ? e.message : 'send failed' })
    }
  }

  return json({ ok: true, status, notified })
})
