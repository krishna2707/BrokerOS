// ============================================================================
// BrokerOS — Email Conversation Thread Component
// ============================================================================

import React, { useRef, useEffect } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import type { EmailMessage } from '../../types/inbox';
import { EmailMessageBubble } from './EmailMessageBubble';

interface EmailConversationThreadProps {
  messages: EmailMessage[];
  loading?: boolean;
  onSendNow?: (id: string) => void;
  onEdit?: (message: EmailMessage) => void;
  onCancel?: (id: string) => void;
}

export const EmailConversationThread: React.FC<EmailConversationThreadProps> = ({
  messages,
  loading = false,
  onSendNow,
  onEdit,
  onCancel,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const lastThreadKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // A new conversation (or first load) jumps straight to the bottom; later
    // arrivals while reading stream smoothly. Scrolls the thread container
    // only (never the page) and waits two frames so layout and images settle
    // before measuring — the sync version fired too early and missed bottom.
    const key = messages.length ? messages[0]!.id : null;
    const fresh = key !== lastThreadKeyRef.current;
    lastThreadKeyRef.current = key;
    const el = scrollRef.current;
    if (!el) return;
    const run = () => el.scrollTo({ top: el.scrollHeight, behavior: fresh ? 'auto' : 'smooth' });
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 bg-radial from-transparent to-bg-base/40"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full text-text-tertiary space-y-2 py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-xs">Loading email conversation thread...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 py-16">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-text-primary">No messages in this thread yet</p>
          <p className="text-[11px] text-text-secondary max-w-xs">
            Compose a message below to reach out to the client. Outbound replies preserve dedicated domain and provider headers.
          </p>
        </div>
      ) : (
        messages.map((message) => (
          <EmailMessageBubble
            key={message.id}
            message={message}
            onSendNow={onSendNow}
            onEdit={onEdit}
            onCancel={onCancel}
          />
        ))
      )}
    </div>
  );
};
