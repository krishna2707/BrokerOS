"use client";

// ============================================================================
// BrokerOS — Department-Scoped WhatsApp Inbox Page Client
// ============================================================================

import React, { Suspense } from "react";
import { WhatsAppInboxView } from "./WhatsAppInboxView";
import { MessageSquare } from "lucide-react";

interface DepartmentWhatsAppPageClientProps {
  title: string;
  subtitle: string;
  department: string;
  scope?: "my" | "team" | "all";
  showManagerFilter?: boolean;
}

export function DepartmentWhatsAppPageClient({
  title,
  subtitle,
  department,
  scope = "my",
  showManagerFilter = false,
}: DepartmentWhatsAppPageClientProps) {
  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between pb-1 border-b border-border-default/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">{title}</h1>
            <p className="text-xs text-text-secondary">{subtitle}</p>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="h-[600px] flex items-center justify-center text-xs text-text-tertiary">
            Loading departmental WhatsApp inbox...
          </div>
        }
      >
        <WhatsAppInboxView
          department={department}
          scope={scope}
          showManagerFilter={showManagerFilter}
        />
      </Suspense>
    </div>
  );
}
