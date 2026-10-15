"use client";

import React from "react";
import {
  PhoneCall,
  RefreshCw,
  Radio,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TelephonyConfig } from "./constants";

export interface TelephonyHeaderBannerProps {
  activeConfig: TelephonyConfig | null;
  loading: boolean;
  onRefresh: () => void;
}

export function TelephonyHeaderBanner({
  activeConfig,
  loading,
  onRefresh,
}: TelephonyHeaderBannerProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--brand-50)] border border-[var(--brand-200)] flex items-center justify-center text-[var(--brand-600)] shrink-0">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Company-Wide Telephony & WebRTC Calling
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Single Carrier Mode
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Connect exactly one telephony carrier trunk to enable in-browser real-time WebRTC calling for all CRM departments (Pre-Sales, Sales Executives, Post-Sales, Sourcing, Closing). Supports 20+ simultaneous agent calls with automated call recording and AI transcription.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="self-start md:self-auto shrink-0"
        >
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Status
        </Button>
      </div>

      {/* Active Carrier Status Banner */}
      <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3.5 h-3.5 rounded-full ${activeConfig ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
              Active Telephony Status
            </span>
            <span className="text-sm font-bold text-slate-800">
              {activeConfig ? (
                <span className="text-emerald-700">
                  Connected: {activeConfig.provider} ({activeConfig.name})
                </span>
              ) : (
                <span className="text-slate-500">
                  No Telephony Connected (Web Calling Disabled)
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Concurrency: <strong>20+ Parallel Calls</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-purple-600" />
            <span>Dual-Channel Audio Recording: <strong>Enabled</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Groq AI Whisper: <strong>Active</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
