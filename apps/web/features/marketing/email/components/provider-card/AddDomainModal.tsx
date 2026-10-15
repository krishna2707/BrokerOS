"use client";

import React from "react";
import { X, AlertTriangle, RefreshCw } from "lucide-react";
import { EMAIL_PROVIDERS } from "@brokeros/constants";
import type { IntegrationRecord } from "@/features/marketing/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface AddDomainModalProps {
  addingDomainIntegrationId: string | null;
  integrations: IntegrationRecord[];
  domainError: string | null;
  domainFormData: {
    fromEmail: string;
    fromName: string;
    dailyQuota: number;
  };
  setDomainFormData: React.Dispatch<
    React.SetStateAction<{
      fromEmail: string;
      fromName: string;
      dailyQuota: number;
    }>
  >;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export function AddDomainModal({
  addingDomainIntegrationId,
  integrations,
  domainError,
  domainFormData,
  setDomainFormData,
  onClose,
  onSubmit,
  isSubmitting,
}: AddDomainModalProps) {
  if (!addingDomainIntegrationId) return null;

  const activeInt = integrations.find((i) => i.id === addingDomainIntegrationId);
  const providerName = activeInt
    ? (EMAIL_PROVIDERS as Record<string, any>)[activeInt.provider]?.name || activeInt.provider
    : "Email Provider";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 max-w-md w-full p-6 shadow-xl space-y-4 animate-enter">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                Add Sender Identity / Mailbox
              </h3>
              {activeInt && (
                <Badge variant="default" className="text-[10px]">
                  {activeInt.provider}
                </Badge>
              )}
            </div>
            <p className="text-[11px] font-medium text-[var(--text-tertiary)] mt-0.5">
              Will verify identity directly with {providerName} API before adding.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {domainError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1 font-medium">{domainError}</div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1">
              From Email Address
            </label>
            <input
              type="email"
              required
              disabled={isSubmitting}
              placeholder="promotions@yourbrokerage.com"
              value={domainFormData.fromEmail}
              onChange={(e) =>
                setDomainFormData({ ...domainFormData, fromEmail: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs disabled:opacity-50"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Must be a verified sender or belongs to an authenticated domain on your {providerName} account.
            </p>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1">
              Sender Display Name
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              placeholder="Skyline Offers & Updates"
              value={domainFormData.fromName}
              onChange={(e) =>
                setDomainFormData({ ...domainFormData, fromName: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1">
              Daily Quota Cap
            </label>
            <input
              type="number"
              min="50"
              max="100000"
              disabled={isSubmitting}
              value={domainFormData.dailyQuota}
              onChange={(e) =>
                setDomainFormData({
                  ...domainFormData,
                  dailyQuota: Number(e.target.value),
                })
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs disabled:opacity-50"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              Limits dispatches per day to preserve domain deliverability reputation.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
              <span>{isSubmitting ? "Verifying with Provider..." : "Verify & Save Identity"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
