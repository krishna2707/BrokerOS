"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type { CallState, ActiveLead, TelephonyContextType } from "../types";
import { SoftphoneEngine } from "../services/softphone-engine";
import { SoftphoneAudioEngine } from "../services/softphone-audio";

const TelephonyContext = createContext<TelephonyContextType | null>(null);

export function TelephonyProvider({ children }: { children: React.ReactNode }) {
  const [callState, setCallState] = useState<CallState>("IDLE");
  const [activeLead, setActiveLead] = useState<ActiveLead | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [callRecordId, setCallRecordId] = useState<string | null>(null);
  const [bridgeType, setBridgeType] = useState<"WEBRTC" | "PSTN_BRIDGE" | "MOCK">("WEBRTC");
  const [agentPhone, setAgentPhone] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const softphoneEngineRef = useRef<SoftphoneEngine | null>(null);
  const fallbackAudioRef = useRef<SoftphoneAudioEngine | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/crm";

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      softphoneEngineRef.current?.destroy();
      fallbackAudioRef.current?.stop();
    };
  }, []);

  // Duration Timer: starts when call is officially CONNECTED
  useEffect(() => {
    if (callState === "CONNECTED") {
      setDurationSeconds(0);
      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [callState]);

  const initiateCall = useCallback(async (lead: ActiveLead) => {
    try {
      setError(null);
      setActiveLead(lead);
      setCallState("INITIALIZING");
      setIsMuted(false);
      setVolumeLevel(0);

      // 1. Request call session and WebRTC credentials from backend
      const res = await fetch(`${baseUrl}/telephony/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          phone: lead.phone,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to initiate call through telephony carrier.");
      }

      const data = await res.json();
      setCallRecordId(data.callRecordId);
      setActiveProvider(data.provider);
      setBridgeType(data.bridgeType || "WEBRTC");
      setAgentPhone(data.agentPhone);

      const tokenData = data.tokenData;

      // 2. Twilio In-Browser WebRTC Connection
      if (tokenData?.provider === "TWILIO" && tokenData?.token) {
        const engine = new SoftphoneEngine({
          onStatusChange: (status) => {
            setCallState(status);
            if (status === "ENDED") {
              setTimeout(() => {
                setCallState("IDLE");
                setActiveLead(null);
                setCallRecordId(null);
              }, 4000);
            }
          },
          onVolumeChange: (vol) => {
            setVolumeLevel(vol);
          },
          onError: (errMsg) => {
            setError(errMsg);
            setCallState("FAILED");
          },
        });

        softphoneEngineRef.current = engine;
        await engine.initializeDevice(tokenData.token);
        await engine.connectCall({
          toPhone: lead.phone,
          callRecordId: data.callRecordId,
          leadId: lead.id,
        });
      } else {
        // PSTN Bridging / Carrier Direct Calling (Exotel, Vobiz, Telnyx)
        if (!fallbackAudioRef.current) {
          fallbackAudioRef.current = new SoftphoneAudioEngine();
        }

        await fallbackAudioRef.current.startMicrophone((vol) => {
          setVolumeLevel(vol);
        });

        fallbackAudioRef.current.startRingbackTone();
        setCallState("RINGING");

        // When carrier telecom switch connects
        setTimeout(() => {
          fallbackAudioRef.current?.stopRingbackTone();
          setCallState("CONNECTED");
        }, 3000);
      }
    } catch (err: any) {
      console.error("[Telephony] Call failed to connect:", err);
      softphoneEngineRef.current?.destroy();
      fallbackAudioRef.current?.stop();
      setError(err?.message || (typeof err === "string" ? err : "Call could not be completed."));
      setCallState("FAILED");
    }
  }, [baseUrl]);

  const hangUp = useCallback(async () => {
    try {
      if (callRecordId) {
        await fetch(`${baseUrl}/telephony/hangup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callRecordId }),
        }).catch(() => { });
      }
    } finally {
      softphoneEngineRef.current?.disconnectCall();
      fallbackAudioRef.current?.stop();
      setCallState("ENDED");

      setTimeout(() => {
        setCallState("IDLE");
        setActiveLead(null);
        setCallRecordId(null);
      }, 4000);
    }
  }, [baseUrl, callRecordId]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      softphoneEngineRef.current?.setMuted(next);
      fallbackAudioRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const dismissCall = useCallback(() => {
    softphoneEngineRef.current?.destroy();
    fallbackAudioRef.current?.stop();
    setCallState("IDLE");
    setActiveLead(null);
    setCallRecordId(null);
    setError(null);
  }, []);

  return (
    <TelephonyContext.Provider
      value={{
        callState,
        activeLead,
        durationSeconds,
        isMuted,
        volumeLevel,
        activeProvider,
        callRecordId,
        bridgeType,
        agentPhone,
        initiateCall,
        hangUp,
        toggleMute,
        error,
        dismissCall,
      }}
    >
      {children}
    </TelephonyContext.Provider>
  );
}

export function useTelephony() {
  const context = useContext(TelephonyContext);
  if (!context) {
    throw new Error("useTelephony must be used within a TelephonyProvider");
  }
  return context;
}
