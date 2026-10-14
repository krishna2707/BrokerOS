"use client";

// ============================================================================
// BrokerOS — Department-Scoped Email Inbox Page Client
// ============================================================================

import React, { Suspense } from "react";
import { EmailInboxView } from "./EmailInboxView";
import { Mail } from "lucide-react";

interface DepartmentEmailPageClientProps {
  title: string;
  subtitle: string;
  department: string;
  scope?: "my" | "team" | "all";
  showManagerFilter?: boolean;
}

export function DepartmentEmailPageClient({
  title,
  subtitle,
  department,
  scope = "my",
  showManagerFilter = false,
}: DepartmentEmailPageClientProps) {
  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between pb-1 border-b border-border-default/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Mail className="w-5 h-5" />
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
            Loading departmental Email inbox...
          </div>
        }
      >
        <EmailInboxView
          department={department}
          scope={scope}
          showManagerFilter={showManagerFilter}
        />
      </Suspense>
    </div>
  );
}
