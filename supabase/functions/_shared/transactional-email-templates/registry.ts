import type { ComponentType } from 'npm:react@18.3.1'
import { template as bookingConfirmedTemplate } from './booking-confirmed.tsx'
import { template as bookingStatusTemplate } from './booking-status.tsx'
import { template as adminBookingAlertTemplate } from './admin-booking-alert.tsx'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'booking-confirmed': bookingConfirmedTemplate,
  'booking-status': bookingStatusTemplate,
  'admin-booking-alert': adminBookingAlertTemplate,
}
