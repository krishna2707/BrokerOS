// ============================================================================
// BrokerOS — Scheduled Messages Dock (Floating Tray Above Composer)
// ============================================================================

import React, { useState } from 'react';
import {
  Clock,
  Zap,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export interface ScheduledMessagesDockProps {
  messages: Array<any>;
  channel: 'sms' | 'email' | 'whatsapp';
  onSendNow: (messageId: string) => Promise<any>;
  onEdit: (message: any) => void;
  onCancel: (messageId: string) => Promise<any>;
}

export const ScheduledMessagesDock: React.FC<ScheduledMessagesDockProps> = ({
  messages,
  channel,
  onSendNow,
  onEdit,
  onCancel,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  if (!messages || messages.length === 0) return null;

  const formatScheduleDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const isToday = new Date().toDateString() === d.toDateString();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = tomorrow.toDateString() === d.toDateString();

      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `Today at ${timeStr}`;
      if (isTomorrow) return `Tomorrow at ${timeStr}`;
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
    } catch {
      return dateStr;
    }
  };

  const handleActionSendNow = async (id: string) => {
    try {
      setActingId(id);
      await onSendNow(id);
      toast.success('Scheduled message dispatched now');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send scheduled message now');
    } finally {
      setActingId(null);
    }
  };

  const handleActionCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled message?')) return;
    try {
      setActingId(id);
      await onCancel(id);
      toast.success('Scheduled message cancelled');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel scheduled message');
    } finally {
      setActingId(null);
    }
  };

  const primaryMessage = messages[0];

  return (
    <div className="mx-2 mb-2 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl shadow-sm overflow-hidden text-xs transition-all animate-in fade-in slide-in-from-bottom-1">
      {/* Primary Dock Header / Single Item */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-3.5 h-3.5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 font-semibold text-text-primary">
              <span>
                {messages.length === 1 ? '1 scheduled message' : `${messages.length} scheduled messages`}
              </span>
              <span className="text-amber-700 dark:text-amber-400 font-mono text-[11px]">
                • for {formatScheduleDate(primaryMessage.scheduledAt)}
              </span>
            </div>

            <p className="truncate text-text-secondary text-[11px] max-w-sm sm:max-w-md">
              "{primaryMessage.bodyText || primaryMessage.body || primaryMessage.subject || 'Message'}"
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleActionSendNow(primaryMessage.id)}
            disabled={actingId === primaryMessage.id}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all shadow-2xs disabled:opacity-50 text-[11px]"
            title="Send this message immediately"
          >
            {actingId === primaryMessage.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Zap className="w-3 h-3" />
            )}
            <span>Send Now</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(primaryMessage)}
            disabled={actingId === primaryMessage.id}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-surface hover:bg-bg-subtle border border-border-default text-text-secondary hover:text-text-primary transition-all text-[11px]"
            title="Edit message content or reschedule"
          >
            <Edit2 className="w-3 h-3" />
            <span className="hidden sm:inline">Edit</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionCancel(primaryMessage.id)}
            disabled={actingId === primaryMessage.id}
            className="p-1 rounded-lg hover:bg-rose-500/10 text-text-tertiary hover:text-rose-500 transition-colors"
            title="Cancel scheduled message"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {messages.length > 1 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-text-tertiary hover:text-text-primary rounded-lg ml-1"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Multiple Scheduled Items */}
      {expanded && messages.length > 1 && (
        <div className="border-t border-amber-500/20 px-3.5 py-2 space-y-2 bg-bg-base/40">
          {messages.slice(1).map((msg, idx) => (
            <div
              key={msg.id}
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-bg-surface border border-border-subtle"
            >
              <div className="min-w-0">
                <span className="font-semibold text-text-primary text-[11px]">
                  Scheduled for {formatScheduleDate(msg.scheduledAt)}
                </span>
                <p className="truncate text-text-secondary text-[11px]">
                  "{msg.bodyText || msg.body || msg.subject || 'Message'}"
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleActionSendNow(msg.id)}
                  disabled={actingId === msg.id}
                  className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px]"
                >
                  Send Now
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(msg)}
                  disabled={actingId === msg.id}
                  className="px-2 py-0.5 rounded border border-border-default bg-bg-base text-[10px]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleActionCancel(msg.id)}
                  disabled={actingId === msg.id}
                  className="p-1 text-text-tertiary hover:text-rose-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
