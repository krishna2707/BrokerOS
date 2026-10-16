// ============================================================================
// BrokerOS — SMS Conversations Hook
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { SmsConversation } from '../types/inbox';

export interface UseSmsConversationsOptions {
  department?: string;
  scope?: 'my' | 'team' | 'all';
  agentId?: string;
  leadId?: string;
  brokerId?: string;
  customerId?: string;
}

export function useSmsConversations(options?: UseSmsConversationsOptions) {
  const [conversations, setConversations] = useState<SmsConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'closed'>('all');

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      if (options?.department) params.set('department', options.department);
      if (options?.scope) params.set('scope', options.scope);
      if (options?.agentId) params.set('agentId', options.agentId);
      if (options?.leadId) params.set('leadId', options.leadId);
      if (options?.brokerId) params.set('brokerId', options.brokerId);
      if (options?.customerId) params.set('customerId', options.customerId);

      const res = await fetch(`${baseUrl}/api/marketing/sms/inbox/conversations?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load SMS conversations');
      const data = await res.json();
      setConversations(data.items || []);
    } catch (err) {
      console.error('loadSmsConversations error:', err);
    } finally {
      setLoading(false);
    }
  }, [
    baseUrl,
    statusFilter,
    search,
    options?.department,
    options?.scope,
    options?.agentId,
    options?.leadId,
    options?.brokerId,
    options?.customerId,
  ]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Missing timestamps — and malformed ones that parse to NaN — sort as oldest.
  const timeOrZero = (value: unknown): number => {
    if (value === null || value === undefined) return 0;
    const t = new Date(value as string).getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  const handleLiveConversationUpdate = useCallback((updated: SmsConversation) => {
    setConversations((prev) => {
      const previous = prev.find((c) => c.id === updated.id);
      const next = prev.filter((c) => c.id !== updated.id);
      return [{ ...previous, ...updated }, ...next].sort((a, b) => {
        const tA = timeOrZero(a.lastMessageAt) || timeOrZero(a.updatedAt);
        const tB = timeOrZero(b.lastMessageAt) || timeOrZero(b.updatedAt);
        return tB - tA;
      });
    });
  }, []);

  const updateStatus = async (conversationId: string, status: 'open' | 'pending' | 'closed') => {
    try {
      const res = await fetch(`${baseUrl}/api/marketing/sms/inbox/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        handleLiveConversationUpdate(updated);
      }
    } catch (err) {
      console.error('updateSmsStatus error:', err);
    }
  };

  const assignAgent = async (conversationId: string, agentUserId: string | null) => {
    try {
      const res = await fetch(`${baseUrl}/api/marketing/sms/inbox/conversations/${conversationId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentUserId }),
      });
      if (res.ok) {
        const updated = await res.json();
        handleLiveConversationUpdate(updated);
      }
    } catch (err) {
      console.error('assignSmsAgent error:', err);
    }
  };

  const toggleAiAutoReply = async (conversationId: string, disabled: boolean) => {
    try {
      const res = await fetch(`${baseUrl}/api/marketing/sms/inbox/conversations/${conversationId}/ai-toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ disabled }),
      });
      if (res.ok) {
        const updated = await res.json();
        handleLiveConversationUpdate(updated);
      }
    } catch (err) {
      console.error('toggleAiAutoReply error:', err);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`${baseUrl}/api/marketing/sms/inbox/conversations/${conversationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
      );
    } catch (err) {
      console.error('markSmsAsRead error:', err);
    }
  };

  return {
    conversations,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    reload: loadConversations,
    handleLiveConversationUpdate,
    updateStatus,
    assignAgent,
    toggleAiAutoReply,
    markAsRead,
  };
}
