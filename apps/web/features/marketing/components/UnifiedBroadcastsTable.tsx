"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Mail,
  MessageSquare,
  Send,
  Phone,
  Globe,
  Sparkles,
  MousePointer,
  ExternalLink,
  Users,
  Search,
  Download,
  X,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { InstagramIcon as Instagram } from "@/features/marketing/ads/instagram/components/InstagramIcon";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { CAMPAIGN_STATUS_CONFIG } from "@brokeros/constants";
import { GoogleIcon } from "@/features/marketing/ads/google/components/GoogleIcon";
import { YouTubeIcon } from "@/features/marketing/ads/youtube/components/YouTubeIcon";

export type UnifiedMarketingChannelType =
  | "EMAIL"
  | "SMS"
  | "VOICE"
  | "WHATSAPP"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "GOOGLE"
  | "YOUTUBE";

export interface UnifiedBroadcastItem {
  id: string;
  type: UnifiedMarketingChannelType;
  title: string;
  previewText?: string;
  status: string;
  totalRecipients?: number;
  sentCount?: number;
  deliveredCount: number;
  openedCount?: number;
  clickedCount?: number;
  leadsCount?: number;
  spend?: number;
  createdAt: string;
  projectName?: string;
  providerName?: string;
  detailUrl: string;
}

export interface UnifiedBroadcastsTableProps {
  broadcasts: UnifiedBroadcastItem[];
  isLoading?: boolean;
  channel?: UnifiedMarketingChannelType | "ALL";
  showChannelFilter?: boolean;
}

