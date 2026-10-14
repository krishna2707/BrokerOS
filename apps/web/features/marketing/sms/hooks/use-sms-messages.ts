// ============================================================================
// BrokerOS — SMS Messages Thread Hook
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { SmsMessage } from '../types/inbox';

export function useSmsMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draftingAi, setDraftingAi] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${baseUrl}/api/marketing/sms/inbox/conversations/${conversationId}/messages`,
        { credentials: 'include' },
      );
      if (!res.ok) throw new Error('Failed to load SMS message thread');
      const data = await res.json();
      setMessages(data.items || []);
    } catch (err) {
      console.error('loadSmsMessages error:', err);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const sendMessage = async (payload: { text: string; mediaUrl?: string }) => {
    if (!conversationId) return null;

    try {
      setSending(true);
      const res = await fetch(
        `${baseUrl}/api/marketing/sms/inbox/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to send SMS reply');
      }

      const created = await res.json();
      setMessages((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error('sendSmsMessage error:', err);
      throw err;
    } finally {
      setSending(false);
    }
  };

  const draftReplyWithAi = async (
    agentName?: string,
    instruction?: string,
  ): Promise<{ text: string }> => {
    if (!conversationId) return { text: '' };

    try {
      setDraftingAi(true);
      const res = await fetch(
        `${baseUrl}/api/marketing/sms/inbox/conversations/${conversationId}/ai-draft`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ agentName, instruction }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'AI drafting failed');
      }

      const data = await res.json();
      return data;
    } catch (err) {
      console.error('draftSmsWithAi error:', err);
      throw err;
    } finally {
      setDraftingAi(false);
    }
  };

  const scheduleMessage = async (payload: { scheduledAt: string; text?: string; mediaUrl?: string }) => {
    if (!conversationId) return null;

    try {
      setSending(true);
      const res = await fetch(
        `${baseUrl}/api/marketing/sms/inbox/conversations/${conversationId}/schedule`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to schedule SMS message');
      }

      const created = await res.json();
      setMessages((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error('scheduleSmsMessage error:', err);
      throw err;
    } finally {
      setSending(false);
    }
  };

  const rescheduleMessage = async (messageId: string, scheduledAt: string) => {
    try {
      const res = await fetch(
        `${baseUrl}/api/marketing/sms/inbox/messages/${messageId}/reschedule`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ scheduledAt }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to reschedule SMS message');
      }

      const updated = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m)));
      return updated;
    } catch (err) {
      console.error('rescheduleSmsMessage error:', err);
      throw err;
    }
  };

  const editScheduledMessage = async (
    messageId: string,
    payload: { text?: string; mediaUrl?: string; scheduledAt?: string },
  ) => {
    try {
      const res = await fetch(
        `${baseUrl}/api/marketing/sms/inbox/messages/${messageId}/edit`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to edit scheduled SMS message');
      }

      const updated = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m)));
      return updated;
    } catch (err) {
      console.error('editScheduledSmsMessage error:', err);
      throw err;
    }
  };

  const cancelScheduledMessage = async (messageId: string) => {
    try {
      const res = await fetch(
        `${baseUrl}/api/marketing/sms/inbox/messages/${messageId}/schedule`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to cancel scheduled SMS message');
      }

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('cancelScheduledSmsMessage error:', err);
      throw err;
    }
  };

  const sendScheduledMessageNow = async (messageId: string) => {
    try {
      const res = await fetch(
        `${baseUrl}/api/marketing/sms/inbox/messages/${messageId}/send-now`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to send scheduled message now');
      }

      const dispatched = await res.json();
      setMessages((prev) => [...prev.filter((m) => m.id !== messageId), dispatched]);
      return dispatched;
    } catch (err) {
      console.error('sendScheduledMessageNow error:', err);
      throw err;
    }
  };

  return {
    messages,
    loading,
    sending,
    draftingAi,
    sendMessage,
    scheduleMessage,
    rescheduleMessage,
    editScheduledMessage,
    cancelScheduledMessage,
    sendScheduledMessageNow,
    draftReplyWithAi,
    reloadMessages: loadMessages,
  };
}

