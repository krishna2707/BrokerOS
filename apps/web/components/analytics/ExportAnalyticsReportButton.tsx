"use client";

import React, { useState } from "react";
import { Download, Loader2, Check, FileText } from "lucide-react";
import { generateAnalyticsHtmlReport, AnalyticsReportPayload } from "@brokeros/constants";

interface ExportAnalyticsReportButtonProps {
  payload: AnalyticsReportPayload | null;
  filenamePrefix?: string;
  className?: string;
  disabled?: boolean;
}

export function ExportAnalyticsReportButton({
  payload,
  filenamePrefix = "analytics_report",
  className = "",
  disabled = false,
}: ExportAnalyticsReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleExport = () => {
    if (!payload || disabled || isExporting) return;
    setIsExporting(true);

    try {
      const htmlContent = generateAnalyticsHtmlReport(payload);
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const timeRangeTag = payload.timeRange ? payload.timeRange.toLowerCase() : "all";
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `${filenamePrefix}_${timeRangeTag}_${dateStr}.html`;

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
      console.error("Failed to export analytics HTML report:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const isReady = Boolean(payload && !disabled);

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={!isReady}
      title={!isReady ? "Analytics data loading..." : "Export standalone responsive HTML analytics report"}
      className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border font-bold text-xs transition-all active:scale-[0.96] press-effect cursor-pointer whitespace-nowrap shadow-xs ${
        isSuccess
          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
          : !isReady
          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"
      } ${className}`}
    >
      {isExporting ? (
        <Loader2 size={13} className="animate-spin text-indigo-600" />
      ) : isSuccess ? (
        <Check size={13} className="text-emerald-600 stroke-[2.5]" />
      ) : (
        <FileText size={13} className="text-indigo-600" />
      )}
      <span>{isSuccess ? "Report Exported!" : "Export HTML Report"}</span>
    </button>
  );
}
