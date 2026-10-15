"use client";

import React, { useState, useEffect } from "react";
import {
  type TelephonyConfig,
  type ProviderMeta,
  PROVIDERS,
  TelephonyHeaderBanner,
  TelephonyTestCallDrawer,
  TelephonyProvidersGrid,
  ConnectTelephonyModal,
} from "./settings";

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
    if (
      !confirm(
        "Are you sure you want to disconnect this telephony line? Internal agents will not be able to place web calls until another carrier is connected."
      )
    ) {
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
      <TelephonyHeaderBanner
        activeConfig={activeConfig}
        loading={loading}
        onRefresh={fetchConfig}
      />

      {/* Test Verification Drawer if Active */}
      <TelephonyTestCallDrawer
        activeConfig={activeConfig}
        testNumber={testNumber}
        setTestNumber={setTestNumber}
        onTriggerTestCall={handleTriggerTestCall}
        testing={testing}
        testResult={testResult}
      />

      {/* 4 Providers Grid */}
      <TelephonyProvidersGrid
        providers={PROVIDERS}
        activeConfig={activeConfig}
        onDisconnect={handleDisconnect}
        onOpenConnect={handleOpenConnect}
      />

      {/* Modal: Connect Provider */}
      <ConnectTelephonyModal
        selectedProvider={selectedProvider}
        onClose={() => setSelectedProvider(null)}
        formData={formData}
        setFormData={setFormData}
        errorMsg={errorMsg}
        onSubmit={handleConnectSubmit}
        saving={saving}
      />
    </div>
  );
}
