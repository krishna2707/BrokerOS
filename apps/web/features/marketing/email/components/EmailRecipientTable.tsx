// ============================================================================
// BrokerOS — Email Campaign Recipient Activity & Drill-Down Table
// ============================================================================

"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/Pagination";
import {
  RecipientFilterTabs,
  RecipientToolbar,
  RecipientTableBody,
  BulkPromoteConfirmModal,
  type EmailRecipientRow,
  type RecipientCounts,
  type EngagementFilterType,
  type CrmFilterType,
  type SourceFilterType,
} from "./recipient-table";

export type {
  EmailRecipientRow,
  RecipientCounts,
  EngagementFilterType,
  CrmFilterType,
  SourceFilterType,
};

export interface EmailRecipientTableProps {
  recipients: EmailRecipientRow[];
  counts?: RecipientCounts | null;
  onPromoteRecipient: (recipientId: string) => Promise<void>;
  campaignId?: string;
  campaignTitle?: string;
  isLoading?: boolean;
}

export function EmailRecipientTable({
  recipients,
  counts,
  onPromoteRecipient,
  campaignId,
  campaignTitle,
  isLoading,
}: EmailRecipientTableProps) {
  const [search, setSearch] = useState("");
  const [engagementFilter, setEngagementFilter] = useState<EngagementFilterType>("ALL");
  const [crmStatusFilter, setCrmStatusFilter] = useState<CrmFilterType>("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceFilterType>("ALL");

  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fallback dynamic counts computed from array if server counts not provided
  const liveCounts: RecipientCounts = useMemo(() => {
    if (counts) return counts;
    let opened = 0;
    let clicked = 0;
    let replied = 0;
    let bounced = 0;
    let inCrm = 0;

    recipients.forEach((r) => {
      if (r.hasReplied) replied++;
      if (r.openCount > 0 || r.status === "OPENED" || r.status === "CLICKED") opened++;
      if (r.clickCount > 0 || r.status === "CLICKED") clicked++;
      if (r.status === "BOUNCED" || r.status === "FAILED") bounced++;
      if (r.leadId) inCrm++;
    });

    const all = recipients.length;
    const unopened = Math.max(0, all - opened - bounced);
    const unpromoted = Math.max(0, all - inCrm);

    return { all, opened, clicked, replied, unopened, bounced, inCrm, unpromoted };
  }, [counts, recipients]);

  // Master Filter Engine
  const filtered = useMemo(() => {
    return recipients.filter((r) => {
      // 1. Text Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = r.name?.toLowerCase().includes(q);
        const matchesEmail = r.email.toLowerCase().includes(q);
        const matchesPhone = r.phone?.includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }

      // 2. Engagement Filter
      if (engagementFilter === "REPLIED") {
        if (!r.hasReplied) return false;
      } else if (engagementFilter === "OPENED") {
        if (r.openCount === 0 && r.status !== "OPENED" && r.status !== "CLICKED") return false;
      } else if (engagementFilter === "CLICKED") {
        if (r.clickCount === 0 && r.status !== "CLICKED") return false;
      } else if (engagementFilter === "UNOPENED") {
        if (r.openCount > 0 || r.status === "BOUNCED" || r.status === "FAILED") return false;
      } else if (engagementFilter === "BOUNCED") {
        if (r.status !== "BOUNCED" && r.status !== "FAILED") return false;
      }

      // 3. CRM Lead Pipeline State
      if (crmStatusFilter === "UNPROMOTED") {
        if (r.leadId) return false;
      } else if (crmStatusFilter === "IN_CRM") {
        if (!r.leadId) return false;
      }

      // 4. Source Filter
      if (sourceFilter === "CSV_UPLOAD") {
        if (r.source !== "CSV_UPLOAD") return false;
      } else if (sourceFilter === "CRM_DATABASE") {
        if (r.source !== "CRM_DATABASE") return false;
      }

      return true;
    });
  }, [recipients, search, engagementFilter, crmStatusFilter, sourceFilter]);

  // Paginated slice
  const totalItems = filtered.length;
  const paginatedRecipients = useMemo(() => {
    return filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filtered, currentPage, pageSize]);

  // Determine target leads for upload & export (Selected Checkboxes take precedence over Filtered View)
  const isSelectionActive = selectedIds.size > 0;
  const targetLeadsForAction = useMemo(() => {
    if (isSelectionActive) {
      return recipients.filter((r) => selectedIds.has(r.id));
    }
    return filtered;
  }, [isSelectionActive, selectedIds, recipients, filtered]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleEngagementFilterChange = (filter: EngagementFilterType) => {
    setEngagementFilter(filter);
    setCurrentPage(1);
    setSelectedIds(new Set()); // Reset checkboxes when changing filters
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = new Set(selectedIds);
    if (e.target.checked) {
      paginatedRecipients.forEach((r) => next.add(r.id));
    } else {
      paginatedRecipients.forEach((r) => next.delete(r.id));
    }
    setSelectedIds(next);
  };

  const handleToggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const isAllPageSelected =
    paginatedRecipients.length > 0 && paginatedRecipients.every((r) => selectedIds.has(r.id));

  const handlePromote = async (id: string) => {
    setPromotingId(id);
    try {
      await onPromoteRecipient(id);
      toast.success("Recipient successfully promoted to CRM Lead!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to promote recipient");
    } finally {
      setPromotingId(null);
    }
  };

  // Execute Bulk Upload / Push to Pre-Sales CRM
  const handleExecuteUploadToCrm = async () => {
    const targetIds = targetLeadsForAction.map((r) => r.id);
    if (targetIds.length === 0) {
      toast.info("No leads match the current selection or filter.");
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    setIsBulkAssigning(true);

    try {
      const res = await fetch(`${baseUrl}/api/marketing/campaigns/leads/bulk-assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ recipientIds: targetIds }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || "Failed to bulk assign leads");
      }

      const result = await res.json();
      toast.success(
        `Successfully uploaded to Pre-Sales: ${result.newlyCreated} created, ${result.alreadyExisted} already in CRM!`,
        {
          action: {
            label: "Open Queue",
            onClick: () => {
              window.location.href = "/dashboard/pre-sales-manager/new-leads";
            },
          },
        }
      );

      setSelectedIds(new Set());
      setIsConfirmModalOpen(false);

      // Trigger parent reload
      if (targetIds[0]) {
        await onPromoteRecipient(targetIds[0]).catch(() => { });
      }
    } catch (err: any) {
      toast.error(err?.message || "Bulk lead assignment failed");
    } finally {
      setIsBulkAssigning(false);
    }
  };

  // Smart CSV Export
  const handleExportCsv = () => {
    const leadsToExport = targetLeadsForAction;

    if (leadsToExport.length === 0) {
      toast.info("No recipient records match the current filter.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Audience Source",
      "Status",
      "Has Replied",
      "Opens",
      "Clicks",
      "CRM Lead Status",
      "Sent At",
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...leadsToExport.map((row) =>
          [
            escapeCsv(row.name || "Prospect"),
            escapeCsv(row.email),
            escapeCsv(row.phone || "N/A"),
            escapeCsv(row.source),
            escapeCsv(row.status),
            escapeCsv(row.hasReplied ? "YES" : "NO"),
            row.openCount,
            row.clickCount,
            escapeCsv(row.leadId ? "CRM_LEAD" : "UNPROMOTED"),
            escapeCsv(row.sentAt ? new Date(row.sentAt).toLocaleString() : "N/A"),
          ].join(",")
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filterTag = engagementFilter.toLowerCase();
    const filename = `leads-${campaignTitle ? campaignTitle.toLowerCase().replace(/\s+/g, "-") : "campaign"
      }-${filterTag}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${leadsToExport.length} leads to CSV (${filterTag.toUpperCase()})!`);
  };

  // Helper labels for dynamic button text
  const getFilterLabel = () => {
    if (isSelectionActive) return `Selected (${selectedIds.size})`;
    if (engagementFilter === "REPLIED") return `Replied (${filtered.length})`;
    if (engagementFilter === "OPENED") return `Opened (${filtered.length})`;
    if (engagementFilter === "CLICKED") return `Clicked (${filtered.length})`;
    if (engagementFilter === "UNOPENED") return `Unopened (${filtered.length})`;
    if (engagementFilter === "BOUNCED") return `Bounced (${filtered.length})`;
    if (filtered.length < recipients.length) return `Filtered (${filtered.length})`;
    return `All (${recipients.length})`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs space-y-4 p-5">
      {/* ── 1. Top Filter Tabs with Real-Time Counter Badges ── */}
      <RecipientFilterTabs
        engagementFilter={engagementFilter}
        onEngagementFilterChange={handleEngagementFilterChange}
        liveCounts={liveCounts}
        filteredCount={filtered.length}
        totalCount={recipients.length}
      />

      {/* ── 2. Action Toolbar & Secondary Controls ── */}
      <RecipientToolbar
        search={search}
        onSearchChange={handleSearchChange}
        onClearSearch={() => setSearch("")}
        crmStatusFilter={crmStatusFilter}
        onCrmStatusFilterChange={(f) => {
          setCrmStatusFilter(f);
          setCurrentPage(1);
        }}
        sourceFilter={sourceFilter}
        onSourceFilterChange={(f) => {
          setSourceFilter(f);
          setCurrentPage(1);
        }}
        filterLabel={getFilterLabel()}
        onExportCsv={handleExportCsv}
        onOpenConfirmModal={() => setIsConfirmModalOpen(true)}
        hasFilteredResults={filtered.length > 0}
        isBulkAssigning={isBulkAssigning}
      />

      {/* ── 3. Table Rows ── */}
      <RecipientTableBody
        paginatedRecipients={paginatedRecipients}
        selectedIds={selectedIds}
        isAllPageSelected={isAllPageSelected}
        onSelectAllOnPage={handleSelectAllOnPage}
        onToggleOne={handleToggleOne}
        onPromote={handlePromote}
        promotingId={promotingId}
      />

      {/* ── 4. Universal Pagination ── */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50, 100]}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* ── 5. Smart Confirmation Modal for Uploading to Pre-Sales CRM ── */}
      <BulkPromoteConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        targetCount={targetLeadsForAction.length}
        filterLabel={getFilterLabel()}
        campaignTitle={campaignTitle}
        onConfirm={handleExecuteUploadToCrm}
        isBulkAssigning={isBulkAssigning}
      />
    </div>
  );
}
