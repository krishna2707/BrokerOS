"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTelephony } from "@/features/telephony/context/TelephonyContext";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Users,
  Zap,
  Loader2,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import type { BrokerDto } from "@brokeros/types";
import {
  BROKER_STATUS_CONFIG,
  normalizePhoneNumber,
  sanitizePhoneForMeta,
} from "@brokeros/constants";

interface BrokerHeaderDetailsProps {
  broker: BrokerDto & { alternatePhone?: string | null };
  displayName: string;
  handleStatusChange: (status: string) => void;
  handleSubStatusChange?: (subStatus: string) => void;
  openFollowUpModal: () => void;
  openMeetingModal: () => void;
  handleAiAutoAdvance: () => void;
  isAiAdvancing: boolean;
  isCM?: boolean;
}

export function BrokerHeaderDetails({
  broker,
  displayName,
  handleStatusChange,
  handleSubStatusChange,
  openFollowUpModal,
  openMeetingModal,
  handleAiAutoAdvance,
  isAiAdvancing,
  isCM,
}: BrokerHeaderDetailsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { initiateCall, callState, activeLead } = useTelephony();
  const currentStatus = broker.status || "NEW";
  const statusConfig = (BROKER_STATUS_CONFIG as Record<string, { label: string; badge: string }>)[currentStatus];
  const badgeClasses = statusConfig?.badge || "bg-purple-50 text-[var(--brand-700)] border-purple-200";

  return (
    <>
      {/* Name + Status + AI Advance */}
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight m-0">
          {displayName}
        </h2>

        {/* Status Dropdown */}
        <div className="relative inline-flex items-center">
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`h-7 pl-3 pr-7 rounded-full text-xs font-bold ${badgeClasses} border outline-none cursor-pointer appearance-none transition-all shadow-2xs`}
          >
            {(() => {
              const allStatuses = [
                "PENDING_APPROVAL",
                "ACTIVE",
                "INACTIVE",
                "BLACKLISTED",
                "NEW",
                "CONTACTED",
                "VISIT",
                "DEAL",
              ];
              let availableStatuses = allStatuses;
              if (!availableStatuses.includes(broker.status)) {
                availableStatuses = [
                  broker.status,
                  ...availableStatuses,
                ].filter(Boolean);
              }
              return availableStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ));
            })()}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2.5 pointer-events-none opacity-70"
          />
        </div>

        {/* Sub-Status Dropdown */}
        <div className="relative inline-flex items-center">
          <select
            value={broker.subStatus || "PENDING"}
            onChange={(e) =>
              handleSubStatusChange && handleSubStatusChange(e.target.value)
            }
            className="h-7 pl-3 pr-7 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 outline-none cursor-pointer appearance-none transition-all shadow-2xs"
          >
            <option value="PENDING">Pending</option>
            <option value="DONE">Done</option>
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2.5 pointer-events-none text-slate-500 opacity-70"
          />
        </div>

        {/* AI Auto-Advance */}
        <button
          onClick={handleAiAutoAdvance}
          disabled={isAiAdvancing}
          className="h-7 px-3 rounded-full text-xs font-bold bg-purple-50 hover:bg-purple-100 text-[var(--brand-700)] border border-purple-200 inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.96] press-effect shadow-2xs cursor-pointer ml-auto"
          title="Auto-advance status based on AI interaction history"
        >
          {isAiAdvancing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5 text-[var(--brand-600)]" />
          )}
          <span>{isAiAdvancing ? "Analyzing…" : "AI Advance"}</span>
        </button>
      </div>

      {/* Contact Quick Info Row */}
      <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5 font-bold tabular-nums">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {broker.phone}
            {broker.alternatePhone ? ` / ${broker.alternatePhone}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {broker.email || (
              <em className="text-slate-400">No email registered</em>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {broker.city || (
              <em className="text-slate-400">No city specified</em>
            )}
          </span>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      {!isCM && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Direct Call */}
          <button
            onClick={() => {
              if (broker.phone) {
                initiateCall({
                  id: broker.id,
                  name: displayName,
                  phone: broker.phone,
                });
              }
            }}
            disabled={callState !== "IDLE" && activeLead?.id === broker.id}
            aria-label={
              callState !== "IDLE" && activeLead?.id === broker.id
                ? `Calling ${displayName}`
                : `Call ${displayName} directly via telephony carrier`
            }
            className="h-8 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors duration-150 active:scale-[0.96] transition-transform shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <Phone className={`w-3.5 h-3.5 shrink-0 ${callState !== "IDLE" && activeLead?.id === broker.id ? "animate-pulse text-emerald-600" : ""}`} />
            <span>
              {callState !== "IDLE" && activeLead?.id === broker.id
                ? "Calling..."
                : "Direct Call"}
            </span>
          </button>

          {/* WhatsApp */}
          <button
            onClick={(e) => {
              if (e.altKey && broker.phone) {
                const cleanPhone = sanitizePhoneForMeta(
                  normalizePhoneNumber(broker.phone),
                );
                window.open(`https://wa.me/${cleanPhone}`, "_blank");
                return;
              }
              // Navigate to in-app departmental WhatsApp Inbox
              const match = pathname ? pathname.match(/^\/dashboard\/([^/]+)/) : null;
              const roleSlug = match ? match[1] : (isCM ? "closing-manager" : "sourcing-manager");
              router.push(`/dashboard/${roleSlug}/whatsapp?brokerId=${broker.id}`);
            }}
            disabled={!broker.phone}
            title={broker.phone ? "Open in WhatsApp Inbox (Alt+Click for external web)" : "No phone number available"}
            className="h-8 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-[0.96] press-effect shadow-xs cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {/* SMS */}
          <button
            onClick={() => {
              if (!broker.phone) return;
              const match = pathname ? pathname.match(/^\/dashboard\/([^/]+)/) : null;
              const roleSlug = match ? match[1] : (isCM ? "closing-manager" : "sourcing-manager");
              router.push(`/dashboard/${roleSlug}/sms?brokerId=${broker.id}`);
            }}
            disabled={!broker.phone}
            title={broker.phone ? "Open in SMS Inbox" : "No phone number available"}
            className="h-8 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-[0.96] press-effect shadow-xs cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>SMS</span>
          </button>

          {/* Email */}
          <button
            onClick={() => {
              if (!broker.email) return;
              const match = pathname ? pathname.match(/^\/dashboard\/([^/]+)/) : null;
              const roleSlug = match ? match[1] : (isCM ? "closing-manager" : "sourcing-manager");
              router.push(`/dashboard/${roleSlug}/email?brokerId=${broker.id}`);
            }}
            disabled={!broker.email}
            title={broker.email ? "Open in Email Inbox" : "No email address registered"}
            className="h-8 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-[0.96] press-effect shadow-xs cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>

          {/* Follow-up */}
          <button
            onClick={() => openFollowUpModal()}
            className="h-8 px-3.5 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-[0.96] press-effect shadow-xs cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Schedule Follow-up</span>
          </button>

          {/* Meeting */}
          <button
            onClick={() => openMeetingModal()}
            className="h-8 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[var(--brand-700)] border border-purple-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-[0.96] press-effect shadow-2xs cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Log Meeting</span>
          </button>
        </div>
      )}
    </>
  );
}
