import React from 'react';
import {
  Check,
  CheckCheck,
  AlertCircle,
  Clock,
  FileText,
  Bot,
  User,
  Paperclip,
  Zap,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { EmailMessage } from '../../types/inbox';

interface EmailMessageBubbleProps {
  message: EmailMessage;
  onSendNow?: (id: string) => void;
  onEdit?: (message: EmailMessage) => void;
  onCancel?: (id: string) => void;
}

export const EmailMessageBubble: React.FC<EmailMessageBubbleProps> = ({
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
          <span title={`Scheduled for ${message.scheduledAt}`} className="flex items-center gap-1 font-bold text-blue-700 dark:text-blue-400">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[10px]">SCHEDULED</span>
          </span>
        );
      case 'OPENED':
      case 'CLICKED':
        return (
          <span title="Email opened by prospect">
            <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
          </span>
        );
      case 'DELIVERED':
        return (
          <span title="Delivered to mailbox">
            <CheckCheck className="w-3.5 h-3.5 text-white/80" />
          </span>
        );
      case 'SENT':
        return (
          <span title="Dispatched from server">
            <Check className="w-3.5 h-3.5 text-white/80" />
          </span>
        );
      case 'FAILED':
        return (
          <span title={message.failureReason || 'Delivery failed'}>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          </span>
        );
      case 'PENDING':
      default:
        return <Clock className="w-3.5 h-3.5 text-white/60 animate-pulse" />;
    }
  };

  return (
    <div className={`flex w-full my-3 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-xs text-sm relative transition-all ${
          isScheduled
            ? 'bg-blue-500/10 dark:bg-blue-500/15 text-text-primary rounded-br-xs border-2 border-dashed border-blue-500/50 shadow-sm'
            : isOutbound
            ? isBot
              ? 'bg-purple-600/90 text-white rounded-br-xs border border-purple-500/30'
              : 'bg-blue-600 text-white rounded-br-xs border border-blue-500/30'
            : 'bg-bg-surface text-text-primary rounded-bl-xs border border-border-default'
        }`}
      >
        {/* Sender Attribution Badge */}
        <div className={`flex items-center justify-between gap-2 mb-1.5 pb-1 border-b ${
          isScheduled
            ? 'border-blue-500/20'
            : isOutbound
            ? 'border-white/10 dark:border-white/10'
            : 'border-border-subtle'
        }`}>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-90">
            {isScheduled ? (
              <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold">
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
                  <User className="w-3.5 h-3.5 text-blue-200" />
                  <span>{message.senderName || 'Agent'}</span>
                </>
              )
            ) : (
              <span className="text-text-primary font-semibold">{message.senderName || message.fromEmail}</span>
            )}
          </div>

          <span className={`text-[10px] ${
            isScheduled
              ? 'text-blue-700 dark:text-blue-400 font-mono font-medium'
              : isOutbound
              ? 'text-white/70'
              : 'text-text-tertiary'
          }`}>
            {isScheduled && message.scheduledAt
              ? `Due ${formatScheduleDate(message.scheduledAt)}`
              : formatTime(message.sentAt || message.createdAt)}
          </span>
        </div>

        {/* Email Subject Line (if present) */}
        {message.subject && (
          <div className={`text-xs font-semibold mb-2 ${
            isScheduled
              ? 'text-text-primary font-bold'
              : isOutbound
              ? 'text-white/95'
              : 'text-text-primary'
          }`}>
            Subject: {message.subject}
          </div>
        )}

        {/* Body Content */}
        {message.bodyHtml ? (
          <div
            className={`prose prose-xs max-w-none break-words leading-relaxed text-xs ${
              isScheduled
                ? 'text-text-secondary'
                : isOutbound
                ? 'prose-invert text-white'
                : 'text-text-secondary'
            }`}
            dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
          />
        ) : (
          <p className={`text-xs whitespace-pre-wrap leading-relaxed ${
            isScheduled
              ? 'text-text-secondary'
              : isOutbound
              ? 'text-white'
              : 'text-text-secondary'
          }`}>
            {message.bodyText}
          </p>
        )}

        {/* Attachments Section */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={`mt-3 pt-2 border-t space-y-1.5 ${
            isScheduled
              ? 'border-blue-500/20'
              : isOutbound
              ? 'border-white/10 dark:border-white/10'
              : 'border-border-subtle'
          }`}>
            {message.attachments.map((att, idx) => (
              <a
                key={idx}
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-colors ${
                  isScheduled
                    ? 'bg-bg-subtle hover:bg-bg-muted text-text-primary border border-border-subtle'
                    : isOutbound
                    ? 'bg-black/15 hover:bg-black/25 text-white'
                    : 'bg-bg-subtle hover:bg-bg-muted text-text-primary'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate flex-1 font-medium">{att.name}</span>
                {att.size && (
                  <span className="text-[10px] opacity-70">{Math.round(att.size / 1024)} KB</span>
                )}
              </a>
            ))}
          </div>
        )}

        {/* Outbound Delivery Status Receipt */}
        {isOutbound && !isScheduled && (
          <div className="flex items-center justify-end gap-1 mt-2 text-[10px] opacity-80">
            {renderStatus()}
          </div>
        )}

        {/* Scheduled Message Action Strip */}
        {isScheduled && (
          <div className="mt-2.5 pt-2 border-t border-blue-500/25 flex items-center justify-between gap-2">
            <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">
              Will send automatically
            </span>

            <div className="flex items-center gap-1.5">
              {onSendNow && (
                <button
                  type="button"
                  onClick={() => onSendNow(message.id)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition-colors shadow-2xs"
                  title="Send email immediately"
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
                  title="Edit content or reschedule"
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
                  title="Cancel scheduled email"
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
