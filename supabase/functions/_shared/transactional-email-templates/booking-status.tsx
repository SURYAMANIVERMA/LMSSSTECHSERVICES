import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  serviceTitle?: string
  ref?: string
  status?: string
  note?: string
  trackUrl?: string
}

const LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function BookingStatusEmail({
  customerName = 'Customer',
  serviceTitle = 'IT Service',
  ref = 'BK-000000',
  status = 'in_progress',
  note = '',
  trackUrl = 'https://sstechservices-org.lovable.app/track-booking',
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{serviceTitle} booking {ref} is now {LABELS[status] ?? status}</Preview>
      <Body style={{ backgroundColor: '#f4f6fb', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: '24px 0' }}>
        <Container style={{ background: '#ffffff', borderRadius: 12, padding: 28, maxWidth: 560 }}>
          <Heading style={{ color: '#0f2244', fontSize: 22, margin: '0 0 12px' }}>
            Status update: {LABELS[status] ?? status}
          </Heading>
          <Text style={{ color: '#334155', fontSize: 15 }}>
            Hi {customerName}, your booking <strong>{ref}</strong> for {serviceTitle} has moved to{' '}
            <strong>{LABELS[status] ?? status}</strong>.
          </Text>
          {note ? (
            <Section style={{ background: '#f8fafc', borderRadius: 10, padding: 16, margin: '16px 0' }}>
              <Text style={{ margin: 0, color: '#0f2244' }}>{note}</Text>
            </Section>
          ) : null}
          <Text style={{ color: '#334155', fontSize: 14 }}>Full timeline: {trackUrl}?ref={ref}</Text>
          <Text style={{ color: '#64748b', fontSize: 13 }}>— SS TECH SERVICES, Lucknow</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BookingStatusEmail,
  displayName: 'Service booking status update',
  subject: (d: Record<string, unknown>) => `Your booking ${d.ref ?? ''} is ${LABELS[String(d.status)] ?? 'updated'}`,
  previewData: { customerName: 'Surya', serviceTitle: 'Network Installation', ref: 'BK-240831', status: 'in_progress', note: 'Engineer Rahul is on the way.' },
} satisfies TemplateEntry
