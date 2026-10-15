'use client';

import React, { useState } from 'react';
import { VOICE_TELEPHONY_PROVIDERS } from '@brokeros/constants';
import { toast } from 'sonner';
import type {
  VoiceTelephonyIntegrationRecord,
  VoiceTelephonyType,
} from '@/features/marketing/types';
import {
  ConnectedCarriersList,
  CarrierAdaptersDirectory,
  ConnectCarrierModal,
} from './telephony';

export interface TelephonyCarriersTabProps {
  telephonyIntegrations: VoiceTelephonyIntegrationRecord[];
  onAddTelephony: (data: any) => Promise<void>;
  onDeleteTelephony: (id: string) => Promise<void>;
}

export const TelephonyCarriersTab: React.FC<TelephonyCarriersTabProps> = ({
  telephonyIntegrations,
  onAddTelephony,
  onDeleteTelephony,
}) => {
  const [selectedTelephonyProvider, setSelectedTelephonyProvider] =
    useState<VoiceTelephonyType | null>(null);

  const [telName, setTelName] = useState('');
  const [telAccountSid, setTelAccountSid] = useState('');
  const [telAuthToken, setTelAuthToken] = useState('');
  const [telApiKey, setTelApiKey] = useState('');
  const [telApiToken, setTelApiToken] = useState('');
  const [telFromNumbers, setTelFromNumbers] = useState('');
  const [telSubdomain, setTelSubdomain] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, { isValid: boolean; latencyMs: number }>>({});

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';

  const handleVerifyCarrier = async (id: string) => {
    try {
      setVerifyingId(id);
      const res = await fetch(`${baseUrl}/api/marketing/voice/integrations/telephony/${id}/verify`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.isValid) {
        setVerifyResults((prev) => ({
          ...prev,
          [id]: { isValid: true, latencyMs: data.latencyMs },
        }));
        toast.success(`Carrier verified successfully in ${data.latencyMs}ms!`);
      } else {
        setVerifyResults((prev) => ({
          ...prev,
          [id]: { isValid: false, latencyMs: data.latencyMs || 0 },
        }));
        toast.error('Carrier authentication failed. Please update credentials.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to ping carrier API');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleOpenTelephonyModal = (prov: VoiceTelephonyType) => {
    setSelectedTelephonyProvider(prov);
    setTelName(`${(VOICE_TELEPHONY_PROVIDERS as any)[prov]?.name || prov} Line`);
    setTelAccountSid('');
    setTelAuthToken('');
    setTelApiKey('');
    setTelApiToken('');
    setTelFromNumbers('');
    setTelSubdomain('');
  };

  const handleSaveTelephony = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTelephonyProvider || !telName.trim()) return;

    try {
      setSubmitting(true);
      const numbers = telFromNumbers
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);

      await onAddTelephony({
        provider: selectedTelephonyProvider,
        name: telName.trim(),
        accountSid: telAccountSid || undefined,
        authToken: telAuthToken || undefined,
        apiKey: telApiKey || undefined,
        apiToken: telApiToken || undefined,
        subdomain: telSubdomain || undefined,
        fromNumbers: numbers,
        isDefault: telephonyIntegrations.length === 0,
      });

      toast.success('Telephony carrier verified and connected successfully');
      setSelectedTelephonyProvider(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to verify and connect telephony carrier');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Active Connected Telephony Gateways */}
      <ConnectedCarriersList
        telephonyIntegrations={telephonyIntegrations}
        onDeleteTelephony={onDeleteTelephony}
        onVerifyCarrier={handleVerifyCarrier}
        verifyingId={verifyingId}
        verifyResults={verifyResults}
      />

      {/* Available Telephony Adapters Directory */}
      <CarrierAdaptersDirectory onConnectCarrier={handleOpenTelephonyModal} />

      {/* CONNECT TELEPHONY MODAL DIALOG */}
      <ConnectCarrierModal
        selectedTelephonyProvider={selectedTelephonyProvider}
        onClose={() => setSelectedTelephonyProvider(null)}
        telName={telName}
        setTelName={setTelName}
        telAccountSid={telAccountSid}
        setTelAccountSid={setTelAccountSid}
        telAuthToken={telAuthToken}
        setAuthToken={setTelAuthToken}
        telApiKey={telApiKey}
        setTelApiKey={setTelApiKey}
        telApiToken={telApiToken}
        setTelApiToken={setTelApiToken}
        telSubdomain={telSubdomain}
        setTelSubdomain={setTelSubdomain}
        telFromNumbers={telFromNumbers}
        setTelFromNumbers={setTelFromNumbers}
        onSubmit={handleSaveTelephony}
        submitting={submitting}
      />
    </div>
  );
};
