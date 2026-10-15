"use client";

import React, { useMemo } from "react";
import type { SmsCampaignItem } from "@/features/marketing/types";
import {
  UnifiedBroadcastsTable,
  type UnifiedBroadcastItem,
} from "@/features/marketing/components/UnifiedBroadcastsTable";

export interface SmsCampaignListTableProps {
  campaigns: SmsCampaignItem[];
  isLoading?: boolean;
}

/**
 * SMS Broadcast Campaign Table.
 * Thin adapter routing SMS campaigns into the deep UnifiedBroadcastsTable module.
 */
export function SmsCampaignListTable({
  campaigns,
  isLoading,
}: SmsCampaignListTableProps) {
  const broadcasts: UnifiedBroadcastItem[] = useMemo(() => {
    return campaigns.map((c) => ({
      id: c.id,
      type: "SMS",
      title: c.title,
      previewText: c.messageContent,
      status: c.status,
      totalRecipients: c.totalRecipients || 0,
      sentCount: c.sentCount || 0,
      deliveredCount: c.deliveredCount || 0,
      openedCount: 0,
      clickedCount: c.clickedCount || 0,
      leadsCount: 0,
      createdAt: c.createdAt || new Date().toISOString(),
      projectName: c.project?.name || "General Audience",
      providerName: c.providerType || c.integration?.name || c.integration?.provider,
      detailUrl: `/dashboard/marketing/sms/campaigns/${c.id}`,
    }));
  }, [campaigns]);

  return (
    <UnifiedBroadcastsTable
      broadcasts={broadcasts}
      isLoading={isLoading}
      channel="SMS"
      showChannelFilter={false}
    />
  );
}
