// ============================================================================
// BrokerOS — WhatsApp Conversations Hook
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { WhatsAppConversation } from '../types';

export interface UseWhatsAppConversationsOptions {
  department?: string;
  scope?: 'my' | 'team' | 'all';
  agentId?: string;
  leadId?: string;
  brokerId?: string;
  customerId?: string;
}

export function useWhatsAppConversations(
  initialAccountId?: string,
  options?: UseWhatsAppConversationsOptions,
) {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'closed'>('all');
  const [accountId, setAccountId] = useState<string | undefined>(initialAccountId);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (accountId) params.set('accountId', accountId);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      if (options?.department) params.set('department', options.department);
      if (options?.scope) params.set('scope', options.scope);
      if (options?.agentId) params.set('agentId', options.agentId);
      if (options?.leadId) params.set('leadId', options.leadId);
      if (options?.brokerId) params.set('brokerId', options.brokerId);
      if (options?.customerId) params.set('customerId', options.customerId);

      const res = await fetch(`${baseUrl}/api/marketing/whatsapp/conversations?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setConversations(data.items || []);
    } catch (err) {
      console.error('loadConversations error:', err);
    } finally {
      setLoading(false);
    }
  }, [
    baseUrl,
    accountId,
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

  // Handle live incoming conversation update
  const handleLiveConversationUpdate = useCallback((updated: WhatsAppConversation) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...updated };
        // Sort to top on activity
        return next.sort((a, b) => {
          const tA = new Date(a.lastMessageAt || a.updatedAt).getTime();
          const tB = new Date(b.lastMessageAt || b.updatedAt).getTime();
          return tB - tA;
        });
      }
      return [updated, ...prev];
    });
  }, []);

  const updateStatus = async (conversationId: string, status: 'open' | 'pending' | 'closed') => {
    try {
      const res = await fetch(`${baseUrl}/api/marketing/whatsapp/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        handleLiveConversationUpdate(updated);
      }
    } catch (err) {
      console.error('updateStatus error:', err);
    }
  };

  const assignAgent = async (conversationId: string, agentUserId: string | null) => {
    try {
      const res = await fetch(`${baseUrl}/api/marketing/whatsapp/conversations/${conversationId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentUserId }),
      });
      if (res.ok) {
        const updated = await res.json();
        handleLiveConversationUpdate(updated);
      }
    } catch (err) {
      console.error('assignAgent error:', err);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`${baseUrl}/api/marketing/whatsapp/conversations/${conversationId}/read`, {
        method: 'POST',
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
      );
    } catch (err) {
      console.error('markAsRead error:', err);
    }
  };

  return {
    conversations,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    accountId,
    setAccountId,
    reload: loadConversations,
    handleLiveConversationUpdate,
    updateStatus,
    assignAgent,
    markAsRead,
  };
}
