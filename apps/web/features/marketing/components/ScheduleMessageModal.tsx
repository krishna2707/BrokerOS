// ============================================================================
// BrokerOS — Omnichannel Schedule Message Modal (WhatsApp · SMS · Email)
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  X,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  FileText,
  Mail,
  MessageSquare,
  Radio,
  Check,
} from 'lucide-react';
import { calculateSmsSegments } from '@brokeros/constants';
import { toast } from 'sonner';

export interface ScheduleModalPayload {
  scheduledAt: string; // ISO 8601
  text?: string;
  subject?: string;
  html?: string;
  attachments?: any[];
  templateName?: string;
  templateParams?: string[];
}

export interface ScheduleMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (payload: ScheduleModalPayload) => Promise<void>;
  initialText?: string;
  initialSubject?: string;
  initialHtml?: string;
  initialAttachments?: any[];
  initialScheduledAt?: string;
  isEditing?: boolean;
  channel: 'sms' | 'email' | 'whatsapp';
  recipientName?: string;
  recipientTarget?: string; // phone or email
  is24HourWindowActive?: boolean; // WhatsApp
  templates?: Array<{ name: string; bodyText: string; language?: string }>; // WhatsApp
}

export const ScheduleMessageModal: React.FC<ScheduleMessageModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  initialText = '',
  initialSubject = '',
  initialHtml = '',
  initialAttachments = [],
  initialScheduledAt,
  isEditing = false,
  channel,
  recipientName,
  recipientTarget,
  is24HourWindowActive = true,
  templates = [],
}) => {
  // Content state
  const [text, setText] = useState(initialText);
  const [subject, setSubject] = useState(initialSubject);
  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  const [templateParams, setTemplateParams] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Date and Time state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('09:30');

  // Detect local timezone
  const userTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  }, []);

  // Format minimum date for HTML date input (today's YYYY-MM-DD)
  const minDateStr = useMemo(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  // Reset or initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      setSubject(initialSubject);

      if (initialScheduledAt) {
        try {
          const d = new Date(initialScheduledAt);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          setSelectedDate(`${yyyy}-${mm}-${dd}`);
          setSelectedTime(`${hh}:${min}`);
        } catch {
          setDefaultTomorrow();
        }
      } else {
        setDefaultTomorrow();
      }
    }
  }, [isOpen, initialText, initialSubject, initialScheduledAt]);

  const setDefaultTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
    setSelectedTime('09:30');
  };

  // Calculate target Date object from inputs
  const targetDateObj = useMemo(() => {
    if (!selectedDate || !selectedTime) return null;
    const [hh, min] = selectedTime.split(':').map(Number);
    const [year, month, day] = selectedDate.split('-').map(Number);
    return new Date(year, month - 1, day, hh || 0, min || 0, 0, 0);
  }, [selectedDate, selectedTime]);

  const isPast = useMemo(() => {
    return targetDateObj ? targetDateObj.getTime() <= Date.now() + 10000 : true;
  }, [targetDateObj]);

  // Check if WhatsApp scheduled date exceeds 24 hours from now
  const isExceeding24Hours = useMemo(() => {
    if (channel !== 'whatsapp') return false;
    if (!targetDateObj) return false;
    const diffHours = (targetDateObj.getTime() - Date.now()) / (1000 * 60 * 60);
    return diffHours > 24 || !is24HourWindowActive;
  }, [channel, targetDateObj, is24HourWindowActive]);

  // Quick Preset Handlers
  const applyPreset = (preset: 'later_today' | 'tomorrow_morning' | 'tomorrow_afternoon' | 'next_monday' | 'in_2_days') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    if (preset === 'later_today') {
      const today = new Date();
      setSelectedDate(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
      setSelectedTime('18:00');
    } else if (preset === 'tomorrow_morning') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(`${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`);
      setSelectedTime('09:30');
    } else if (preset === 'tomorrow_afternoon') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(`${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`);
      setSelectedTime('14:30');
    } else if (preset === 'in_2_days') {
      const future = new Date();
      future.setDate(future.getDate() + 2);
      setSelectedDate(`${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}`);
      setSelectedTime('11:00');
    } else if (preset === 'next_monday') {
      const monday = new Date();
      const day = monday.getDay();
      const diff = monday.getDate() + (day === 0 ? 1 : 8 - day);
      monday.setDate(diff);
      setSelectedDate(`${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`);
      setSelectedTime('10:00');
    }
  };

  const handleConfirm = async () => {
    if (!targetDateObj || isPast) {
      toast.error('Please choose a date and time in the future');
      return;
    }

    if (channel === 'whatsapp' && isExceeding24Hours && !selectedTemplateName) {
      toast.error('Meta requires an Approved Template when scheduling outside the 24-hour window.');
      return;
    }

    if (channel !== 'whatsapp' && !text.trim() && !initialAttachments.length) {
      toast.error('Message content cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      await onSchedule({
        scheduledAt: targetDateObj.toISOString(),
        text: text.trim() || undefined,
        subject: channel === 'email' ? subject.trim() || undefined : undefined,
        html: channel === 'email' && text ? `<p>${text.replace(/\n/g, '<br/>')}</p>` : undefined,
        attachments: initialAttachments,
        templateName: selectedTemplateName || undefined,
        templateParams: templateParams.length ? templateParams : undefined,
      });

      toast.success(isEditing ? 'Scheduled message updated' : 'Message scheduled successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule message');
    } finally {
      setSubmitting(false);
    }
  };

  const { segments, charCount } = useMemo(() => {
    return channel === 'sms' ? calculateSmsSegments(text) : { segments: 1, charCount: text.length };
  }, [channel, text]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default bg-bg-base/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                {isEditing ? 'Edit Scheduled Message' : 'Schedule Message'}
              </h3>
              <p className="text-xs text-text-tertiary">
                Dispatches automatically via background workers at the selected time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Recipient Card */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-bg-base rounded-xl border border-border-subtle text-xs">
            <div className="flex items-center gap-2">
              {channel === 'sms' && <MessageSquare className="w-4 h-4 text-amber-500" />}
              {channel === 'email' && <Mail className="w-4 h-4 text-blue-500" />}
              {channel === 'whatsapp' && <Radio className="w-4 h-4 text-emerald-500" />}
              <span className="font-semibold text-text-primary">
                {recipientName || 'Contact'}{' '}
                {recipientTarget && <span className="font-mono text-text-tertiary font-normal">({recipientTarget})</span>}
              </span>
            </div>
            <span className="uppercase text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md bg-bg-surface border border-border-subtle text-text-secondary">
              {channel}
            </span>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Quick Presets</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('later_today')}
                className="px-2.5 py-2 text-left rounded-xl border border-border-default hover:border-amber-500/50 hover:bg-amber-500/5 text-xs text-text-secondary hover:text-text-primary transition-all shadow-2xs font-medium"
              >
                Later Today (6 PM)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('tomorrow_morning')}
                className="px-2.5 py-2 text-left rounded-xl border border-border-default hover:border-amber-500/50 hover:bg-amber-500/5 text-xs text-text-secondary hover:text-text-primary transition-all shadow-2xs font-medium"
              >
                Tomorrow (9:30 AM)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('tomorrow_afternoon')}
                className="px-2.5 py-2 text-left rounded-xl border border-border-default hover:border-amber-500/50 hover:bg-amber-500/5 text-xs text-text-secondary hover:text-text-primary transition-all shadow-2xs font-medium"
              >
                Tomorrow (2:30 PM)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('in_2_days')}
                className="px-2.5 py-2 text-left rounded-xl border border-border-default hover:border-amber-500/50 hover:bg-amber-500/5 text-xs text-text-secondary hover:text-text-primary transition-all shadow-2xs font-medium"
              >
                In 2 Days (11 AM)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('next_monday')}
                className="px-2.5 py-2 text-left rounded-xl border border-border-default hover:border-amber-500/50 hover:bg-amber-500/5 text-xs text-text-secondary hover:text-text-primary transition-all shadow-2xs font-medium col-span-2 sm:col-span-2"
              >
                Next Monday (10 AM)
              </button>
            </div>
          </div>

          {/* Date & Time Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Date</span>
              </label>
              <input
                type="date"
                min={minDateStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-bg-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Time (24h)</span>
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 bg-bg-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Timezone pill */}
          <div className="flex items-center justify-between text-[11px] text-text-tertiary px-1">
            <span>Dispatches at customer local time</span>
            <span className="font-mono bg-bg-base px-2 py-0.5 rounded border border-border-subtle text-text-secondary">
              {userTimezone}
            </span>
          </div>

          {/* WhatsApp 24-Hour Policy Notice & Template Selector */}
          {channel === 'whatsapp' && isExceeding24Hours && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Meta Policy Requirement:</strong> Since this message is scheduled outside the active 24-hour customer window, you must select an Approved Meta Template.
                </span>
              </div>

              {templates.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-text-secondary">Select Approved Template</label>
                  <select
                    value={selectedTemplateName}
                    onChange={(e) => setSelectedTemplateName(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="">-- Choose Template --</option>
                    {templates.map((tmpl) => (
                      <option key={tmpl.name} value={tmpl.name}>
                        {tmpl.name} ({tmpl.language || 'en'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-[11px] text-text-tertiary">
                  No pre-approved templates found in settings.
                </p>
              )}
            </div>
          )}

          {/* Message Content Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">Message Content</label>
              {channel === 'sms' && (
                <span className="text-[10px] font-mono text-text-tertiary">
                  {charCount} chars • {segments} seg{segments > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {channel === 'email' && (
              <input
                type="text"
                placeholder="Email Subject Line..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-bg-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-hidden focus:border-blue-500 font-medium"
              />
            )}

            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write the message to be dispatched..."
              className="w-full px-3 py-2 bg-bg-base border border-border-default rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-amber-500 resize-none font-medium leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border-default bg-bg-base/50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || isPast}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:opacity-40 shadow-sm transition-all"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            <span>{isEditing ? 'Save Changes' : 'Schedule Message'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
