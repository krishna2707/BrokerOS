"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Sparkles, Users, TrendingUp, DollarSign } from "lucide-react";

import { DashboardPageWrapper } from "@/components/dashboard/DashboardPageWrapper";
import { StatCards } from "@/components/dashboard/StatCards";
import { VoiceCampaignListTable } from "@/features/marketing/voice/components/VoiceCampaignListTable";
import { MarketingChannelGrid } from "@/features/marketing/components/MarketingChannelGrid";
import {
  UnifiedBroadcastsTable,
  type UnifiedBroadcastItem,
  type UnifiedMarketingChannelType,
} from "@/features/marketing/components/UnifiedBroadcastsTable";
import type { CampaignItem, SmsCampaignItem, VoiceCampaignItem } from "@/features/marketing/types";
import {
  MarketingHubHeaderActions,
  MarketingHubChannelTabs,
  buildUnifiedBroadcasts,
} from "@/features/marketing/components/hub";

export default function MarketingHubPage() {
  const [emailCampaigns, setEmailCampaigns] = useState<CampaignItem[]>([]);
  const [smsCampaigns, setSmsCampaigns] = useState<SmsCampaignItem[]>([]);
  const [voiceCampaigns, setVoiceCampaigns] = useState<VoiceCampaignItem[]>([]);
  const [whatsAppBroadcasts, setWhatsAppBroadcasts] = useState<any[]>([]);
  const [metaCampaigns, setMetaCampaigns] = useState<any[]>([]);
  const [instagramCampaigns, setInstagramCampaigns] = useState<any[]>([]);
  const [googleCampaigns, setGoogleCampaigns] = useState<any[]>([]);
  const [youtubeCampaigns, setYoutubeCampaigns] = useState<any[]>([]);
  const [metaKpis, setMetaKpis] = useState<any>(null);
  const [igKpis, setIgKpis] = useState<any>(null);
  const [googleKpis, setGoogleKpis] = useState<any>(null);
  const [youtubeKpis, setYoutubeKpis] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChannelTab, setActiveChannelTab] = useState<
    "ALL" | UnifiedMarketingChannelType
  >("ALL");

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/proxy";

  useEffect(() => {
    async function loadMarketingData() {
      try {
        setLoading(true);
        setError(null);

        const [
          emailRes,
          smsRes,
          voiceRes,
          waRes,
          metaRes,
          igRes,
          googleRes,
          ytRes,
        ] = await Promise.all([
          fetch(`${baseUrl}/api/marketing/campaigns`).catch(() => null),
          fetch(`${baseUrl}/api/marketing/sms/campaigns`).catch(() => null),
          fetch(`${baseUrl}/api/marketing/voice/campaigns`).catch(() => null),
          fetch(`${baseUrl}/api/marketing/whatsapp/broadcasts`).catch(() => null),
          fetch(`${baseUrl}/api/marketing/ads/meta/campaigns`).catch(() => null),
          fetch(`${baseUrl}/api/marketing/ads/instagram/overview`).catch(() => null),
          fetch(`${baseUrl}/api/marketing/ads/google/campaigns`).catch(() => null),
          fetch(`${baseUrl}/api/marketing/ads/youtube/overview`).catch(() => null),
        ]);

        if (emailRes && emailRes.ok) {
          const data = await emailRes.json();
          setEmailCampaigns(data?.items || []);
        }

        if (smsRes && smsRes.ok) {
          const data = await smsRes.json();
          setSmsCampaigns(data?.items || []);
        }

        if (voiceRes && voiceRes.ok) {
          const data = await voiceRes.json();
          setVoiceCampaigns(data?.items || []);
        }

        if (waRes && waRes.ok) {
          const data = await waRes.json();
          setWhatsAppBroadcasts(data?.items || []);
        }

        if (metaRes && metaRes.ok) {
          const data = await metaRes.json();
          setMetaCampaigns(data?.items || []);
          if (data?.kpis) setMetaKpis(data.kpis);
        }

        if (igRes && igRes.ok) {
          const data = await igRes.json();
          setInstagramCampaigns(data?.items || []);
          if (data?.kpis) setIgKpis(data.kpis);
        }

        if (googleRes && googleRes.ok) {
          const data = await googleRes.json();
          setGoogleCampaigns(data?.items || []);
          if (data?.kpis) setGoogleKpis(data.kpis);
        }

        if (ytRes && ytRes.ok) {
          const data = await ytRes.json();
          setYoutubeCampaigns(data?.items || []);
          if (data?.kpis) setYoutubeKpis(data.kpis);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load marketing dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadMarketingData();
  }, [baseUrl]);

  // Calculations across Outreaches
  const emailSent = emailCampaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
  const emailDelivered = emailCampaigns.reduce((acc, c) => acc + (c.deliveredCount || 0), 0);
  const smsSent = smsCampaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
  const smsDelivered = smsCampaigns.reduce((acc, c) => acc + (c.deliveredCount || 0), 0);
  const voiceDials = voiceCampaigns.reduce((acc, c) => acc + (c.totalRecipients || 0), 0);
  const voiceCompleted = voiceCampaigns.reduce((acc, c) => acc + (c.completedCalls || 0), 0);
  const waDelivered = whatsAppBroadcasts.reduce((acc, b) => acc + (b.deliveredCount || 0), 0);

  // Calculations across Paid Ads
  const metaSpend = metaKpis?.totalSpend ?? metaCampaigns.reduce((acc, m) => acc + (m.spend || 0), 0);
  const metaImpressions = metaKpis?.totalImpressions ?? metaCampaigns.reduce((acc, m) => acc + (m.impressions || 0), 0);
  const metaLeads = metaKpis?.totalLeads ?? metaCampaigns.reduce((acc, m) => acc + (m.leadsCount || 0), 0);

  const igSpend = igKpis?.totalSpend ?? instagramCampaigns.reduce((acc, i) => acc + (i.spend || 0), 0);
  const igImpressions = igKpis?.totalImpressions ?? instagramCampaigns.reduce((acc, i) => acc + (i.impressions || 0), 0);
  const igLeads = igKpis?.totalLeads ?? instagramCampaigns.reduce((acc, i) => acc + (i.leadsCount || 0), 0);

  const googleSpend = googleKpis?.totalSpend ?? googleCampaigns.reduce((acc, g) => acc + (g.spend || 0), 0);
  const googleImpressions = googleKpis?.totalImpressions ?? googleCampaigns.reduce((acc, g) => acc + (g.impressions || 0), 0);
  const googleLeads = googleKpis?.totalLeads ?? googleCampaigns.reduce((acc, g) => acc + (g.leadsCount || 0), 0);

  const ytSpend = youtubeKpis?.totalSpend ?? youtubeCampaigns.reduce((acc, y) => acc + (y.spend || 0), 0);
  const ytImpressions = youtubeKpis?.totalImpressions ?? youtubeCampaigns.reduce((acc, y) => acc + (y.impressions || 0), 0);
  const ytLeads = youtubeKpis?.totalLeads ?? youtubeCampaigns.reduce((acc, y) => acc + (y.leadsCount || 0), 0);

  // Aggregate Totals
  const totalOmnichannelImpressions =
    emailDelivered +
    smsDelivered +
    voiceCompleted +
    waDelivered +
    metaImpressions +
    igImpressions +
    googleImpressions +
    ytImpressions;

  const totalAcquiredLeads = metaLeads + igLeads + googleLeads + ytLeads;
  const totalDigitalSpend = metaSpend + igSpend + googleSpend + ytSpend;

  const totalCampaignsCount =
    emailCampaigns.length +
    smsCampaigns.length +
    voiceCampaigns.length +
    whatsAppBroadcasts.length +
    metaCampaigns.length +
    instagramCampaigns.length +
    googleCampaigns.length +
    youtubeCampaigns.length;

  const totalAdsCount =
    metaCampaigns.length +
    instagramCampaigns.length +
    googleCampaigns.length +
    youtubeCampaigns.length;

  // Blended Top KPI cards
  const statItems = [
    {
      label: "Omnichannel Reach & Impressions",
      value: totalOmnichannelImpressions > 0 ? totalOmnichannelImpressions.toLocaleString() : "0",
      icon: Sparkles,
      accent: "oklch(0.55 0.22 310)",
      sub: `${(emailDelivered + smsDelivered + waDelivered).toLocaleString()} direct messages · ${(metaImpressions + igImpressions + googleImpressions + ytImpressions).toLocaleString()} ad views`,
    },
    {
      label: "Total Acquired CRM Leads",
      value: totalAcquiredLeads > 0 ? totalAcquiredLeads.toLocaleString() : "0",
      icon: Users,
      accent: "oklch(0.60 0.19 140)",
      sub: `Meta (${metaLeads}) · Google (${googleLeads}) · IG (${igLeads}) · YouTube (${ytLeads})`,
    },
    {
      label: "Active Campaigns Across 8 Engines",
      value: totalCampaignsCount.toLocaleString(),
      icon: TrendingUp,
      accent: "oklch(0.55 0.22 260)",
      sub: `${emailCampaigns.length + smsCampaigns.length + voiceCampaigns.length + whatsAppBroadcasts.length} outreaches · ${totalAdsCount} paid ad campaigns`,
    },
    {
      label: "Digital Ad Investment",
      value: totalDigitalSpend > 0 ? `₹${totalDigitalSpend.toLocaleString("en-IN")}` : "",
      icon: DollarSign,
      accent: "oklch(0.60 0.19 45)",
      sub: `Blended CPL: ₹${totalAcquiredLeads > 0 ? Math.round(totalDigitalSpend / totalAcquiredLeads).toLocaleString("en-IN") : ""} per verified buyer`,
    },
  ];

  // Map and compile ALL 8 channel campaigns into unified stream
  const unifiedBroadcasts: UnifiedBroadcastItem[] = useMemo(() => {
    return buildUnifiedBroadcasts({
      whatsAppBroadcasts,
      emailCampaigns,
      smsCampaigns,
      voiceCampaigns,
      metaCampaigns,
      instagramCampaigns,
      googleCampaigns,
      youtubeCampaigns,
    });
  }, [
    whatsAppBroadcasts,
    emailCampaigns,
    smsCampaigns,
    voiceCampaigns,
    metaCampaigns,
    instagramCampaigns,
    googleCampaigns,
    youtubeCampaigns,
  ]);

  // Filtered broadcast stream based on active channel tab
  const filteredBroadcasts = useMemo(() => {
    if (activeChannelTab === "ALL") return unifiedBroadcasts;
    return unifiedBroadcasts.filter((b) => b.type === activeChannelTab);
  }, [unifiedBroadcasts, activeChannelTab]);

  return (
    <DashboardPageWrapper
      loading={loading}
      error={error}
      title="Marketing Suite & Omnichannel Hub"
      subtitle="Unified campaign delivery and lead acquisition across WhatsApp, AI Voice, Email, SMS, Google Ads, YouTube, Facebook, and Instagram."
      headerRight={<MarketingHubHeaderActions />}
    >
      {/* ── Top Metric KPI Cards (Omnichannel Blended Reach & Leads) ── */}
      <StatCards items={statItems} />

      {/* ── Marketing Channels Matrix (Ads, WhatsApp, Voice, Email, SMS) ── */}
      <MarketingChannelGrid
        emailCampaigns={emailCampaigns}
        smsCampaigns={smsCampaigns}
        voiceCampaigns={voiceCampaigns}
        whatsAppBroadcastsCount={whatsAppBroadcasts.length}
        totalAdsCount={totalAdsCount}
      />

      {/* ── Broadcasts & Campaigns Section with All 8 Channel Tabs ── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-[var(--text-primary)]">
              All Marketing Campaigns & Broadcasts
            </h2>
            <p className="text-xs font-medium text-[var(--text-tertiary)]">
              Live multi-channel delivery stream across WhatsApp, AI Voice, Email, SMS, Facebook, Instagram, Google, and YouTube.
            </p>
          </div>

          {/* Channel Switcher Tabs */}
          <MarketingHubChannelTabs
            activeChannelTab={activeChannelTab}
            setActiveChannelTab={setActiveChannelTab}
            counts={{
              all: unifiedBroadcasts.length,
              whatsApp: whatsAppBroadcasts.length,
              voice: voiceCampaigns.length,
              email: emailCampaigns.length,
              sms: smsCampaigns.length,
              facebook: metaCampaigns.length,
              instagram: instagramCampaigns.length,
              google: googleCampaigns.length,
              youtube: youtubeCampaigns.length,
            }}
          />
        </div>

        {/* Tab View: Unified Table for all channels */}
        {activeChannelTab === "VOICE" && voiceCampaigns.length > 0 ? (
          <VoiceCampaignListTable campaigns={voiceCampaigns} />
        ) : (
          <UnifiedBroadcastsTable
            broadcasts={filteredBroadcasts}
            isLoading={loading}
            channel={activeChannelTab}
          />
        )}
      </div>
    </DashboardPageWrapper>
  );
}
