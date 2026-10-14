"use client";

// ============================================================================
// BrokerOS — Admin SMS Operational Gateway Settings
// ============================================================================

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  Zap,
  Loader2,
  RefreshCw,
  Phone,
} from "lucide-react";
import { SMS_PROVIDERS } from "@brokeros/constants";
import type { SmsProviderType, SmsIntegrationRecord } from "@/features/marketing/types";
import { SmsConnectModal } from "../config/SmsConnectModal";
import { Button } from "@/components/ui/Button";

export function AdminSmsSettings() {
  const [integrations, setIntegrations] = useState<SmsIntegrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProviderForConnect, setSelectedProviderForConnect] = useState<SmsProviderType | null>(null);
  const [updatingDefaultId, setUpdatingDefaultId] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/marketing/sms/integrations`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error("Failed to load SMS integrations:", err);
      toast.error("Failed to load SMS gateways");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleSetDefault = async (integrationId: string) => {
    try {
      setUpdatingDefaultId(integrationId);
      const res = await fetch(`${baseUrl}/api/marketing/sms/integrations/${integrationId}/default`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to set default SMS gateway");
      toast.success("Active operational SMS gateway updated successfully");
      await fetchIntegrations();
    } catch (err: any) {
      toast.error(err.message || "Failed to update default SMS gateway");
    } finally {
      setUpdatingDefaultId(null);
    }
  };

  const handleConnect = async (payload: Record<string, unknown>) => {
    try {
      const res = await fetch(`${baseUrl}/api/marketing/sms/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...payload, isDefault: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to connect SMS provider");
      }
      toast.success("SMS gateway connected and set as default operational gateway");
      setSelectedProviderForConnect(null);
      await fetchIntegrations();
    } catch (err: any) {
      toast.error(err.message || "Connection failed");
    }
  };

  const providerKeys = Object.keys(SMS_PROVIDERS) as SmsProviderType[];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 m-0">
                Default Operational SMS Gateway
              </h3>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl mt-1">
              Select and connect your brokerage's single primary operational SMS gateway. All 1-on-1 CRM departments
              (Pre-Sales, Sales, Post-Sales, CP Sourcing, Closing, and Finance) automatically route outbound text messages through this verified line.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchIntegrations}
            disabled={loading}
            className="shrink-0 h-8 text-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* 9-Provider Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providerKeys.map((key) => {
            const catalog = SMS_PROVIDERS[key];
            const connectedRecord = integrations.find((i) => i.provider === key);
            const isDefault = connectedRecord?.isDefault ?? false;
            const isConnected = !!connectedRecord;

            return (
              <div
                key={key}
                className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between ${
                  isDefault
                    ? "bg-sky-50/40 border-sky-300 ring-2 ring-sky-500/20 shadow-xs"
                    : isConnected
                    ? "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-900 tracking-tight">
                      {catalog.name}
                    </span>
                    {isDefault ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Active Default</span>
                      </span>
                    ) : isConnected ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                        Available
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {catalog.description}
                  </p>

                  {connectedRecord && (
                    <div className="text-[11px] font-medium text-slate-700 bg-white/80 rounded-xl px-2.5 py-1.5 border border-slate-200/80 mb-3 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        Sender: <strong className="font-semibold text-slate-800">{connectedRecord.fromSender || "System Header"}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {catalog.docsUrl && (
                    <a
                      href={catalog.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 font-medium"
                    >
                      <span>Docs</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}

                  <div className="ml-auto">
                    {isDefault ? (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>In Use</span>
                      </span>
                    ) : isConnected ? (
                      <button
                        onClick={() => handleSetDefault(connectedRecord.id)}
                        disabled={updatingDefaultId === connectedRecord.id}
                        className="h-7 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        {updatingDefaultId === connectedRecord.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Zap className="w-3 h-3" />
                        )}
                        <span>Set as Default</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedProviderForConnect(key)}
                        className="h-7 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <span>Connect</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedProviderForConnect && (
        <SmsConnectModal
          selectedProvider={selectedProviderForConnect}
          onClose={() => setSelectedProviderForConnect(null)}
          onConnect={handleConnect}
        />
      )}
    </div>
  );
}
