"use client";

import React, { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";
import { formatLeadsToCsv } from "@brokeros/constants";

interface ExportLeadsButtonProps {
  leads: any[];
  filenamePrefix?: string;
  activeStatus?: string;
  className?: string;
  disabled?: boolean;
}

export function ExportLeadsButton({
  leads,
  filenamePrefix = "leads_export",
  activeStatus = "",
  className = "",
  disabled = false,
}: ExportLeadsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleExport = () => {
    if (disabled || isExporting) return;
    setIsExporting(true);

    try {
      const csvData = formatLeadsToCsv(leads || []);
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const statusTag = activeStatus ? activeStatus.toLowerCase() : "all";
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `${filenamePrefix}_${statusTag}_${dateStr}.csv`;

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to export leads:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const count = leads?.length || 0;

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || count === 0}
      title={count === 0 ? "No leads to export" : `Export ${count} leads matching current filters as CSV`}
      className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border font-bold text-xs transition-all active:scale-[0.96] press-effect cursor-pointer whitespace-nowrap shadow-xs ${
        isSuccess
          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
          : count === 0 || disabled
          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"
      } ${className}`}
    >
      {isExporting ? (
        <Loader2 size={13} className="animate-spin text-indigo-600" />
      ) : isSuccess ? (
        <Check size={13} className="text-emerald-600 stroke-[2.5]" />
      ) : (
        <Download size={13} className="text-slate-500" />
      )}
      <span>{isSuccess ? "Exported!" : `Export CSV (${count})`}</span>
    </button>
  );
}
