"use client";

import React, { useMemo } from "react";
import type { CampaignItem } from "@/features/marketing/types";
import {
  UnifiedBroadcastsTable,
  type UnifiedBroadcastItem,
} from "@/features/marketing/components/UnifiedBroadcastsTable";

export interface EmailCampaignListTableProps {
  campaigns: CampaignItem[];
  isLoading?: boolean;
}

/**
 * Email Broadcast Campaign Table.
 * Thin adapter routing Email campaigns into the deep UnifiedBroadcastsTable module.
 */
export function EmailCampaignListTable({
  campaigns,
  isLoading,
}: EmailCampaignListTableProps) {
  const broadcasts: UnifiedBroadcastItem[] = useMemo(() => {
    return campaigns.map((c) => ({
      id: c.id,
      type: "EMAIL",
      title: c.title,
      previewText: c.subject,
      status: c.status,
      totalRecipients: c.totalRecipients || 0,
      sentCount: c.sentCount || 0,
      deliveredCount: c.deliveredCount || 0,
      openedCount: c.openedCount || 0,
      clickedCount: c.clickedCount || 0,
      leadsCount: 0,
      createdAt: c.createdAt || new Date().toISOString(),
      projectName: c.project?.name || "General Audience",
      providerName: c.providerType || c.integration?.name || c.integration?.provider,
      detailUrl: `/dashboard/marketing/email/campaigns/${c.id}`,
    }));
  }, [campaigns]);

  return (
    <UnifiedBroadcastsTable
      broadcasts={broadcasts}
      isLoading={isLoading}
      channel="EMAIL"
      showChannelFilter={false}
    />
  );
}
