// ============================================================================
// BrokerOS — SMS Messages Thread Hook
// Thin adapter delegating to the deep useChannelConversation hook.
// ============================================================================

import { useChannelConversation } from '@/features/marketing/shared/hooks/use-channel-conversation';
import type { SmsMessage } from '../types/inbox';

export function useSmsMessages(conversationId: string | null) {
  return useChannelConversation<SmsMessage>('sms', conversationId);
}