export function UnifiedBroadcastsTable({
  broadcasts,
  isLoading,
  channel = "ALL",
}: UnifiedBroadcastsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter items based on channel, search text, and status
  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter((item) => {
      const matchesChannel = channel === "ALL" || item.type === channel;

      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.previewText && item.previewText.toLowerCase().includes(q)) ||
        (item.projectName && item.projectName.toLowerCase().includes(q)) ||
        (item.providerName && item.providerName.toLowerCase().includes(q));

      const itemStatus = (item.status || "DRAFT").toUpperCase();
      const matchesStatus =
        statusFilter === "ALL" || itemStatus === statusFilter;

      return matchesChannel && matchesSearch && matchesStatus;
    });
  }, [broadcasts, channel, search, statusFilter]);

  const totalItems = filteredBroadcasts.length;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBroadcasts.slice(start, start + pageSize);
  }, [filteredBroadcasts, currentPage, pageSize]);

  // Selection Logic
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const isAllOnPageSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((item) => selectedIds.has(item.id));

  const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = new Set(selectedIds);
    if (e.target.checked) {
      paginatedItems.forEach((item) => next.add(item.id));
    } else {
      paginatedItems.forEach((item) => next.delete(item.id));
    }
    setSelectedIds(next);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk CSV Export
  const handleBulkExportCsv = () => {
    const exportTarget =
      selectedIds.size > 0
        ? filteredBroadcasts.filter((item) => selectedIds.has(item.id))
        : filteredBroadcasts;

    if (exportTarget.length === 0) {
      toast.info("No campaigns selected for export.");
      return;
    }

    const headers = [
      "Campaign Title",
      "Channel",
      "Project",
      "Provider",
      "Status",
      "Total Recipients",
      "Delivered / Impressions",
      "Opens",
      "Clicks",
      "Leads",
      "Spend",
      "Created Date",
    ];

    const rows = exportTarget.map((c) => [
      `"${(c.title || "").replace(/"/g, '""')}"`,
      `"${c.type}"`,
      `"${(c.projectName || "").replace(/"/g, '""')}"`,
      `"${(c.providerName || "").replace(/"/g, '""')}"`,
      `"${c.status}"`,
      c.totalRecipients || 0,
      c.deliveredCount || c.sentCount || 0,
      c.openedCount || 0,
      c.clickedCount || 0,
      c.leadsCount || 0,
      c.spend || 0,
      `"${c.createdAt}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `campaigns_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${exportTarget.length} campaigns to CSV`);
  };

  const renderChannelIcon = (type: UnifiedMarketingChannelType) => {
    switch (type) {
      case "EMAIL":
        return (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-purple-50 text-purple-600">
            <Mail className="w-4 h-4" />
          </div>
        );
      case "SMS":
        return (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-amber-50 text-amber-600">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case "VOICE":
        return (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600">
            <Phone className="w-4 h-4" />
          </div>
        );
      case "WHATSAPP":
        return (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
            <Send className="w-4 h-4" />
          </div>
        );
      case "FACEBOOK":
        return (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
            <Globe className="w-4 h-4" />
          </div>
        );
      case "INSTAGRAM":
        return (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-pink-50 text-pink-600">
            <Instagram className="w-4 h-4" />
          </div>
        );
      case "GOOGLE":
        return (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-red-50 text-red-600">
            <GoogleIcon size={16} />
          </div>
        );
      case "YOUTUBE":
        return (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-rose-50 text-rose-600">
            <YouTubeIcon size={16} />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-600">
            <Send className="w-4 h-4" />
          </div>
        );
    }
  };

  const getChannelBadge = (type: UnifiedMarketingChannelType) => {
    switch (type) {
      case "EMAIL":
        return "bg-purple-50 text-purple-700 border-purple-200/80";
      case "SMS":
        return "bg-amber-50 text-amber-800 border-amber-200/80";
      case "VOICE":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/80";
      case "WHATSAPP":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "FACEBOOK":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "INSTAGRAM":
        return "bg-pink-50 text-pink-700 border-pink-200/80";
      case "GOOGLE":
        return "bg-red-50 text-red-700 border-red-200/80";
      case "YOUTUBE":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/80";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs space-y-0">
      {/* Search, Filter & Bulk Actions Bar */}
      <div className="p-4 border-b border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex flex-1 items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search campaigns, projects, content..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white rounded-xl border border-slate-200 text-[var(--text-primary)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/20 focus:border-[var(--brand-500)]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1.5 px-2.5 text-xs bg-white rounded-xl border border-slate-200 text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed / Sent</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PROCESSING">Processing</option>
              <option value="DRAFT">Draft</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-bold animate-in fade-in">
              <span>{selectedIds.size} selected</span>
              <button
                type="button"
                onClick={handleClearSelection}
                className="hover:text-emerald-950 p-0.5"
                title="Clear selection"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkExportCsv}
            disabled={filteredBroadcasts.length === 0}
            className="text-xs font-bold gap-1.5 h-8 bg-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {selectedIds.size > 0
                ? `Export (${selectedIds.size})`
                : "Export CSV"}
            </span>
          </Button>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[var(--text-secondary)]">
          <thead className="bg-slate-50/90 text-[11px] font-extrabold uppercase text-[var(--text-tertiary)] tracking-wider border-b border-slate-200/80">
            <tr>
              <th className="py-3 px-3 w-8 text-center">
                <input
                  type="checkbox"
                  checked={isAllOnPageSelected}
                  onChange={handleSelectAllOnPage}
                  className="rounded border-slate-300 text-[var(--brand-600)] focus:ring-[var(--brand-500)] cursor-pointer"
                  aria-label="Select all on page"
                />
              </th>
              <th className="py-3.5 px-4">Channel & Campaign</th>
              <th className="py-3.5 px-4">Project / Scope</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Performance & Conversions</th>
              <th className="py-3.5 px-4">Created Date</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold">
                    <Sparkles className="w-4 h-4 animate-spin text-[var(--brand-600)]" />
                    <span>Loading marketing campaigns...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center text-slate-400">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-[var(--brand-600)] mx-auto mb-2.5">
                    <Send className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    No marketing campaigns found
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {search || statusFilter !== "ALL"
                      ? "Try adjusting your search query or status filter."
                      : "Launch your first campaign across WhatsApp, Voice, Email, SMS, or Paid Ads."}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const statusKey = (item.status || "DRAFT").toUpperCase();
                const statusMeta =
                  CAMPAIGN_STATUS_CONFIG[
                    statusKey as keyof typeof CAMPAIGN_STATUS_CONFIG
                  ] || CAMPAIGN_STATUS_CONFIG.DRAFT;

                const isAdChannel =
                  item.type === "FACEBOOK" ||
                  item.type === "INSTAGRAM" ||
                  item.type === "GOOGLE" ||
                  item.type === "YOUTUBE";

                const isSelected = selectedIds.has(item.id);

                return (
                  <tr
                    key={`${item.type}-${item.id}`}
                    className={`transition-colors group ${
                      isSelected
                        ? "bg-purple-50/30 hover:bg-purple-50/50"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="rounded border-slate-300 text-[var(--brand-600)] focus:ring-[var(--brand-500)] cursor-pointer"
                        aria-label={`Select ${item.title}`}
                      />
                    </td>

                    {/* Channel & Broadcast Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        {renderChannelIcon(item.type)}
                        <div className="min-w-0 max-w-sm">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={item.detailUrl}
                              className="font-extrabold text-[var(--text-primary)] hover:text-[var(--brand-600)] transition-colors truncate"
                            >
                              {item.title}
                            </Link>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${getChannelBadge(
                                item.type
                              )}`}
                            >
                              {item.type}
                            </span>
                          </div>
                          {item.previewText && (
                            <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[280px] mt-0.5">
                              {item.previewText}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Project / Scope */}
                    <td className="py-3.5 px-4 font-medium text-[var(--text-secondary)]">
                      <div className="truncate max-w-[150px]">
                        {item.projectName || "General Audience"}
                      </div>
                      {item.providerName && (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono block">
                          {item.providerName}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-2xs ${statusMeta.bg}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* Performance & Metrics */}
                    <td className="py-3.5 px-4">
                      {isAdChannel ? (
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          {typeof item.spend === "number" && (
                            <div className="font-extrabold text-[var(--text-primary)]">
                              ₹{item.spend.toLocaleString("en-IN")}
                              <span className="text-[10px] text-[var(--text-tertiary)] font-normal ml-1">
                                spend
                              </span>
                            </div>
                          )}
                          <div className="text-[11px] text-slate-600">
                            {item.deliveredCount.toLocaleString()}
                            <span className="text-[10px] text-[var(--text-muted)] ml-0.5">
                              imp
                            </span>
                          </div>
                          {typeof item.clickedCount === "number" && (
                            <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                              <MousePointer className="w-3 h-3" />
                              <span>{item.clickedCount} clicks</span>
                            </div>
                          )}
                          {typeof item.leadsCount === "number" &&
                            item.leadsCount > 0 && (
                              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                                <Users className="w-3 h-3" />
                                <span>{item.leadsCount} CRM Leads</span>
                              </div>
                            )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <div>
                            <span className="font-extrabold text-[var(--text-primary)]">
                              {item.deliveredCount.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-[var(--text-tertiary)] ml-1">
                              {item.type === "VOICE" ? "calls" : "delivered"}
                            </span>
                          </div>
                          {item.type === "EMAIL" &&
                            typeof item.openedCount === "number" && (
                              <div className="text-purple-600 font-semibold flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>{item.openedCount} opens</span>
                              </div>
                            )}
                          {item.type === "WHATSAPP" &&
                            typeof item.openedCount === "number" && (
                              <div className="text-emerald-600 font-semibold flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>{item.openedCount} read</span>
                              </div>
                            )}
                          {typeof item.clickedCount === "number" &&
                            item.clickedCount > 0 && (
                              <div className="text-emerald-600 font-semibold flex items-center gap-1">
                                <MousePointer className="w-3 h-3" />
                                <span>{item.clickedCount} clicks</span>
                              </div>
                            )}
                          {typeof item.leadsCount === "number" &&
                            item.leadsCount > 0 && (
                              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                                <Users className="w-3 h-3" />
                                <span>{item.leadsCount} Leads</span>
                              </div>
                            )}
                        </div>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-xs font-medium text-[var(--text-tertiary)]">
                      {new Date(item.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Action Link */}
                    <td className="py-3.5 px-4 text-right">
                      <Link href={item.detailUrl}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs font-bold gap-1 text-[var(--brand-600)] hover:text-[var(--brand-700)]"
                        >
                          <span>View Funnel</span>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Universal Pagination */}
      {totalItems > 0 && (
        <div className="border-t border-slate-200/80 px-4 py-3 bg-slate-50/50">
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 25, 50]}
          />
        </div>
      )}
    </div>
  );
}
