"use client";

import React from "react";
import { Key, Plus, ExternalLink } from "lucide-react";
import { EMAIL_PROVIDERS } from "@brokeros/constants";
import type { EmailProviderType } from "@/features/marketing/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface ProviderCatalogGridProps {
  onConnectClick: (provider: EmailProviderType) => void;
}

export function ProviderCatalogGrid({ onConnectClick }: ProviderCatalogGridProps) {
  const providersList = [
    "AWS_SES",
    "SENDGRID",
    "BREVO",
    "MAILCHIMP",
    "MAILGUN",
    "GMAIL",
    "OUTLOOK",
    "CONSTANT_CONTACT",
  ] as const;

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Available Provider Adapters</h3>
        <p className="text-xs font-medium text-[var(--text-tertiary)]">
          Connect high-scale delivery APIs to route broadcasts through your own billing accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {providersList.map((prov) => {
          const config = (EMAIL_PROVIDERS as Record<string, any>)[prov];
          if (!config) return null;

          return (
            <div
              key={prov}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-[var(--brand-600)] shadow-xs">
                    <Key className="w-4 h-4" />
                  </div>
                  <Badge variant="default" className="text-[10px]">BYO</Badge>
                </div>
                <h4 className="text-xs font-extrabold text-[var(--text-primary)]">{config.name}</h4>
                <p className="text-[11px] font-medium text-[var(--text-tertiary)] mt-1 line-clamp-2">
                  {config.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={config.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-[var(--brand-600)] hover:underline inline-flex items-center gap-1"
                >
                  <span>API Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onConnectClick(prov)}
                  className="h-7 px-2.5 text-[11px] font-bold gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Connect</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
