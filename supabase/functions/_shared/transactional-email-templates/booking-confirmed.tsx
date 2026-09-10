import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  serviceTitle?: string
  ref?: string
  date?: string
  slot?: string
  amount?: number
  trackUrl?: string
}

export function BookingConfirmedEmail({
  customerName = 'Customer',
  serviceTitle = 'IT Service',
  ref = 'BK-000000',
  date = '',
  slot = '',
  amount = 0,
  trackUrl = 'https://sstechservices-org.lovable.app/track-booking',
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your {serviceTitle} booking is confirmed — {ref}</Preview>
      <Body style={{ backgroundColor: '#f4f6fb', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: '24px 0' }}>
        <Container style={{ background: '#ffffff', borderRadius: 12, padding: 28, maxWidth: 560 }}>
          <Heading style={{ color: '#0f2244', fontSize: 22, margin: '0 0 12px' }}>Booking confirmed</Heading>
          <Text style={{ color: '#334155', fontSize: 15 }}>
            Thank you {customerName}, your payment was received and your service visit is scheduled.
          </Text>
          <Section style={{ background: '#f8fafc', borderRadius: 10, padding: 16, margin: '16px 0' }}>
            <Text style={{ margin: '0 0 6px', color: '#0f2244' }}><strong>Service:</strong> {serviceTitle}</Text>
            <Text style={{ margin: '0 0 6px', color: '#0f2244' }}><strong>Reference:</strong> {ref}</Text>
            <Text style={{ margin: '0 0 6px', color: '#0f2244' }}><strong>Date:</strong> {date} ({slot})</Text>
            <Text style={{ margin: 0, color: '#0f2244' }}><strong>Amount paid:</strong> ₹{amount}</Text>
          </Section>
          <Text style={{ color: '#334155', fontSize: 14 }}>
            Track live status any time at {trackUrl}?ref={ref}
          </Text>
          <Text style={{ color: '#64748b', fontSize: 13 }}>— SS TECH SERVICES, Lucknow</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BookingConfirmedEmail,
  displayName: 'Service booking confirmed',
  subject: (d: Record<string, unknown>) => `Booking confirmed — ${d.serviceTitle ?? 'IT Service'} (${d.ref ?? ''})`,
  previewData: { customerName: 'Surya', serviceTitle: 'CCTV Surveillance', ref: 'BK-240831', date: '2026-09-02', slot: 'Morning (9AM-12PM)', amount: 1499 },
} satisfies TemplateEntry
