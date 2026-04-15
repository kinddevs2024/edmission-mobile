import type { ThemeColors } from '@/theme/colors'
import type { ApplicationStatus } from '@/types/student'

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  interested: 'Interested',
  under_review: 'Under Review',
  chat_opened: 'Chat Opened',
  offer_sent: 'Offer Sent',
  rejected: 'Rejected',
  accepted: 'Accepted',
}

/** Badge text color for status chips (background applied separately). */
export function applicationStatusColor(status: ApplicationStatus, c: ThemeColors): string {
  switch (status) {
    case 'accepted':
      return c.statusAccepted
    case 'rejected':
      return c.statusRejected
    case 'offer_sent':
    case 'chat_opened':
      return c.statusOfferSent
    case 'interested':
    case 'under_review':
    default:
      return c.statusUnderReview
  }
}
