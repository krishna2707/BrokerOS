"use client";

import React from "react";
import {
  Users,
  Eye,
  MousePointer,
  AlertTriangle,
  MessageSquare,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EngagementFilterType = "ALL" | "REPLIED" | "OPENED" | "CLICKED" | "UNOPENED" | "BOUNCED";

export interface RecipientCounts {
  all: number;
  opened: number;
  clicked: number;
  replied: number;
  unopened: number;
  bounced: number;
  inCrm: number;
  unpromoted: number;
}

export interface RecipientFilterTabsProps {
  engagementFilter: EngagementFilterType;
  onEngagementFilterChange: (filter: EngagementFilterType) => void;
  liveCounts: RecipientCounts;
  filteredCount: number;
  totalCount: number;
}

export function RecipientFilterTabs({
  engagementFilter,
  onEngagementFilterChange,
  liveCounts,
  filteredCount,
  totalCount,
}: RecipientFilterTabsProps) {
  const tabs = [
    { id: "ALL", label: "All Leads", count: liveCounts.all, icon: Users, color: "text-slate-600" },
    { id: "REPLIED", label: "Replied", count: liveCounts.replied, icon: MessageSquare, color: "text-purple-600" },
    { id: "OPENED", label: "Opened Mail", count: liveCounts.opened, icon: Eye, color: "text-blue-600" },
    { id: "CLICKED", label: "Clicked Links", count: liveCounts.clicked, icon: MousePointer, color: "text-emerald-600" },
    { id: "UNOPENED", label: "Unopened (Cold)", count: liveCounts.unopened, icon: Mail, color: "text-amber-600" },
    { id: "BOUNCED", label: "Bounced / Failed", count: liveCounts.bounced, icon: AlertTriangle, color: "text-red-500" },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--brand-600)]" />
            <span>Recipient Engagement & Audience Drill-Down</span>
          </h4>
          <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">
            Filter by opens, replies, or clicks to download CSVs or upload qualified leads straight into the Pre-Sales CRM.
          </p>
        </div>

        {/* Quick Counter Summary */}
        <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
          <span>Showing:</span>
          <span className="text-[var(--brand-600)] font-black tabular-nums">{filteredCount}</span>
          <span>of</span>
          <span className="text-slate-800 font-black tabular-nums">{totalCount}</span>
          <span>Leads</span>
        </div>
      </div>

      {/* Engagement Filter Chips Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 overflow-x-auto shadow-2xs">
        {tabs.map((tab) => {
          const isActive = engagementFilter === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onEngagementFilterChange(tab.id as EngagementFilterType)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                isActive
                  ? "bg-white text-[var(--text-primary)] shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", tab.color)} />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums font-black",
                  isActive
                    ? "bg-purple-100 text-[var(--brand-700)]"
                    : "bg-slate-200 text-slate-600"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
