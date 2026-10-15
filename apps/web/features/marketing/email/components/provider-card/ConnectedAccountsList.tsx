"use client";

import React from "react";
import {
  Key,
  Trash2,
  Globe,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { IntegrationRecord } from "@/features/marketing/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface ConnectedAccountsListProps {
  integrations: IntegrationRecord[];
  syncingId: string | null;
  onDelete: (id: string) => Promise<void>;
  onSyncDomains?: (id: string) => Promise<void>;
  onDeleteDomain?: (domainId: string) => Promise<void>;
  onStartAddDomain: (integrationId: string, fromName: string) => void;
  onSetSyncingId: (id: string | null) => void;
}

export function ConnectedAccountsList({
  integrations,
  syncingId,
  onDelete,
  onSyncDomains,
  onDeleteDomain,
  onStartAddDomain,
  onSetSyncingId,
}: ConnectedAccountsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Connected BYO Adapters</h3>
          <p className="text-xs font-medium text-[var(--text-tertiary)]">
            Custom marketing provider accounts connected to your BrokerOS workspace.
          </p>
        </div>
      </div>

      {integrations.length === 0 ? (
        <div className="p-8 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center">
          <Key className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-[var(--text-primary)]">No custom providers connected yet</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Connect your own SendGrid, Brevo, Mailchimp, AWS SES, Mailgun, Gmail, Outlook, or Constant Contact accounts below.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {integrations.map((int) => {
            const domains = int.senderDomains || [];
            const isSyncing = syncingId === int.id;

            return (
              <div
                key={int.id}
                className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-[var(--text-primary)]">{int.name}</h4>
                        <Badge variant="default" className="text-[10px]">
                          {int.provider}
                        </Badge>
                        {int.isDefault && (
                          <Badge variant="brand" className="text-[10px]">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                        Account Default: <span className="text-[var(--text-primary)] font-bold">{int.fromEmail}</span> ({int.fromName})
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(int.id)}
                      className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-xl"
                      title="Disconnect Provider"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Sender Domains Section */}
                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-[11px] font-extrabold text-[var(--text-primary)] uppercase tracking-wider">
                          Sender Domains & Mailboxes ({domains.length})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onSyncDomains && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isSyncing}
                            onClick={async () => {
                              onSetSyncingId(int.id);
                              try {
                                await onSyncDomains(int.id);
                              } finally {
                                onSetSyncingId(null);
                              }
                            }}
                            className="h-6 px-2 text-[10px] font-bold gap-1 rounded-lg"
                            title="Fetch verified sender identities directly from provider API"
                          >
                            <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-purple-600" : ""}`} />
                            <span>{isSyncing ? "Syncing..." : "Sync Senders"}</span>
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onStartAddDomain(int.id, int.fromName || "Sales Team")}
                          className="h-6 px-2 text-[10px] font-bold gap-1 rounded-lg text-purple-700 bg-purple-50/60 hover:bg-purple-100/80 border-purple-200"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Identity</span>
                        </Button>
                      </div>
                    </div>

                    {domains.length === 0 ? (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                        <p className="text-[11px] font-medium text-[var(--text-muted)]">
                          No sender domains registered yet. Click &quot;Sync Senders&quot; to auto-discover or add manually.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {domains.map((d) => (
                          <div
                            key={d.id}
                            className="p-2.5 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {d.isVerified ? (
                                <span title="Verified identity" className="inline-flex shrink-0">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                </span>
                              ) : (
                                <span title="Unverified" className="inline-flex shrink-0">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                </span>
                              )}
                              <div className="truncate">
                                <span className="font-bold text-[var(--text-primary)]">{d.fromEmail}</span>
                                <span className="text-[10px] text-[var(--text-muted)] ml-1.5">({d.fromName})</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-600 text-[9px] font-bold rounded-md">
                                {d.domain}
                              </span>
                              <span className="text-[10px] font-semibold text-[var(--text-tertiary)]">
                                {d.dailyQuota}/day
                              </span>
                              {d.isWarmupMode && (
                                <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold rounded-md">
                                  Warmup
                                </span>
                              )}
                              {onDeleteDomain && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onDeleteDomain(d.id)}
                                  className="h-5 w-5 text-slate-400 hover:text-rose-500 rounded-md p-0"
                                  title="Remove sender domain"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready for dispatch
                  </span>
                  <span className="text-[var(--text-muted)]">
                    Connected {new Date(int.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
