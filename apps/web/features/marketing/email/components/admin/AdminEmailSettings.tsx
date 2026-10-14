"use client";

// ============================================================================
// BrokerOS — Admin Email Operational Gateway Settings
// ============================================================================

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Mail,
  CheckCircle2,
  ExternalLink,
  Zap,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { EMAIL_PROVIDERS } from "@brokeros/constants";
import type { EmailProviderType, IntegrationRecord } from "@/features/marketing/types";
import { Button } from "@/components/ui/Button";

export function AdminEmailSettings() {
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProviderForConnect, setSelectedProviderForConnect] = useState<EmailProviderType | null>(null);
  const [updatingDefaultId, setUpdatingDefaultId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal form data
  const [formData, setFormData] = useState({
    name: "",
    fromEmail: "",
    fromName: "Sales Team",
    apiKey: "",
    awsAccessKeyId: "",
    awsSecretKey: "",
    awsRegion: "ap-south-1",
    mailgunDomain: "",
    mailgunRegion: "us",
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/marketing/integrations`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error("Failed to load email integrations:", err);
      toast.error("Failed to load email services");
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
      const res = await fetch(`${baseUrl}/api/marketing/integrations/${integrationId}/default`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to set default email service");
      toast.success("Active operational email service updated successfully");
      await fetchIntegrations();
    } catch (err: any) {
      toast.error(err.message || "Failed to update default email service");
    } finally {
      setUpdatingDefaultId(null);
    }
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderForConnect) return;
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        provider: selectedProviderForConnect,
        name: formData.name.trim() || `${EMAIL_PROVIDERS[selectedProviderForConnect]?.name || selectedProviderForConnect} Gateway`,
        fromEmail: formData.fromEmail.trim(),
        fromName: formData.fromName.trim() || "Sales Team",
        isDefault: true,
      };

      if (formData.apiKey) payload.apiKey = formData.apiKey.trim();
      if (formData.awsAccessKeyId) payload.awsAccessKeyId = formData.awsAccessKeyId.trim();
      if (formData.awsSecretKey) payload.awsSecretKey = formData.awsSecretKey.trim();
      if (formData.awsRegion) payload.awsRegion = formData.awsRegion.trim();
      if (formData.mailgunDomain) payload.mailgunDomain = formData.mailgunDomain.trim();

      const res = await fetch(`${baseUrl}/api/marketing/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to connect email service");
      }

      toast.success("Email service connected and set as operational default");
      setSelectedProviderForConnect(null);
      setFormData({
        name: "",
        fromEmail: "",
        fromName: "Sales Team",
        apiKey: "",
        awsAccessKeyId: "",
        awsSecretKey: "",
        awsRegion: "ap-south-1",
        mailgunDomain: "",
        mailgunRegion: "us",
      });
      await fetchIntegrations();
    } catch (err: any) {
      toast.error(err.message || "Connection failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const providerKeys = (Object.keys(EMAIL_PROVIDERS) as EmailProviderType[]).filter(
    (k) => k !== "MULTI_PROVIDER"
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Mail className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 m-0">
                Default Operational Email Service
              </h3>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl mt-1">
              Select and connect your brokerage's primary operational email service. All 1-on-1 CRM departments
              (Pre-Sales, Sales, Post-Sales, CP Sourcing, Closing, and Finance) automatically route outbound customer emails through this verified domain.
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

        {/* Email Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providerKeys.map((key) => {
            const catalog = EMAIL_PROVIDERS[key];
            const connectedRecord = integrations.find((i) => i.provider === key);
            const isDefault = connectedRecord?.isDefault ?? false;
            const isConnected = !!connectedRecord;

            return (
              <div
                key={key}
                className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between ${
                  isDefault
                    ? "bg-purple-50/40 border-purple-300 ring-2 ring-purple-500/20 shadow-xs"
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
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        From: <strong className="font-semibold text-slate-800">{connectedRecord.fromEmail}</strong>
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
                      className="text-[11px] text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 font-medium"
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
                        className="h-7 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
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

      {/* Connect Modal */}
      {selectedProviderForConnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="text-sm font-bold text-slate-900">
                Connect {EMAIL_PROVIDERS[selectedProviderForConnect]?.name || selectedProviderForConnect}
              </h4>
              <button
                onClick={() => setSelectedProviderForConnect(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnectSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Verified From Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="sales@yourbrokerage.com"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Sender Display Name
                </label>
                <input
                  type="text"
                  placeholder="Skyline Sales Team"
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {selectedProviderForConnect !== "SYSTEM_DEFAULT" && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    API Key / Access Token *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter provider API key"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              {selectedProviderForConnect === "AWS_SES" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      AWS Access Key ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      value={formData.awsAccessKeyId}
                      onChange={(e) => setFormData({ ...formData, awsAccessKeyId: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      AWS Secret Key *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      value={formData.awsSecretKey}
                      onChange={(e) => setFormData({ ...formData, awsSecretKey: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProviderForConnect(null)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  <span>Save and Set Default</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
