import React from 'react';
import {
  Check,
  CheckCheck,
  AlertCircle,
  Clock,
  FileText,
  Play,
  Bot,
  User,
  Zap,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { WhatsAppMessage } from '../../types';

interface MessageBubbleProps {
  message: WhatsAppMessage;
  onSendNow?: (id: string) => void;
  onEdit?: (message: WhatsAppMessage) => void;
  onCancel?: (id: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onSendNow,
  onEdit,
  onCancel,
}) => {
  const isOutbound = message.direction === 'OUTBOUND';
  const isBot = message.senderType === 'bot';
  const isAgent = message.senderType === 'agent';
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
          <span title={`Scheduled for ${message.scheduledAt}`} className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[10px]">SCHEDULED</span>
          </span>
        );

      case 'READ':
        return (
          <CheckCheck className="w-3.5 h-3.5 text-sky-300 shrink-0" />
        );

      case 'DELIVERED':
        return (
          <CheckCheck className="w-3.5 h-3.5 text-white/75 shrink-0" />
        );

      case 'SENT':
        return (
          <Check className="w-3.5 h-3.5 text-white/75 shrink-0" />
        );

      case 'FAILED':
        return (
          <span title={message.failureReason || 'Failed to deliver'}>
            <AlertCircle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
          </span>
        );

      case 'PENDING':
      default:
        return (
          <Clock className="w-3.5 h-3.5 text-white/60 animate-pulse shrink-0" />
        );
    }
  };

  return (
    <div
      className={`flex w-full my-1.5 ${
        isOutbound ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm text-sm relative transition-all ${
          isScheduled
            ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-text-primary rounded-br-xs border-2 border-dashed border-emerald-500/50 shadow-sm'
            : isOutbound
            ? isBot
              ? 'bg-purple-600/90 text-white rounded-br-xs border border-purple-500/30'
              : 'bg-emerald-600 text-white rounded-br-xs border border-emerald-500/30'
            : 'bg-bg-surface text-text-primary rounded-bl-xs border border-border-default'
        }`}
      >
        {/* Sender Attribution Badge */}
        {(isOutbound || isScheduled) && (
          <div className="flex items-center justify-between gap-2 text-[10px] font-medium mb-1.5 pb-1 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-1">
              {isScheduled ? (
                <>
                  <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    Scheduled by {message.senderName || 'Agent'}
                  </span>
                </>
              ) : isBot ? (
                <>
                  <Bot className="w-3 h-3 text-purple-200" />
                  <span>Automated Bot</span>
                </>
              ) : (
                <>
                  <User className="w-3 h-3 text-emerald-200" />
                  <span>{message.senderName || 'Agent'}</span>
                </>
              )}
            </div>

            {isScheduled && message.scheduledAt && (
              <span className="font-mono text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">
                Due {formatScheduleDate(message.scheduledAt)}
              </span>
            )}
          </div>
        )}

        {/* Media Preview (Image, Document, Audio, Video) */}
        {message.mediaUrl && (
          <div className="mb-2 rounded-lg overflow-hidden max-w-sm">
            {message.type === 'IMAGE' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={message.mediaUrl}
                alt="Attachment"
                className="w-full max-h-60 object-cover rounded-lg"
              />
            ) : message.type === 'VIDEO' ? (
              <video
                controls
                src={message.mediaUrl}
                className="w-full max-h-60 rounded-lg bg-black/20"
              />
            ) : message.type === 'DOCUMENT' ? (
              <a
                href={message.mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 p-2.5 bg-black/10 rounded-lg hover:bg-black/20 transition-colors"
              >
                <FileText className="w-6 h-6 shrink-0" />
                <span className="truncate font-medium text-xs">
                  {message.caption || 'Download Document'}
                </span>
              </a>
            ) : message.type === 'AUDIO' ? (
              <div className="flex items-center gap-2 p-2 bg-black/10 rounded-lg">
                <Play className="w-4 h-4 shrink-0" />
                <audio controls src={message.mediaUrl} className="h-7 w-48" />
              </div>
            ) : null}
          </div>
        )}

        {/* Template Header Badge */}
        {message.type === 'TEMPLATE' && (
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/20 text-[10px] font-semibold tracking-wider uppercase opacity-90">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-200" />
              <span>{message.template?.name || 'HSM Template'}</span>
            </div>
            {message.template?.category && (
              <span className="px-1.5 py-0.5 rounded bg-white/20 text-[9px]">
                {message.template.category}
              </span>
            )}
          </div>
        )}

        {/* Template Header Text */}
        {message.template?.headerText && (
          <div className="font-semibold text-xs mb-1 opacity-95">
            {message.template.headerText}
          </div>
        )}

        {/* Message Text Body */}
        {(message.body || message.template?.bodyText || (message.type === 'TEMPLATE' && message.caption)) ? (
          <p className="whitespace-pre-wrap leading-relaxed break-words">
            {message.body || message.template?.bodyText || message.caption}
          </p>
        ) : message.type === 'TEMPLATE' ? (
          <p className="italic text-xs opacity-85 leading-relaxed">
            [Template: {message.caption || 'Meta approved template message delivered'}]
          </p>
        ) : null}

        {/* Template Footer Text */}
        {message.template?.footerText && (
          <div className="text-[10px] mt-1.5 opacity-75">
            {message.template.footerText}
          </div>
        )}

        {/* Template Buttons */}
        {Array.isArray(message.template?.buttons) && message.template.buttons.length > 0 && (
          <div className="mt-2.5 space-y-1 pt-1.5 border-t border-white/20">
            {message.template.buttons.map((btn: any, idx: number) => (
              <div
                key={idx}
                className="py-1 px-2.5 rounded bg-white/15 text-center text-xs font-semibold backdrop-blur-xs"
              >
                {btn.text || btn.url || `Button ${idx + 1}`}
              </div>
            ))}
          </div>
        )}

        {/* Interactive Buttons / Choices Rendering */}
        {message.interactivePayload && (
          <div className="mt-2.5 space-y-1 pt-1.5 border-t border-white/20">
            {message.interactivePayload.buttons?.map((btn: any, idx: number) => (
              <div
                key={idx}
                className="py-1 px-2.5 rounded bg-white/15 text-center text-xs font-semibold backdrop-blur-xs"
              >
                {btn.title}
              </div>
            ))}
            {message.interactivePayload.sections?.map((sec: any, idx: number) => (
              <div key={idx} className="space-y-1">
                {sec.rows?.map((row: any, rIdx: number) => (
                  <div
                    key={rIdx}
                    className="py-1 px-2.5 rounded bg-white/15 text-left text-xs"
                  >
                    <span className="font-semibold">{row.title}</span>
                    {row.description && (
                      <span className="block text-[10px] opacity-80">
                        {row.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Footer info: time & delivery ticks */}
        <div
          className={`flex items-center justify-end gap-1.5 mt-1 text-[11px] ${
            isOutbound ? 'text-white/80' : 'text-text-tertiary'
          }`}
        >
          <span>{formatTime(message.sentAt || message.createdAt)}</span>
          {renderStatus()}
        </div>

        {/* Scheduled Message Action Strip */}
        {isScheduled && (
          <div className="mt-2.5 pt-2 border-t border-emerald-500/25 flex items-center justify-between gap-2">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
              Will send automatically
            </span>

            <div className="flex items-center gap-1.5">
              {onSendNow && (
                <button
                  type="button"
                  onClick={() => onSendNow(message.id)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors shadow-2xs"
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
