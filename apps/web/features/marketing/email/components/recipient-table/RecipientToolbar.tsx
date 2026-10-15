"use client";

import React from "react";
import { Search, Download, UserCog } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type CrmFilterType = "ALL" | "UNPROMOTED" | "IN_CRM";
export type SourceFilterType = "ALL" | "CSV_UPLOAD" | "CRM_DATABASE";

export interface RecipientToolbarProps {
  search: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  crmStatusFilter: CrmFilterType;
  onCrmStatusFilterChange: (filter: CrmFilterType) => void;
  sourceFilter: SourceFilterType;
  onSourceFilterChange: (filter: SourceFilterType) => void;
  filterLabel: string;
  onExportCsv: () => void;
  onOpenConfirmModal: () => void;
  hasFilteredResults: boolean;
  isBulkAssigning: boolean;
}

export function RecipientToolbar({
  search,
  onSearchChange,
  onClearSearch,
  crmStatusFilter,
  onCrmStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  filterLabel,
  onExportCsv,
  onOpenConfirmModal,
  hasFilteredResults,
  isBulkAssigning,
}: RecipientToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-t border-slate-100">
      <div className="flex items-center gap-2.5 flex-wrap flex-1">
        {/* Text Search Input */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={onSearchChange}
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[var(--text-primary)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* CRM Status Dropdown */}
        <select
          value={crmStatusFilter}
          onChange={(e) => onCrmStatusFilterChange(e.target.value as CrmFilterType)}
          className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] cursor-pointer"
        >
          <option value="ALL">All CRM States</option>
          <option value="UNPROMOTED">Not Yet in CRM (Unpromoted)</option>
          <option value="IN_CRM">Already in CRM (Active Leads)</option>
        </select>

        {/* Audience Source Dropdown */}
        <select
          value={sourceFilter}
          onChange={(e) => onSourceFilterChange(e.target.value as SourceFilterType)}
          className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] cursor-pointer"
        >
          <option value="ALL">All Sources</option>
          <option value="CSV_UPLOAD">CSV Upload Leads</option>
          <option value="CRM_DATABASE">CRM Database Leads</option>
        </select>
      </div>

      {/* Dynamic Action Buttons (Export & Upload to Pre-Sales) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Export Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExportCsv}
          disabled={!hasFilteredResults}
          className="h-8 px-3 text-xs font-bold gap-1.5 text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export {filterLabel} (CSV)</span>
        </Button>

        {/* Smart Upload Button */}
        <Button
          variant="default"
          size="sm"
          onClick={onOpenConfirmModal}
          disabled={!hasFilteredResults || isBulkAssigning}
          className="h-8 px-3.5 text-xs font-bold gap-1.5 shadow-2xs bg-brand-600 hover:bg-brand-700 text-white"
        >
          <UserCog className="w-3.5 h-3.5" />
          <span>Upload {filterLabel} to Pre-Sales</span>
        </Button>
      </div>
    </div>
  );
}
