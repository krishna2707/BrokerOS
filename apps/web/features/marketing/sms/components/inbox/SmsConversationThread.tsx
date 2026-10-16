// ============================================================================
// BrokerOS — SMS Conversation Thread Component
// ============================================================================

import React, { useRef, useEffect } from 'react';
import type { SmsMessage } from '../../types/inbox';
import { SmsMessageBubble } from './SmsMessageBubble';
import { Loader2, MessageSquare } from 'lucide-react';

interface SmsConversationThreadProps {
  messages: SmsMessage[];
  loading?: boolean;
  onSendNow?: (id: string) => void;
  onEdit?: (message: SmsMessage) => void;
  onCancel?: (id: string) => void;
}

export const SmsConversationThread: React.FC<SmsConversationThreadProps> = ({
  messages,
  loading = false,
  onSendNow,
  onEdit,
  onCancel,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastThreadKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // A new conversation (or first load) jumps straight to the bottom; later
    // arrivals while reading stream smoothly so layout and images settle.
    const key = messages.length ? `${messages[0]!.id}:${messages.length}` : null;
    const fresh = key !== lastThreadKeyRef.current;
    lastThreadKeyRef.current = key;
    messagesEndRef.current?.scrollIntoView({ behavior: fresh ? 'auto' : 'smooth', block: 'end' });
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 bg-radial from-transparent to-bg-base/40"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full text-text-tertiary space-y-2 py-12">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span className="text-xs">Loading SMS conversation thread...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 py-16">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-text-primary">No messages in this SMS thread yet</p>
          <p className="text-[11px] text-text-secondary max-w-xs">
            Send your first text message using the composer below or draft an instant AI response. Outbound replies preserve dedicated carrier route continuity.
          </p>
        </div>
      ) : (
        messages.map((message) => (
          <SmsMessageBubble
            key={message.id}
            message={message}
            onSendNow={onSendNow}
            onEdit={onEdit}
            onCancel={onCancel}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
