"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Shield,
  Zap,
  Globe,
  Radio,
  Server,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TelephonyConfig {
  id: string;
  provider: "TWILIO" | "VOBIZ" | "EXOTEL" | "TELNYX";
  name: string;
  isActive: boolean;
  accountSid?: string | null;
  apiKey?: string | null;
  subdomain?: string | null;
  sipDomain?: string | null;
  fromNumbers?: string[];
  applicationSid?: string | null;
  updatedAt?: string;
}

interface ProviderMeta {
  key: "TWILIO" | "VOBIZ" | "EXOTEL" | "TELNYX";
  title: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
  docsUrl: string;
}

const PROVIDERS: ProviderMeta[] = [
  {
    key: "TWILIO",
    title: "Twilio Voice",
    tagline: "Direct in-browser WebRTC VoIP & PSTN calling via Twilio Voice SDK",
    badge: "Recommended for WebRTC",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    docsUrl: "https://www.twilio.com/docs/voice",
    fields: [
      { key: "accountSid", label: "Account SID (Required)", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      { key: "authToken", label: "Auth Token (Required)", placeholder: "your_auth_token", secret: true },
      { key: "fromNumber", label: "Registered Caller ID (From)", placeholder: "+12025550199" },
      { key: "apiKey", label: "API Key SID (Optional - auto-generated if blank)", placeholder: "SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      { key: "apiToken", label: "API Key Secret (Optional - auto-generated if blank)", placeholder: "your_api_secret", secret: true },
      { key: "applicationSid", label: "TwiML Application SID (Optional - auto-generated if blank)", placeholder: "APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
    ],
  },
  {
    key: "TELNYX",
    title: "Telnyx",
    tagline: "High-capacity telecom carrier with native WebRTC & SIP trunking",
    badge: "Lowest PSTN Rates",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    docsUrl: "https://developers.telnyx.com/docs/webrtc",
    fields: [
      { key: "apiKey", label: "Telnyx API Key", placeholder: "KEYxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "applicationSid", label: "Call Control Application ID", placeholder: "your_app_id" },
      { key: "fromNumber", label: "Caller ID / Outbound DID", placeholder: "+12025550188" },
    ],
  },
  {
    key: "EXOTEL",
    title: "Exotel Cloud Telephony",
    tagline: "Enterprise Indian telecom carrier with virtual number bridging",
    badge: "India / APAC Specialist",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    docsUrl: "https://developer.exotel.com",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "your_exotel_api_key" },
      { key: "apiToken", label: "API Token", placeholder: "your_exotel_token", secret: true },
      { key: "accountSid", label: "Account SID", placeholder: "your_exotel_sid" },
      { key: "subdomain", label: "API Subdomain", placeholder: "api.exotel.com" },
      { key: "fromNumber", label: "ExoPhone Virtual Number", placeholder: "080xxxxxxxx" },
    ],
  },
  {
    key: "VOBIZ",
    title: "Vobiz Telephony",
    tagline: "Low-latency bidirectional media stream voice infrastructure",
    badge: "High Concurrency",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    docsUrl: "https://vobiz.ai",
    fields: [
      { key: "apiKey", label: "Auth ID (X-Auth-ID)", placeholder: "vobiz_auth_id" },
      { key: "apiToken", label: "Auth Token (X-Auth-Token)", placeholder: "vobiz_token", secret: true },
      { key: "fromNumber", label: "Registered Caller ID", placeholder: "+12025550177" },
    ],
  },
];

export function AdminTelephonySettings() {
  const [activeConfig, setActiveConfig] = useState<TelephonyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderMeta | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testNumber, setTestNumber] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/crm";

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`${baseUrl}/telephony/config`);
      if (res.ok) {
        const data = await res.json();
        setActiveConfig(data);
      }
    } catch (err: any) {
      console.error("Failed to load CRM telephony config", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleOpenConnect = (provider: ProviderMeta) => {
    setSelectedProvider(provider);
    setFormData({
      provider: provider.key,
      name: `Primary ${provider.title} Trunk`,
    });
    setTestResult(null);
    setErrorMsg(null);
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    try {
      setSaving(true);
      setErrorMsg(null);

      const fromNumbers = formData.fromNumber
        ? [formData.fromNumber.trim()]
        : [];

      const payload = {
        provider: selectedProvider.key,
        name: formData.name || `Primary ${selectedProvider.title}`,
        accountSid: formData.accountSid,
        authToken: formData.authToken,
        apiKey: formData.apiKey,
        apiToken: formData.apiToken,
        subdomain: formData.subdomain,
        sipDomain: formData.sipDomain,
        applicationSid: formData.applicationSid,
        fromNumbers,
      };

      const res = await fetch(`${baseUrl}/telephony/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to validate credentials with telephony carrier.");
      }

      await fetchConfig();
      setSelectedProvider(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect telephony provider");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this telephony line? Internal agents will not be able to place web calls until another carrier is connected.")) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/telephony/disconnect/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to disconnect carrier.");
      }

      await fetchConfig();
    } catch (err: any) {
      alert(err.message || "Failed to disconnect");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerTestCall = async () => {
    if (!testNumber) {
      alert("Please enter a phone number to receive the test call.");
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      const res = await fetch(`${baseUrl}/telephony/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toPhone: testNumber }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `Verification call dispatched successfully! Call ID: ${data.callId || "verified"}`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || data.message || "Verification call failed.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Test call failed due to a network error.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
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
            onClick={fetchConfig}
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

      {/* Test Verification Drawer if Active */}
      {activeConfig && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Live Line Test & Verification
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Place a test call to your personal phone to verify that outbound PSTN trunking and audio delivery are active.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="tel"
                placeholder="Enter phone with country code (e.g. +1...)"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                className="h-9 px-3.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64 bg-white"
              />
              <Button
                size="sm"
                onClick={handleTriggerTestCall}
                disabled={testing || !testNumber}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {testing ? "Dialing..." : "Test Call"}
              </Button>
            </div>
          </div>

          {testResult && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${testResult.success
                ? "bg-emerald-100/70 text-emerald-800 border border-emerald-200"
                : "bg-rose-100/70 text-rose-800 border border-rose-200"
                }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      )}

      {/* 4 Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PROVIDERS.map((prov) => {
          const isCurrentActive = activeConfig?.provider === prov.key;

          return (
            <div
              key={prov.key}
              className={`rounded-2xl border p-6 bg-white transition-all shadow-xs relative flex flex-col justify-between ${isCurrentActive
                ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-md"
                : "border-slate-200 hover:border-slate-300"
                }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{prov.title}</h3>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${prov.badgeColor}`}>
                        {prov.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{prov.tagline}</p>
                  </div>

                  {isCurrentActive && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active Carrier
                    </span>
                  )}
                </div>

                {isCurrentActive && activeConfig && (
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Caller ID / From:</span>
                      <strong className="text-slate-900 font-mono">
                        {activeConfig.fromNumbers?.[0] || "Default Carrier Trunk"}
                      </strong>
                    </div>
                    {activeConfig.accountSid && (
                      <div className="flex justify-between text-slate-600">
                        <span>Account SID:</span>
                        <span className="text-slate-700 font-mono">{activeConfig.accountSid}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={prov.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
                >
                  Carrier Docs <ExternalLink className="w-3 h-3" />
                </a>

                {isCurrentActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(activeConfig.id)}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Disconnect Line
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleOpenConnect(prov)}
                    className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
                  >
                    Connect {prov.title}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Connect Provider */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[var(--brand-600)] flex items-center justify-center font-bold">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Connect {selectedProvider.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    This will become the single active calling carrier for all departments.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProvider(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleConnectSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Connection Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`Primary ${selectedProvider.title} Trunk`}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>


              {selectedProvider.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.secret ? "password" : "text"}
                    required={!["applicationSid", "apiKey", "apiToken"].includes(field.key)}
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              ))}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedProvider(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
                >
                  {saving ? "Validating & Connecting..." : "Save and Activate Carrier"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
