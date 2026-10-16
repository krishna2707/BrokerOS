// ============================================================================
// BrokerOS — WhatsApp Phone Utilities
// Re-exports canonical phone normalization and recipient helpers from @brokeros/constants
// ============================================================================

export {
  normalizePhoneNumber,
  sanitizePhoneForMeta,
  normalizePhone,
  phonesMatch,
  isValidE164,
  phoneVariants,
  isRecipientNotAllowedError,
} from '@brokeros/constants';

