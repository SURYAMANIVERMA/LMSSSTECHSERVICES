import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!
const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const CourseSchema = z.object({
  purpose: z.literal('course'),
  course_id: z.string().uuid(),
})

const BookingSchema = z.object({
  purpose: z.literal('booking'),
  service_title: z.string().min(2).max(120),
  amount_inr: z.number().int().min(199).max(500000),
  customer_name: z.string().min(2).max(120),
  customer_phone: z.string().regex(/^[0-9+\-\s]{10,15}$/),
  customer_email: z.string().email().max(160).optional().or(z.literal('')),
  city: z.string().max(80).optional().or(z.literal('')),
  address: z.string().max(400).optional().or(z.literal('')),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduled_slot: z.string().min(2).max(60),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

const BodySchema = z.discriminatedUnion('purpose', [CourseSchema, BookingSchema])

function makeRef() {
  return 'BK-' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

async function createRazorpayOrder(amountInr: number, receipt: string, notes: Record<string, string>) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${KEY_ID}:${KEY_SECRET}`),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount: amountInr * 100, currency: 'INR', receipt, notes }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.description ?? 'Could not create the payment order')
  return data as { id: string; amount: number }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!KEY_ID || !KEY_SECRET) return json({ error: 'Payments are not configured yet' }, 500)

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const parsed = BodySchema.safeParse(raw)
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const body = parsed.data

  // Identify the caller when a session is present (required for course purchases).
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: userRes } = token ? await admin.auth.getUser(token) : { data: { user: null } }
  const user = userRes?.user ?? null

  try {
    if (body.purpose === 'course') {
      if (!user) return json({ error: 'Please sign in to enrol' }, 401)

      const { data: course } = await admin
        .from('courses')
        .select('id,title,price_inr,is_published')
        .eq('id', body.course_id)
        .maybeSingle()
      if (!course || !course.is_published) return json({ error: 'Course not found' }, 404)
      if (!course.price_inr || course.price_inr <= 0) return json({ error: 'This course is free — no payment needed' }, 400)

      const { data: existing } = await admin
        .from('enrollments')
        .select('id')
        .eq('course_id', course.id)
        .eq('student_id', user.id)
        .maybeSingle()
      if (existing) return json({ error: 'You are already enrolled in this course' }, 409)

      const order = await createRazorpayOrder(course.price_inr, `course-${course.id.slice(0, 8)}`, {
        purpose: 'course',
        course_id: course.id,
      })

      await admin.from('payments').insert({
        purpose: 'course',
        order_id: order.id,
        amount_inr: course.price_inr,
        course_id: course.id,
        user_id: user.id,
        customer_email: user.email ?? null,
      })

      return json({
        key_id: KEY_ID,
        order_id: order.id,
        amount: order.amount,
        currency: 'INR',
        name: 'SS TECH SERVICES',
        description: course.title,
        prefill: { email: user.email ?? '' },
      })
    }

    // ---- Service booking -------------------------------------------------
    const ref = makeRef()
    const { data: booking, error: bookingErr } = await admin
      .from('service_bookings')
      .insert({
        public_ref: ref,
        service_title: body.service_title,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_email: body.customer_email || null,
        city: body.city || null,
        address: body.address || null,
        scheduled_date: body.scheduled_date,
        scheduled_slot: body.scheduled_slot,
        notes: body.notes || null,
        amount_inr: body.amount_inr,
        user_id: user?.id ?? null,
      })
      .select('id,public_ref')
      .single()
    if (bookingErr || !booking) return json({ error: 'Could not create the booking' }, 500)

    const order = await createRazorpayOrder(body.amount_inr, `booking-${booking.public_ref}`, {
      purpose: 'booking',
      booking_ref: booking.public_ref,
    })

    await admin.from('payments').insert({
      purpose: 'booking',
      order_id: order.id,
      amount_inr: body.amount_inr,
      booking_id: booking.id,
      user_id: user?.id ?? null,
      customer_email: body.customer_email || null,
    })

    return json({
      key_id: KEY_ID,
      order_id: order.id,
      amount: order.amount,
      currency: 'INR',
      name: 'SS TECH SERVICES',
      description: body.service_title,
      booking_ref: booking.public_ref,
      prefill: { name: body.customer_name, email: body.customer_email || '', contact: body.customer_phone },
    })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Payment initialisation failed' }, 500)
  }
})
