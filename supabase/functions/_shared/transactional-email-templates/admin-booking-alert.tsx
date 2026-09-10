import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  serviceTitle?: string
  ref?: string
  customerName?: string
  phone?: string
  email?: string
  city?: string
  address?: string
  date?: string
  slot?: string
  amount?: number
  notes?: string
}

export function AdminBookingAlertEmail({
  serviceTitle = 'IT Service',
  ref = 'BK-000000',
  customerName = '',
  phone = '',
  email = '',
  city = '',
  address = '',
  date = '',
  slot = '',
  amount = 0,
  notes = '',
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New paid booking {ref} — {serviceTitle}</Preview>
      <Body style={{ backgroundColor: '#f4f6fb', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: '24px 0' }}>
        <Container style={{ background: '#ffffff', borderRadius: 12, padding: 28, maxWidth: 600 }}>
          <Heading style={{ color: '#b91c1c', fontSize: 21, margin: '0 0 12px' }}>New paid service booking</Heading>
          <Section style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
            <Text style={{ margin: '0 0 6px', color: '#0f2244' }}><strong>Ref:</strong> {ref}</Text>
            <Text style={{ margin: '0 0 6px', color: '#0f2244' }}><strong>Service:</strong> {serviceTitle}</Text>
            <Text style={{ margin: '0 0 6px', color: '#0f2244' }}><strong>Amount:</strong> ₹{amount} (paid)</Text>
            <Text style={{ margin: '0 0 6px', color: '#0f2244' }}><strong>Slot:</strong> {date} — {slot}</Text>
            <Text style={{ margin: '0 0 6px', color: '#0f2244' }}><strong>Customer:</strong> {customerName} · {phone} · {email}</Text>
            <Text style={{ margin: '0 0 6px', color: '#0f2244' }}><strong>Location:</strong> {city} — {address}</Text>
            <Text style={{ margin: 0, color: '#0f2244' }}><strong>Notes:</strong> {notes || '—'}</Text>
          </Section>
          <Text style={{ color: '#64748b', fontSize: 13 }}>Assign an engineer from Admin → Service Bookings.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AdminBookingAlertEmail,
  displayName: 'Admin alert: new service booking',
  subject: (d: Record<string, unknown>) => `New paid booking ${d.ref ?? ''} — ${d.serviceTitle ?? ''}`,
  to: 'surya@sstechservices.org',
  previewData: { serviceTitle: 'Server Installation', ref: 'BK-240831', customerName: 'Amit', phone: '9876543210', email: 'amit@example.com', city: 'Lucknow', address: 'Gomti Nagar', date: '2026-09-02', slot: 'Morning (9AM-12PM)', amount: 2499, notes: 'Two Dell servers' },
} satisfies TemplateEntry
