"use client";

import React from "react";
import { Zap, CheckCircle2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function DefaultEngineCard() {
  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-purple-50 text-[var(--brand-600)] shadow-xs">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                BrokerOS Master Engine (Amazon SES Dedicated)
              </h3>
              <Badge variant="success" className="text-[10px]">
                Master Default
              </Badge>
            </div>
            <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">
              Pre-configured high-throughput sending engine with automated SPF, DKIM, and DMARC alignment.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-semibold text-[var(--text-secondary)]">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> High Inbox Reputation
              </span>
              <span className="flex items-center gap-1 text-purple-600">
                <ShieldCheck className="w-3.5 h-3.5" /> Dedicated IP Warmup
              </span>
              <span className="text-[var(--text-muted)] font-mono text-[11px]">
                Region: ap-south-1 (Mumbai)
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:items-end justify-between self-stretch shrink-0">
          <Badge variant="brand" className="text-[11px] font-extrabold">
            0 Setup Required
          </Badge>
          <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
            Flat rate: $0.10 / 1,000 emails
          </span>
        </div>
      </div>
    </div>
  );
}
