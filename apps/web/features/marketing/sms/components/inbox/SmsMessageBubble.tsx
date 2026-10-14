import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle, Sparkles, User, Bot, Zap, Edit2, Trash2 } from 'lucide-react';
import type { SmsMessage } from '../../types/inbox';

interface SmsMessageBubbleProps {
  message: SmsMessage;
  onSendNow?: (id: string) => void;
  onEdit?: (message: SmsMessage) => void;
  onCancel?: (id: string) => void;
}

export const SmsMessageBubble: React.FC<SmsMessageBubbleProps> = ({
  message,
  onSendNow,
  onEdit,
  onCancel,
}) => {
  const isOutbound = message.direction === 'OUTBOUND';
  const isBot = message.senderType === 'bot' || message.isAiGenerated;
  const isScheduled = message.status === 'SCHEDULED';

  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const formatScheduleDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  const renderStatus = () => {
    if (!isOutbound) return null;

    switch (message.status) {
      case 'SCHEDULED':
        return (
          <span title={`Scheduled for ${message.scheduledAt}`} className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[10px]">SCHEDULED</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span title="Delivered to handset">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          </span>
        );
      case 'SENT':
        return (
          <span title="Dispatched from carrier gateway">
            <Check className="w-3.5 h-3.5 opacity-80" />
          </span>
        );
      case 'FAILED':
        return (
          <span title={message.failureReason || 'SMS delivery failed'}>
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          </span>
        );
      case 'PENDING':
      default:
        return <Clock className="w-3.5 h-3.5 opacity-60 animate-pulse" />;
    }
  };

  return (
    <div className={`flex w-full my-2.5 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-xs text-sm relative transition-all ${
          isScheduled
            ? 'bg-amber-500/10 dark:bg-amber-500/15 text-text-primary rounded-br-xs border-2 border-dashed border-amber-500/50 shadow-sm'
            : isOutbound
            ? isBot
              ? 'bg-purple-600/90 text-white rounded-br-xs border border-purple-500/30'
              : 'bg-amber-500 text-slate-950 font-medium rounded-br-xs border border-amber-400/40 shadow-sm'
            : 'bg-bg-surface text-text-primary rounded-bl-xs border border-border-default'
        }`}
      >
        {/* Sender Attribution Header */}
        <div className={`flex items-center justify-between gap-2 mb-1.5 pb-1 border-b ${
          isScheduled
            ? 'border-amber-500/20'
            : isOutbound
            ? isBot
              ? 'border-white/10'
              : 'border-slate-950/10'
            : 'border-border-subtle'
        }`}>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            {isScheduled ? (
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Scheduled by {message.senderName || 'Agent'}</span>
              </span>
            ) : isOutbound ? (
              isBot ? (
                <>
                  <Bot className="w-3.5 h-3.5 text-purple-200" />
                  <span>AI Automated Reply</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-slate-900/70" />
                  <span>{message.senderName || 'Sales Agent'}</span>
                </>
              )
            ) : (
              <span className="text-text-primary font-semibold">{message.senderName || message.fromPhone}</span>
            )}
          </div>

          <span className={`text-[10px] ${
            isScheduled
              ? 'text-amber-700 dark:text-amber-400 font-mono font-medium'
              : isOutbound
              ? isBot
                ? 'text-white/70'
                : 'text-slate-950/60 font-mono'
              : 'text-text-tertiary'
          }`}>
            {isScheduled && message.scheduledAt
              ? `Due ${formatScheduleDate(message.scheduledAt)}`
              : formatTime(message.sentAt || message.createdAt)}
          </span>
        </div>

        {/* Message Body */}
        <p className="text-xs whitespace-pre-wrap leading-relaxed break-words">
          {message.bodyText}
        </p>

        {/* Telemetry & Outbound Status Receipts */}
        <div className={`flex items-center justify-end gap-1.5 mt-2 text-[10px] ${
          isScheduled
            ? 'text-amber-700 dark:text-amber-400'
            : isOutbound
            ? isBot
              ? 'text-white/75'
              : 'text-slate-950/70'
            : 'text-text-tertiary'
        }`}>
          {message.segmentsCount && message.segmentsCount > 0 && (
            <span className={`font-mono text-[9px] px-1 py-0.5 rounded font-bold ${
              isScheduled
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                : isOutbound
                ? isBot
                  ? 'bg-black/20 text-white'
                  : 'bg-black/10 text-slate-950'
                : 'bg-bg-subtle text-text-secondary border border-border-subtle'
            }`}>
              {message.segmentsCount} seg{message.segmentsCount > 1 ? 's' : ''}
            </span>
          )}

          {isOutbound && renderStatus()}
        </div>

        {/* Scheduled Message Action Strip */}
        {isScheduled && (
          <div className="mt-2.5 pt-2 border-t border-amber-500/25 flex items-center justify-between gap-2">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
              Will send automatically
            </span>

            <div className="flex items-center gap-1.5">
              {onSendNow && (
                <button
                  type="button"
                  onClick={() => onSendNow(message.id)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] transition-colors shadow-2xs"
                  title="Send message immediately"
                >
                  <Zap className="w-2.5 h-2.5" />
                  <span>Send Now</span>
                </button>
              )}

              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(message)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-bg-surface hover:bg-bg-subtle border border-border-default text-text-secondary hover:text-text-primary text-[10px] transition-colors"
                  title="Edit text or reschedule"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                  <span>Edit</span>
                </button>
              )}

              {onCancel && (
                <button
                  type="button"
                  onClick={() => onCancel(message.id)}
                  className="p-1 rounded-md hover:bg-rose-500/10 text-text-tertiary hover:text-rose-500 transition-colors"
                  title="Cancel scheduled message"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

