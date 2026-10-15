import type {
  CampaignItem,
  SmsCampaignItem,
  VoiceCampaignItem,
} from "@/features/marketing/types";
import type { UnifiedBroadcastItem } from "@/features/marketing/components/UnifiedBroadcastsTable";

export interface BuildUnifiedBroadcastsParams {
  whatsAppBroadcasts: any[];
  emailCampaigns: CampaignItem[];
  smsCampaigns: SmsCampaignItem[];
  voiceCampaigns: VoiceCampaignItem[];
  metaCampaigns: any[];
  instagramCampaigns: any[];
  googleCampaigns: any[];
  youtubeCampaigns: any[];
}

export function buildUnifiedBroadcasts({
  whatsAppBroadcasts,
  emailCampaigns,
  smsCampaigns,
  voiceCampaigns,
  metaCampaigns,
  instagramCampaigns,
  googleCampaigns,
  youtubeCampaigns,
}: BuildUnifiedBroadcastsParams): UnifiedBroadcastItem[] {
  const list: UnifiedBroadcastItem[] = [];

  // 1. WhatsApp Broadcasts
  whatsAppBroadcasts.forEach((b) => {
    list.push({
      id: b.id,
      type: "WHATSAPP",
      title: b.name || "WhatsApp Broadcast",
      previewText: `Template: ${b.templateName || "Marketing Update"}`,
      status: b.status || "COMPLETED",
      totalRecipients: b.totalRecipients || 0,
      sentCount: b.sentCount || 0,
      deliveredCount: b.deliveredCount || 0,
      openedCount: b.readCount || 0,
      clickedCount: 0,
      createdAt: b.createdAt || new Date().toISOString(),
      projectName: b.projectName || "WhatsApp Audience",
      providerName: "Meta Cloud API",
      detailUrl: `/dashboard/marketing/whatsapp/broadcasts/${b.id}`,
    });
  });

  // 2. Email Campaigns
  emailCampaigns.forEach((c) => {
    list.push({
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
      createdAt: c.createdAt,
      projectName: c.project?.name,
      providerName: c.providerType || "AWS SES",
      detailUrl: `/dashboard/marketing/email/campaigns/${c.id}`,
    });
  });

  // 3. SMS Campaigns
  smsCampaigns.forEach((s) => {
    list.push({
      id: s.id,
      type: "SMS",
      title: s.title,
      previewText: s.messageContent,
      status: s.status,
      totalRecipients: s.totalRecipients || 0,
      sentCount: s.sentCount || 0,
      deliveredCount: s.deliveredCount || 0,
      clickedCount: s.clickedCount || 0,
      createdAt: s.createdAt,
      projectName: s.project?.name,
      providerName: s.providerType || "Twilio",
      detailUrl: `/dashboard/marketing/sms/campaigns/${s.id}`,
    });
  });

  // 4. Voice Campaigns
  voiceCampaigns.forEach((v) => {
    list.push({
      id: v.id,
      type: "VOICE",
      title: v.title,
      previewText: `${v.agentIntegration?.platform || "AI Speech"} (${v.voiceName || "Agent"})`,
      status: v.status,
      totalRecipients: v.totalRecipients || 0,
      sentCount: v.completedCalls || 0,
      deliveredCount: v.completedCalls || 0,
      clickedCount: 0,
      createdAt: v.createdAt,
      projectName: v.project?.name,
      providerName: v.telephony?.provider || "Twilio SIP",
      detailUrl: `/dashboard/marketing/voice/campaigns/${v.id}`,
    });
  });

  // 5. Facebook / Meta Ads
  metaCampaigns.forEach((m) => {
    list.push({
      id: m.id,
      type: "FACEBOOK",
      title: m.campaignName || m.name || "Meta Facebook Ad Campaign",
      previewText: `Objective: ${m.objective || "LEAD_GENERATION"}`,
      status: m.status || "ACTIVE",
      totalRecipients: m.reach || 0,
      sentCount: m.impressions || 0,
      deliveredCount: m.impressions || 0,
      clickedCount: m.clicks || 0,
      leadsCount: m.leadsCount || 0,
      spend: m.spend || 0,
      createdAt: m.createdAt || new Date().toISOString(),
      projectName: m.integration?.name || "Facebook Feed / Story",
      providerName: "Meta Graph API",
      detailUrl: `/dashboard/marketing/ads/meta/campaigns/${m.id}`,
    });
  });

  // 6. Instagram Ads
  instagramCampaigns.forEach((ig) => {
    list.push({
      id: ig.id,
      type: "INSTAGRAM",
      title: ig.name || "Instagram Vertical Reels Campaign",
      previewText: `Placement: 9:16 Vertical Reels & Stories`,
      status: ig.status || "ACTIVE",
      totalRecipients: ig.reach || 0,
      sentCount: ig.impressions || 0,
      deliveredCount: ig.impressions || 0,
      clickedCount: ig.clicks || 0,
      leadsCount: ig.leadsCount || 0,
      spend: ig.spend || 0,
      createdAt: ig.createdAt || new Date().toISOString(),
      projectName: "Instagram Business",
      providerName: "Instagram Graph API",
      detailUrl: `/dashboard/marketing/ads/instagram/campaigns/${ig.id}`,
    });
  });

  // 7. Google Ads
  googleCampaigns.forEach((g) => {
    list.push({
      id: g.id,
      type: "GOOGLE",
      title: g.name || "Google Search & Display Lead Form",
      previewText: `Network: Google Search & Discovery Network`,
      status: g.status || "ACTIVE",
      totalRecipients: g.impressions || 0,
      sentCount: g.impressions || 0,
      deliveredCount: g.impressions || 0,
      clickedCount: g.clicks || 0,
      leadsCount: g.leadsCount || 0,
      spend: g.spend || 0,
      createdAt: g.createdAt || new Date().toISOString(),
      projectName: "Google Ads MCC",
      providerName: "Google Ads API",
      detailUrl: `/dashboard/marketing/ads/google/campaigns/${g.id}`,
    });
  });

  // 8. YouTube Video Ads
  youtubeCampaigns.forEach((y) => {
    list.push({
      id: y.id,
      type: "YOUTUBE",
      title: y.name || "YouTube TrueView Video Campaign",
      previewText: `Format: Skippable In-Stream & Video Action`,
      status: y.status || "ACTIVE",
      totalRecipients: y.impressions || 0,
      sentCount: y.impressions || 0,
      deliveredCount: y.impressions || 0,
      clickedCount: y.clicks || 0,
      leadsCount: y.leadsCount || 0,
      spend: y.spend || 0,
      createdAt: y.createdAt || new Date().toISOString(),
      projectName: "YouTube Video Action",
      providerName: "Google Video Partner",
      detailUrl: `/dashboard/marketing/ads/youtube/campaigns/${y.id}`,
    });
  });

  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
