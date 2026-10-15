"use client";

import React from "react";
import {
  Users,
  Eye,
  MousePointer,
  AlertTriangle,
  UserCheck,
  UserPlus,
  FileSpreadsheet,
  MessageSquare,
  Filter,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface EmailRecipientRow {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  status: string;
  source: string;
  openCount: number;
  clickCount: number;
  hasReplied?: boolean;
  sentAt?: string;
  firstOpenedAt?: string;
  firstClickedAt?: string;
  leadId?: string;
  lead?: {
    id: string;
    firstName: string;
    lastName?: string;
    temperature?: string;
    status?: string;
  };
}

export interface RecipientTableBodyProps {
  paginatedRecipients: EmailRecipientRow[];
  selectedIds: Set<string>;
  isAllPageSelected: boolean;
  onSelectAllOnPage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleOne: (id: string) => void;
  onPromote: (id: string) => Promise<void>;
  promotingId: string | null;
}

export function RecipientTableBody({
  paginatedRecipients,
  selectedIds,
  isAllPageSelected,
  onSelectAllOnPage,
  onToggleOne,
  onPromote,
  promotingId,
}: RecipientTableBodyProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80">
      <table className="w-full text-left text-xs text-[var(--text-secondary)]">
        <thead className="bg-slate-50/90 font-extrabold uppercase text-[var(--text-tertiary)] tracking-wider border-b border-slate-200/80 text-[11px]">
          <tr>
            <th className="py-3 px-3 w-10 text-center">
              <input
                type="checkbox"
                checked={isAllPageSelected}
                onChange={onSelectAllOnPage}
                aria-label="Select all recipients on this page"
                className="rounded border-slate-300 text-[var(--brand-600)] focus:ring-[var(--brand-500)] cursor-pointer"
              />
            </th>
            <th className="py-3 px-3">Lead Contact</th>
            <th className="py-3 px-3">Audience Source</th>
            <th className="py-3 px-3">Engagement Status</th>
            <th className="py-3 px-3 text-center">Opens</th>
            <th className="py-3 px-3 text-center">Clicks</th>
            <th className="py-3 px-3 text-right">Lead Pipeline Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-normal">
          {paginatedRecipients.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Filter className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-600">No leads match the selected filter</p>
                  <p className="text-[11px] text-slate-400">
                    Try clearing the search or switching to "All Leads".
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            paginatedRecipients.map((r) => {
              const isSelected = selectedIds.has(r.id);
              return (
                <tr
                  key={r.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isSelected ? "bg-purple-50/40" : ""
                  }`}
                >
                  <td className="py-3.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleOne(r.id)}
                      aria-label={`Select ${r.name || r.email}`}
                      className="rounded border-slate-300 text-[var(--brand-600)] focus:ring-[var(--brand-500)] cursor-pointer"
                    />
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[var(--text-primary)]">
                        {r.name || "Anonymous Prospect"}
                      </span>
                      {r.hasReplied && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 font-bold text-[10px]">
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>Replied</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-medium text-[var(--text-tertiary)]">{r.email}</div>
                    {r.phone && (
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">{r.phone}</div>
                    )}
                  </td>

                  <td className="py-3.5 px-3">
                    {r.source === "CSV_UPLOAD" ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-[10px]">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                        <span>CSV Upload</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 text-[var(--brand-700)] border border-purple-200/80 font-bold text-[10px]">
                        <Users className="w-3 h-3 text-[var(--brand-600)]" />
                        <span>CRM Database</span>
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-3">
                    {r.hasReplied ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                        <MessageSquare className="w-3 h-3" />
                        <span>Replied to Email</span>
                      </span>
                    ) : r.clickCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <MousePointer className="w-3 h-3" />
                        <span>Clicked ({r.clickCount})</span>
                      </span>
                    ) : r.openCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                        <Eye className="w-3 h-3" />
                        <span>Opened ({r.openCount})</span>
                      </span>
                    ) : r.status === "BOUNCED" || r.status === "FAILED" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Bounced</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <Mail className="w-3 h-3" />
                        <span>Delivered (Unopened)</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span className="font-extrabold text-[var(--text-primary)] tabular-nums">
                      {r.openCount}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`font-extrabold tabular-nums ${
                        r.clickCount > 0 ? "text-emerald-600 font-black" : "text-slate-400"
                      }`}
                    >
                      {r.clickCount}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    {r.leadId ? (
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Active in CRM</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPromote(r.id)}
                        disabled={promotingId === r.id}
                        className="h-7 px-2.5 text-[11px] font-bold gap-1 text-[var(--brand-600)] hover:bg-purple-50"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{promotingId === r.id ? "Promoting..." : "Promote to Lead"}</span>
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
