import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Zap,
  Flame,
  Snowflake,
  Loader2,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { useTelephony } from "@/features/telephony/context/TelephonyContext";

interface LeadHeaderDetailsProps {
  lead: any;
  isPreSales: boolean;
  isPostSales: boolean;
  displayName: string;
  handleStatusChange: (status: string) => void;
  handleSubStatusChange?: (subStatus: string) => void;
  handleTemperatureChange: (temp: string) => void;
  openFollowUpModal: () => void;
  openSiteVisitModal: () => void;
  handleAiAutoAdvance?: () => void;
  isAiAdvancing?: boolean;
}

const TEMP_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; icon: React.ElementType }
> = {
  HOT: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: Flame,
  },
  WARM: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    icon: Zap,
  },
  COLD: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    icon: Snowflake,
  },
};

const STATUS_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  NEW: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  CONTACTED: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  INTERESTED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  QUALIFIED: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  SITE_VISIT_SCHEDULED: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  SITE_VISIT_COMPLETED: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  NEGOTIATION: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
  BOOKING: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  DOCUMENT: { bg: "bg-amber-50", text: "text-amber-900", border: "border-amber-300" },
  LOAN: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  AGREEMENT: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  HANDOVER: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  LOST: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

export function LeadHeaderDetails({
  lead,
  isPreSales,
  isPostSales,
  displayName,
  handleStatusChange,
  handleSubStatusChange,
  handleTemperatureChange,
  openFollowUpModal,
  openSiteVisitModal,
  handleAiAutoAdvance,
  isAiAdvancing,
}: LeadHeaderDetailsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { initiateCall, callState, activeLead } = useTelephony();
  const isThisLeadOnCall = callState !== "IDLE" && activeLead?.id === lead.id;

  const currentTemp = lead.temperature as string;
  const tempConf = TEMP_CONFIG[currentTemp] || {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: Flame,
  };
  const TempIcon = tempConf.icon;

  const currentStatusConf = STATUS_CLASSES[lead.status] || {
    bg: "bg-purple-50",
    text: "text-[var(--brand-700)]",
    border: "border-purple-200/90",
  };

  return (
    <>
      {/* Name + Status + Temperature Row */}
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight m-0">
          {displayName}
        </h2>

        {/* Status Dropdown */}
        <div className="relative inline-flex items-center">
          <select
            value={lead.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`h-7 pl-3 pr-7 rounded-full text-xs font-bold ${currentStatusConf.bg} hover:opacity-90 ${currentStatusConf.text} border ${currentStatusConf.border} outline-none cursor-pointer appearance-none transition-all shadow-2xs`}
          >
            {(() => {
              const allStatuses = [
                "NEW",
                "CONTACTED",
                "INTERESTED",
                "QUALIFIED",
                "SITE_VISIT_SCHEDULED",
                "SITE_VISIT_COMPLETED",
                "BOOKING",
                "DOCUMENT",
                "LOAN",
                "AGREEMENT",
                "HANDOVER",
                "LOST",
              ];
              let availableStatuses = allStatuses;

              if (isPreSales) {
                availableStatuses = allStatuses.filter(
                  (s) =>
                    s !== "SITE_VISIT_COMPLETED" &&
                    s !== "BOOKING" &&
                    !["DOCUMENT", "LOAN", "AGREEMENT", "HANDOVER"].includes(s)
                );
              } else if (
                isPostSales ||
                (typeof window !== "undefined" &&
                  window.location.pathname.includes("/closing-manager"))
              ) {
                availableStatuses = [
                  "BOOKING",
                  "DOCUMENT",
                  "LOAN",
                  "AGREEMENT",
                  "HANDOVER",
                ];
              } else {
                availableStatuses = allStatuses.filter(
                  (s) =>
                    !["DOCUMENT", "LOAN", "AGREEMENT", "HANDOVER"].includes(s)
                );
              }

              if (!availableStatuses.includes(lead.status)) {
                availableStatuses = [lead.status, ...availableStatuses];
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
            className={`absolute right-2.5 pointer-events-none ${currentStatusConf.text} opacity-70`}
          />
        </div>

        {/* Temperature Badge / Selector with Lucide Icon */}
        <div className="relative inline-flex items-center">
          <div
            className={`h-7 pl-2.5 pr-7 rounded-full text-xs font-bold border ${tempConf.bg} ${tempConf.text} ${tempConf.border} flex items-center gap-1.5 shadow-2xs relative`}
          >
            <TempIcon size={13} className="shrink-0" />
            <select
              value={lead.temperature || ""}
              onChange={(e) => handleTemperatureChange(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer appearance-none font-bold text-inherit pr-1"
            >
              <option value="" disabled>
                Temp
              </option>
              <option value="HOT">HOT</option>
              <option value="WARM">WARM</option>
              <option value="COLD">COLD</option>
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2.5 pointer-events-none opacity-70"
            />
          </div>
        </div>

        {/* Sub-Status (Post-Sales Lifecycle Stages) */}
        {["DOCUMENT", "LOAN", "AGREEMENT", "HANDOVER"].includes(lead.status) && (
          <div className="relative inline-flex items-center">
            <select
              value={lead.subStatus || ""}
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
        )}

        {/* AI Auto-Advance Button */}
        {isPreSales && (
          <button
            onClick={handleAiAutoAdvance}
            disabled={isAiAdvancing || lead.status === "QUALIFIED"}
            className="h-7 px-3 rounded-full text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.96] press-effect cursor-pointer"
            title="Automatically determine next status and generate a summary note based on recent calls"
          >
            {isAiAdvancing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-purple-600" />
            )}
            <span>AI Advance</span>
          </button>
        )}
      </div>

      {/* Possession Badges for Post-Sales */}
      {isPostSales && (lead.processionStatus || lead.processionTimeline) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {lead.processionStatus && (
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              Possession: {lead.processionStatus.replace(/_/g, " ")}
            </span>
          )}
          {lead.processionTimeline && (
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {lead.processionTimeline.value}{" "}
                {lead.processionTimeline.unit.toLowerCase()} remaining
              </span>
            </span>
          )}
        </div>
      )}

      {/* Contact Quick Info Row */}
      <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5 font-bold tabular-nums">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{lead.phone || "No phone"}</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>{lead.email || <em className="text-slate-400">No email</em>}</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {lead.preferredLocation || (
              <em className="text-slate-400">No location set</em>
            )}
          </span>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Call */}
        <button
          onClick={() => {
            if (lead.phone) {
              initiateCall({
                id: lead.id,
                name: displayName,
                phone: lead.phone,
                temperature: lead.temperature,
              });
            }
          }}
          disabled={callState !== "IDLE" && activeLead?.id === lead.id}
          aria-label={
            callState !== "IDLE" && activeLead?.id === lead.id
              ? `Calling ${displayName}`
              : `Call ${displayName} directly via telephony carrier`
          }
          className="h-8 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors duration-150 active:scale-[0.96] transition-transform shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
        >
          <Phone className={`w-3.5 h-3.5 shrink-0 ${callState !== "IDLE" && activeLead?.id === lead.id ? "animate-pulse text-emerald-600" : ""}`} />
          <span>
            {callState !== "IDLE" && activeLead?.id === lead.id
              ? "Calling..."
              : "Direct Call"}
          </span>
        </button>

        {/* WhatsApp */}
        <button
          onClick={(e) => {
            if (e.altKey && lead.phone) {
              const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
              window.open(`https://wa.me/${cleanPhone}`, "_blank");
              return;
            }
            // Navigate directly to in-app departmental WhatsApp Inbox
            const match = pathname ? pathname.match(/^\/dashboard\/([^/]+)/) : null;
            const roleSlug = match ? match[1] : (isPreSales ? "pre-sales" : isPostSales ? "post-sales" : "sales-executive");
            router.push(`/dashboard/${roleSlug}/whatsapp?leadId=${lead.id}`);
          }}
          disabled={!lead.phone}
          title={lead.phone ? "Open in WhatsApp Inbox (Alt+Click for external web)" : "No phone number available"}
          className="h-8 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-[0.96] press-effect shadow-xs cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </button>

        {/* SMS */}
        <button
          onClick={() => {
            if (!lead.phone) return;
            const match = pathname ? pathname.match(/^\/dashboard\/([^/]+)/) : null;
            const roleSlug = match ? match[1] : (isPreSales ? "pre-sales" : isPostSales ? "post-sales" : "sales-executive");
            router.push(`/dashboard/${roleSlug}/sms?leadId=${lead.id}`);
          }}
          disabled={!lead.phone}
          title={lead.phone ? "Open in SMS Inbox" : "No phone number available"}
          className="h-8 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-[0.96] press-effect shadow-xs cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>SMS</span>
        </button>

        {/* Email */}
        <button
          onClick={() => {
            if (!lead.email) return;
            const match = pathname ? pathname.match(/^\/dashboard\/([^/]+)/) : null;
            const roleSlug = match ? match[1] : (isPreSales ? "pre-sales" : isPostSales ? "post-sales" : "sales-executive");
            router.push(`/dashboard/${roleSlug}/email?leadId=${lead.id}`);
          }}
          disabled={!lead.email}
          title={lead.email ? "Open in Email Inbox" : "No email address available"}
          className="h-8 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-[0.96] press-effect shadow-xs cursor-pointer"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email</span>
        </button>

        {/* Schedule Follow-up */}
        <button
          onClick={() => openFollowUpModal()}
          className="h-8 px-3.5 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-[0.96] press-effect shadow-xs cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Schedule Follow-up</span>
        </button>

        {/* Site Visit */}
        {typeof window !== "undefined" &&
          !window.location.pathname.includes("/post-sales") &&
          !window.location.pathname.includes("/closing-manager") && (
            <button
              onClick={() => openSiteVisitModal()}
              className="h-8 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[var(--brand-700)] border border-purple-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-[0.96] press-effect shadow-2xs cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Log Site Visit</span>
            </button>
          )}
      </div>
    </>
  );
}
