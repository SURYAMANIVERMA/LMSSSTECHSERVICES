import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const BodySchema = z.object({
  razorpay_order_id: z.string().min(6).max(80),
  razorpay_payment_id: z.string().min(6).max(80),
  razorpay_signature: z.string().min(16).max(200),
})

async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const parsed = BodySchema.safeParse(raw)
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data

  const { data: payment } = await admin
    .from('payments')
    .select('id,purpose,status,amount_inr,course_id,booking_id,user_id,customer_email')
    .eq('order_id', razorpay_order_id)
    .maybeSingle()
  if (!payment) return json({ error: 'Unknown payment order' }, 404)
  if (payment.status === 'paid') return json({ ok: true, already: true, purpose: payment.purpose })

  const expected = await hmacSha256Hex(KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`)
  if (expected !== razorpay_signature) {
    await admin
      .from('payments')
      .update({ status: 'failed', payment_id: razorpay_payment_id, error_message: 'Signature mismatch' })
      .eq('id', payment.id)
    return json({ error: 'Payment could not be verified' }, 400)
  }

  await admin
    .from('payments')
    .update({ status: 'paid', payment_id: razorpay_payment_id, signature: razorpay_signature })
    .eq('id', payment.id)

  // ---- Course enrolment -------------------------------------------------
  if (payment.purpose === 'course') {
    if (!payment.course_id || !payment.user_id) return json({ error: 'Payment record is incomplete' }, 500)
    const { data: existing } = await admin
      .from('enrollments')
      .select('id')
      .eq('course_id', payment.course_id)
      .eq('student_id', payment.user_id)
      .maybeSingle()
    if (!existing) {
      await admin.from('enrollments').insert({ course_id: payment.course_id, student_id: payment.user_id })
    }
    return json({ ok: true, purpose: 'course', course_id: payment.course_id })
  }

  // ---- Service booking --------------------------------------------------
  if (!payment.booking_id) return json({ error: 'Payment record is incomplete' }, 500)

  const { data: booking } = await admin
    .from('service_bookings')
    .update({ payment_status: 'paid' })
    .eq('id', payment.booking_id)
    .select('*')
    .single()

  if (booking) {
    await admin.from('booking_updates').insert({
      booking_id: booking.id,
      to_status: 'pending',
      note: `Payment of ₹${booking.amount_inr} received. Booking confirmed for ${booking.scheduled_date} (${booking.scheduled_slot}).`,
      author_name: 'System',
    })

    const detail = {
      customerName: booking.customer_name,
      serviceTitle: booking.service_title,
      ref: booking.public_ref,
      date: booking.scheduled_date,
      slot: booking.scheduled_slot,
      amount: booking.amount_inr,
      phone: booking.customer_phone,
      email: booking.customer_email ?? '',
      city: booking.city ?? '',
      address: booking.address ?? '',
      notes: booking.notes ?? '',
    }

    // Customer confirmation
    if (booking.customer_email) {
      try {
        await sendTemplateEmail('booking-confirmed', booking.customer_email, {
          templateData: detail,
          idempotencyKey: `booking-confirmed-${booking.id}`,
        })
        await admin.from('email_health_events').insert({ email_type: 'booking-confirmed', recipient_email: booking.customer_email, status: 'sent' })
      } catch (e) {
        await admin.from('email_health_events').insert({ email_type: 'booking-confirmed', recipient_email: booking.customer_email, status: 'failed', error_message: e instanceof Error ? e.message : 'send failed' })
      }
    }

    // Admin alert (template has a fixed recipient)
    try {
      await sendTemplateEmail('admin-booking-alert', '', {
        templateData: detail,
        idempotencyKey: `admin-booking-${booking.id}`,
      })
      await admin.from('email_health_events').insert({ email_type: 'admin-booking-alert', recipient_email: null, status: 'sent' })
    } catch (e) {
      await admin.from('email_health_events').insert({ email_type: 'admin-booking-alert', recipient_email: null, status: 'failed', error_message: e instanceof Error ? e.message : 'send failed' })
    }
  }

  return json({ ok: true, purpose: 'booking', booking_ref: booking?.public_ref ?? null })
})
