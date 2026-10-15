// ============================================================================
// BrokerOS — Unified Cross-Channel Conversation Hook
// Consolidates SMS, Email, and WhatsApp thread state machines into one deep seam.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export type MessagingChannel = 'sms' | 'email' | 'whatsapp';

export interface ChannelMessageBase {
  id: string;
  conversationId?: string | null;
  status?: string;
  waMessageId?: string | null;
  [key: string]: any;
}

export interface UseChannelConversationOptions {
  accountId?: string;
  limit?: number;
}

export function useChannelConversation<
  TMessage extends ChannelMessageBase = ChannelMessageBase,
  TSendPayload = any,
>(
  channel: MessagingChannel,
  conversationId: string | null,
  options?: UseChannelConversationOptions,
) {
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draftingAi, setDraftingAi] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  // --------------------------------------------------------------------------
  // URL Resolvers per Channel
  // --------------------------------------------------------------------------

  const getLoadUrl = useCallback(() => {
    if (!conversationId) return '';
    if (channel === 'whatsapp') {
      const limit = options?.limit || 100;
      return `${baseUrl}/api/marketing/whatsapp/messages/${conversationId}?limit=${limit}`;
    }
    return `${baseUrl}/api/marketing/${channel}/inbox/conversations/${conversationId}/messages`;
  }, [baseUrl, channel, conversationId, options?.limit]);

  const getSendUrl = useCallback(() => {
    if (channel === 'whatsapp') {
      return `${baseUrl}/api/marketing/whatsapp/messages/send`;
    }
    return `${baseUrl}/api/marketing/${channel}/inbox/conversations/${conversationId}/messages`;
  }, [baseUrl, channel, conversationId]);

  const getScheduleUrl = useCallback(() => {
    if (channel === 'whatsapp') {
      return `${baseUrl}/api/marketing/whatsapp/messages/${conversationId}/schedule`;
    }
    return `${baseUrl}/api/marketing/${channel}/inbox/conversations/${conversationId}/schedule`;
  }, [baseUrl, channel, conversationId]);

  const getAiDraftUrl = useCallback(
    (explicitAccountId?: string) => {
      if (channel === 'whatsapp') {
        const accId = explicitAccountId || options?.accountId || '';
        return `${baseUrl}/api/marketing/whatsapp/ai/draft?accountId=${accId}`;
      }
      return `${baseUrl}/api/marketing/${channel}/inbox/conversations/${conversationId}/ai-draft`;
    },
    [baseUrl, channel, conversationId, options?.accountId],
  );

  const getMessageActionUrl = useCallback(
    (messageId: string, action: 'reschedule' | 'edit' | 'schedule' | 'send-now') => {
      if (channel === 'whatsapp') {
        return `${baseUrl}/api/marketing/whatsapp/messages/${messageId}/${action}`;
      }
      return `${baseUrl}/api/marketing/${channel}/inbox/messages/${messageId}/${action}`;
    },
    [baseUrl, channel],
  );

  // --------------------------------------------------------------------------
  // Thread Loading
  // --------------------------------------------------------------------------

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const url = getLoadUrl();
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to load ${channel.toUpperCase()} message thread`);
      const data = await res.json();
      setMessages(data.items || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(`load${channel.toUpperCase()}Messages error:`, err);
    } finally {
      setLoading(false);
    }
  }, [channel, conversationId, getLoadUrl]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // --------------------------------------------------------------------------
  // Real-Time Event Handlers
  // --------------------------------------------------------------------------

  const handleIncomingMessage = useCallback(
    (msg: TMessage) => {
      if (msg.conversationId && msg.conversationId !== conversationId) return;

      setMessages((prev) => {
        if (
          prev.some(
            (m) =>
              m.id === msg.id ||
              (m.waMessageId && msg.waMessageId && m.waMessageId === msg.waMessageId),
          )
        ) {
          return prev;
        }
        return [...prev, msg];
      });
    },
    [conversationId],
  );

  const handleStatusUpdate = useCallback(
    (data: { conversationId: string; messageId: string; status: string }) => {
      if (data.conversationId !== conversationId) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId || m.waMessageId === data.messageId
            ? ({ ...m, status: data.status.toUpperCase() } as TMessage)
            : m,
        ),
      );
    },
    [conversationId],
  );

  // --------------------------------------------------------------------------
  // Message Actions
  // --------------------------------------------------------------------------

  const sendMessage = async (payload: TSendPayload): Promise<TMessage | null> => {
    if (!conversationId) return null;

    try {
      setSending(true);
      const body =
        channel === 'whatsapp'
          ? JSON.stringify({ conversationId, ...(payload as any) })
          : JSON.stringify(payload);

      const res = await fetch(getSendUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to send ${channel.toUpperCase()} message`);
      }

      const created = await res.json();
      setMessages((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error(`send${channel.toUpperCase()}Message error:`, err);
      throw err;
    } finally {
      setSending(false);
    }
  };

  const scheduleMessage = async (
    payload: any,
  ): Promise<TMessage | null> => {
    if (!conversationId) return null;

    try {
      setSending(true);
      const body =
        channel === 'whatsapp'
          ? JSON.stringify({ conversationId, ...payload })
          : JSON.stringify(payload);

      const res = await fetch(getScheduleUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to schedule ${channel.toUpperCase()} message`);
      }

      const created = await res.json();
      setMessages((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error(`schedule${channel.toUpperCase()}Message error:`, err);
      throw err;
    } finally {
      setSending(false);
    }
  };

  const rescheduleMessage = async (messageId: string, scheduledAt: string): Promise<TMessage> => {
    try {
      const res = await fetch(getMessageActionUrl(messageId, 'reschedule'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scheduledAt }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to reschedule ${channel.toUpperCase()} message`);
      }

      const updated = await res.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? ({ ...m, ...updated } as TMessage) : m)),
      );
      return updated;
    } catch (err) {
      console.error(`reschedule${channel.toUpperCase()}Message error:`, err);
      throw err;
    }
  };

  const editScheduledMessage = async (messageId: string, payload: any): Promise<TMessage> => {
    try {
      const res = await fetch(getMessageActionUrl(messageId, 'edit'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to edit scheduled ${channel.toUpperCase()} message`);
      }

      const updated = await res.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? ({ ...m, ...updated } as TMessage) : m)),
      );
      return updated;
    } catch (err) {
      console.error(`editScheduled${channel.toUpperCase()}Message error:`, err);
      throw err;
    }
  };

  const cancelScheduledMessage = async (messageId: string): Promise<void> => {
    try {
      const res = await fetch(getMessageActionUrl(messageId, 'schedule'), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to cancel scheduled ${channel.toUpperCase()} message`);
      }

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error(`cancelScheduled${channel.toUpperCase()}Message error:`, err);
      throw err;
    }
  };

  const sendScheduledMessageNow = async (messageId: string): Promise<TMessage> => {
    try {
      const res = await fetch(getMessageActionUrl(messageId, 'send-now'), {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Failed to send scheduled message now`);
      }

      const dispatched = await res.json();
      setMessages((prev) => [...prev.filter((m) => m.id !== messageId), dispatched]);
      return dispatched;
    } catch (err) {
      console.error('sendScheduledMessageNow error:', err);
      throw err;
    }
  };

  const draftReplyWithAi = async (
    firstArg?: string,
    secondArg?: string,
    thirdArg?: string,
  ): Promise<any> => {
    if (!conversationId) {
      return channel === 'whatsapp' ? '' : { text: '' };
    }

    try {
      setDraftingAi(true);

      let url: string;
      let body: any;

      if (channel === 'whatsapp') {
        url = getAiDraftUrl(firstArg);
        body = {
          conversationId,
          agentName: secondArg,
          instruction: thirdArg,
        };
      } else {
        url = getAiDraftUrl();
        body = {
          agentName: firstArg,
          instruction: secondArg,
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'AI drafting failed');
      }

      const data = await res.json();
      if (channel === 'whatsapp') {
        return data.draft || '';
      }
      return data;
    } catch (err) {
      console.error(`draft${channel.toUpperCase()}WithAi error:`, err);
      throw err;
    } finally {
      setDraftingAi(false);
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
    handleIncomingMessage,
    handleStatusUpdate,
    loadMessages,
    reloadMessages: loadMessages,
    reload: loadMessages,
  };
}
