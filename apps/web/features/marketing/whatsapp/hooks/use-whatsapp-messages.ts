// ============================================================================
// BrokerOS — WhatsApp Messages Thread Hook
// Thin adapter delegating to the deep useChannelConversation hook.
// ============================================================================

import { useChannelConversation } from '@/features/marketing/shared/hooks/use-channel-conversation';
import type { WhatsAppMessage } from '../types';

export function useWhatsAppMessages(conversationId: string | null) {
  return useChannelConversation<WhatsAppMessage>('whatsapp', conversationId);
}
