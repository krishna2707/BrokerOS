"use client";

import React from "react";
import {
  Send,
  Phone,
  Mail,
  MessageSquare,
  Globe,
} from "lucide-react";
import { InstagramIcon as Instagram } from "@/features/marketing/ads/instagram/components/InstagramIcon";
import { GoogleIcon } from "@/features/marketing/ads/google/components/GoogleIcon";
import { YouTubeIcon } from "@/features/marketing/ads/youtube/components/YouTubeIcon";
import type { UnifiedMarketingChannelType } from "@/features/marketing/components/UnifiedBroadcastsTable";

export interface MarketingHubChannelTabsProps {
  activeChannelTab: "ALL" | UnifiedMarketingChannelType;
  setActiveChannelTab: (tab: "ALL" | UnifiedMarketingChannelType) => void;
  counts: {
    all: number;
    whatsApp: number;
    voice: number;
    email: number;
    sms: number;
    facebook: number;
    instagram: number;
    google: number;
    youtube: number;
  };
}

export function MarketingHubChannelTabs({
  activeChannelTab,
  setActiveChannelTab,
  counts,
}: MarketingHubChannelTabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 self-start sm:self-auto overflow-x-auto max-w-full">
      <button
        onClick={() => setActiveChannelTab("ALL")}
        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
          activeChannelTab === "ALL"
            ? "bg-white text-[var(--text-primary)] shadow-xs"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        }`}
      >
        <span>All ({counts.all})</span>
      </button>

      <button
        onClick={() => setActiveChannelTab("WHATSAPP")}
        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
          activeChannelTab === "WHATSAPP"
            ? "bg-white text-emerald-700 shadow-xs"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        }`}
      >
        <Send className="w-3.5 h-3.5 text-emerald-600" />
        <span>WhatsApp ({counts.whatsApp})</span>
      </button>

      <button
        onClick={() => setActiveChannelTab("VOICE")}
        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
          activeChannelTab === "VOICE"
            ? "bg-white text-indigo-700 shadow-xs"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        }`}
      >
        <Phone className="w-3.5 h-3.5 text-indigo-600" />
        <span>Voice ({counts.voice})</span>
      </button>

      <button
        onClick={() => setActiveChannelTab("EMAIL")}
        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
          activeChannelTab === "EMAIL"
            ? "bg-white text-purple-700 shadow-xs"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        }`}
      >
        <Mail className="w-3.5 h-3.5 text-purple-600" />
        <span>Email ({counts.email})</span>
      </button>

      <button
        onClick={() => setActiveChannelTab("SMS")}
        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
          activeChannelTab === "SMS"
            ? "bg-white text-amber-700 shadow-xs"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        }`}
      >
        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
        <span>SMS ({counts.sms})</span>
      </button>

      <button
        onClick={() => setActiveChannelTab("FACEBOOK")}
        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
          activeChannelTab === "FACEBOOK"
            ? "bg-white text-blue-700 shadow-xs"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        }`}
      >
        <Globe className="w-3.5 h-3.5 text-blue-600" />
        <span>Facebook ({counts.facebook})</span>
      </button>

      <button
        onClick={() => setActiveChannelTab("INSTAGRAM")}
        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
          activeChannelTab === "INSTAGRAM"
            ? "bg-white text-pink-700 shadow-xs"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        }`}
      >
        <Instagram className="w-3.5 h-3.5 text-pink-600" />
        <span>Instagram ({counts.instagram})</span>
      </button>

      <button
        onClick={() => setActiveChannelTab("GOOGLE")}
        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
          activeChannelTab === "GOOGLE"
            ? "bg-white text-red-700 shadow-xs"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        }`}
      >
        <GoogleIcon size={14} />
        <span>Google ({counts.google})</span>
      </button>

      <button
        onClick={() => setActiveChannelTab("YOUTUBE")}
        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
          activeChannelTab === "YOUTUBE"
            ? "bg-white text-rose-700 shadow-xs"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        }`}
      >
        <YouTubeIcon size={14} />
        <span>YouTube ({counts.youtube})</span>
      </button>
    </div>
  );
}
