"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { EMAIL_PROVIDERS } from "@brokeros/constants";
import type { EmailProviderType, IntegrationRecord } from "@/features/marketing/types";
export type { IntegrationRecord };

import {
  DefaultEngineCard,
  ConnectedAccountsList,
  ProviderCatalogGrid,
  ConnectProviderModal,
  AddDomainModal,
} from "./provider-card";

export interface EmailProviderConfigCardProps {
  integrations: IntegrationRecord[];
  onConnect: (payload: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSyncDomains?: (id: string) => Promise<void>;
  onAddDomain?: (integrationId: string, payload: any) => Promise<void>;
  onDeleteDomain?: (domainId: string) => Promise<void>;
}

export function EmailProviderConfigCard({
  integrations,
  onConnect,
  onDelete,
  onSyncDomains,
  onAddDomain,
  onDeleteDomain,
}: EmailProviderConfigCardProps) {
  const [selectedProvider, setSelectedProvider] = useState<EmailProviderType | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [addingDomainIntegrationId, setAddingDomainIntegrationId] = useState<string | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [domainFormData, setDomainFormData] = useState({
    fromEmail: "",
    fromName: "Sales Team",
    dailyQuota: 500,
  });
  const [formData, setFormData] = useState({
    name: "",
    fromName: "Skyline Realty Marketing",
    fromEmail: "marketing@skylinerealty.com",
    apiKey: "",
    awsAccessKeyId: "",
    awsSecretKey: "",
    awsRegion: "ap-south-1",
    mailchimpServer: "us20",
    mailgunDomain: "",
    mailgunRegion: "US",
    oauthClientId: "",
    oauthClientSecret: "",
    oauthRefreshToken: "",
    oauthTenantId: "common",
    googleAppPassword: "",
    authType: "app_password" as "app_password" | "oauth",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = (provider: EmailProviderType) => {
    setSelectedProvider(provider);
    const provName = (EMAIL_PROVIDERS as Record<string, any>)[provider]?.name || provider;
    setFormData({
      name: `${provName} Account`,
      fromName: "Skyline Realty Marketing",
      fromEmail:
        provider === "GMAIL"
          ? "agent@gmail.com"
          : provider === "OUTLOOK"
          ? "sales@outlook.com"
          : "marketing@skylinerealty.com",
      apiKey: "",
      awsAccessKeyId: "",
      awsSecretKey: "",
      awsRegion: "ap-south-1",
      mailchimpServer: "us20",
      mailgunDomain: "",
      mailgunRegion: "US",
      oauthClientId: "",
      oauthClientSecret: "",
      oauthRefreshToken: "",
      oauthTenantId: "common",
      googleAppPassword: "",
      authType: "app_password",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    setIsSubmitting(true);
    try {
      await onConnect({
        provider: selectedProvider,
        ...formData,
      });
      toast.success("Email provider verified and connected successfully");
      setSelectedProvider(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to verify and connect provider");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingDomainIntegrationId || !onAddDomain) return;
    setDomainError(null);
    setIsSubmitting(true);
    try {
      await onAddDomain(addingDomainIntegrationId, domainFormData);
      setAddingDomainIntegrationId(null);
      setDomainFormData({ fromEmail: "", fromName: "Sales Team", dailyQuota: 500 });
    } catch (err: any) {
      const activeInt = integrations.find((i) => i.id === addingDomainIntegrationId);
      const providerName = activeInt
        ? (EMAIL_PROVIDERS as Record<string, any>)[activeInt.provider]?.name || activeInt.provider
        : "Email Provider";
      setDomainError(err?.message || `Failed to verify identity with ${providerName}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartAddDomain = (integrationId: string, fromName: string) => {
    setAddingDomainIntegrationId(integrationId);
    setDomainError(null);
    setDomainFormData({
      fromEmail: "",
      fromName: fromName || "Sales Team",
      dailyQuota: 500,
    });
  };

  return (
    <div className="space-y-6">
      {/* ── 1. BROKEROS SYSTEM DEFAULT ENGINE ── */}
      <DefaultEngineCard />

      {/* ── 2. ACTIVE USER INTEGRATIONS ── */}
      <ConnectedAccountsList
        integrations={integrations}
        syncingId={syncingId}
        onDelete={onDelete}
        onSyncDomains={onSyncDomains}
        onDeleteDomain={onDeleteDomain}
        onStartAddDomain={handleStartAddDomain}
        onSetSyncingId={setSyncingId}
      />

      {/* ── 3. AVAILABLE ADAPTERS DIRECTORY ── */}
      <ProviderCatalogGrid onConnectClick={handleOpenModal} />

      {/* ── 4. CONNECT MODAL DIALOG ── */}
      <ConnectProviderModal
        selectedProvider={selectedProvider}
        onClose={() => setSelectedProvider(null)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* ── 5. ADD SENDER IDENTITY MODAL ── */}
      <AddDomainModal
        addingDomainIntegrationId={addingDomainIntegrationId}
        integrations={integrations}
        domainError={domainError}
        domainFormData={domainFormData}
        setDomainFormData={setDomainFormData}
        onClose={() => {
          setAddingDomainIntegrationId(null);
          setDomainError(null);
        }}
        onSubmit={handleAddDomainSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
