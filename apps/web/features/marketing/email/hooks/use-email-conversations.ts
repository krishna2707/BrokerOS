// ============================================================================
// BrokerOS — Email Conversations Hook
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { EmailConversation } from '../types/inbox';

export interface UseEmailConversationsOptions {
  department?: string;
  scope?: 'my' | 'team' | 'all';
  agentId?: string;
  leadId?: string;
  brokerId?: string;
  customerId?: string;
}

export function useEmailConversations(options?: UseEmailConversationsOptions) {
  const [conversations, setConversations] = useState<EmailConversation[]>([]);
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

      const res = await fetch(`${baseUrl}/api/marketing/email/inbox/conversations?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load email conversations');
      const data = await res.json();
      setConversations(data.items || []);
    } catch (err) {
      console.error('loadEmailConversations error:', err);
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

  const handleLiveConversationUpdate = useCallback((updated: EmailConversation) => {
    setConversations((prev) => {
      const previous = prev.find((c) => c.id === updated.id);
      const next = prev.filter((c) => c.id !== updated.id);
      return [{ ...previous, ...updated }, ...next].sort((a, b) => {
        const tA = a.lastMessageAt
          ? new Date(a.lastMessageAt).getTime()
          : a.updatedAt
            ? new Date(a.updatedAt).getTime()
            : 0;
        const tB = b.lastMessageAt
          ? new Date(b.lastMessageAt).getTime()
          : b.updatedAt
            ? new Date(b.updatedAt).getTime()
            : 0;
        return tB - tA;
      });
    });
  }, []);

  const updateStatus = async (conversationId: string, status: 'open' | 'pending' | 'closed') => {
    try {
      const res = await fetch(`${baseUrl}/api/marketing/email/inbox/conversations/${conversationId}/status`, {
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
      console.error('updateEmailStatus error:', err);
    }
  };

  const assignAgent = async (conversationId: string, agentUserId: string | null) => {
    try {
      const res = await fetch(`${baseUrl}/api/marketing/email/inbox/conversations/${conversationId}/assign`, {
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
      console.error('assignEmailAgent error:', err);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`${baseUrl}/api/marketing/email/inbox/conversations/${conversationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
      );
    } catch (err) {
      console.error('markEmailAsRead error:', err);
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
    markAsRead,
  };
}
