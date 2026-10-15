// ============================================================================
// BrokerOS — Email Messages Thread Hook
// Thin adapter delegating to the deep useChannelConversation hook.
// ============================================================================

import { useChannelConversation } from '@/features/marketing/shared/hooks/use-channel-conversation';
import type { EmailMessage } from '../types/inbox';

export function useEmailMessages(conversationId: string | null) {
  return useChannelConversation<EmailMessage>('email', conversationId);
}
