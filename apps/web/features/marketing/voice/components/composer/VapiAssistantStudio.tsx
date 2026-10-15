"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Sparkles, Brain, Volume2, Mic, Sliders } from "lucide-react";
import { calculateVapiCallMetrics } from "@brokeros/constants";
import { CreateAgentModal } from "./CreateAgentModal";
import { DualModeTestCallModal } from "./DualModeTestCallModal";
import {
  VapiStudioHeader,
  VapiDialogueTab,
  VapiIntelligenceTab,
  VapiVoiceTab,
  VapiSttTab,
  VapiCallFlowTab,
} from "./vapi";

export interface VapiAssistantStudioProps {
  formData: any;
  onChange: (fields: any) => void;
  agentIntegrations?: any[];
  telephonyIntegrations?: any[];
  selectedProject?: any;
  apiBaseUrl?: string;
}

export function VapiAssistantStudio({
  formData,
  onChange,
  agentIntegrations = [],
  telephonyIntegrations = [],
  selectedProject,
  apiBaseUrl = "",
}: VapiAssistantStudioProps) {
  // ── Active Tabs ──
  const [activeTab, setActiveTab] = useState<"script" | "intelligence" | "voice" | "stt" | "flow">("script");

  // ── Remote Assistants State ──
  const [assistants, setAssistants] = useState<any[]>([]);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(formData.assistantId || "");
  const [isLoadingAssistants, setIsLoadingAssistants] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "dirty" | "saving" | "error">("synced");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // ── Modals State ──
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTestCallModalOpen, setIsTestCallModalOpen] = useState(false);

  // ── Audio Preview & Search State ──
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Find active VAPI integration strictly (Never pick a non-VAPI integration)
  const vapiIntegration = useMemo(() => {
    return (
      agentIntegrations.find((a) => a.platform === "VAPI" && a.id === formData.agentPlatformId) ||
      agentIntegrations.find((a) => a.platform === "VAPI") ||
      null
    );
  }, [agentIntegrations, formData.agentPlatformId]);

  // Ensure formData.agentPlatformId is aligned with the VAPI integration
  useEffect(() => {
    if (vapiIntegration && formData.agentPlatformId !== vapiIntegration.id) {
      onChange({ agentPlatformId: vapiIntegration.id });
    }
  }, [vapiIntegration?.id, formData.agentPlatformId, onChange]);

  // Current parameters
  const assistantName = formData.assistantName || formData.agentName || "BrokerOS Luxury Sales AI";
  const llmProvider = formData.modelProvider || "openai";
  const llmModel = formData.llmModel || "gpt-4o-mini";
  const temperature = formData.temperature ?? 0.7;
  const maxTokens = formData.maxTokens ?? 500;
  const scriptPrompt = formData.scriptPrompt || "";
  const systemPrompt = scriptPrompt;
  const firstMessage = formData.firstMessage || "";
  const firstMessageMode = formData.firstMessageMode || "assistant-speaks-first";

  const voiceProvider = formData.voiceProvider || "11labs";
  const voiceId = formData.voiceId || "21m00Tcm4TlvDq8ikWAM";
  const voiceName = formData.voiceName || "Rachel (ElevenLabs)";
  const voiceSpeed = formData.voiceSpeed ?? 1.0;
  const voiceStability = formData.voiceStability ?? 0.5;
  const voiceSimilarityBoost = formData.voiceSimilarityBoost ?? 0.75;
  const backgroundSound = formData.backgroundSound || "off";

  const transcriberProvider = formData.transcriberProvider || "deepgram";
  const transcriberModel = formData.transcriberModel || "nova-3";
  const transcriberLanguage = formData.transcriberLanguage || "en";

  const silenceTimeoutSeconds = formData.silenceTimeoutSeconds ?? 30;
  const maxDurationSeconds = formData.maxDurationSeconds ?? 600;
  const backchannelingEnabled = formData.backchannelingEnabled ?? true;
  const backgroundDenoisingEnabled = formData.backgroundDenoisingEnabled ?? true;
  const voicemailDetection = formData.voicemailDetection || "off";
  const voicemailMessage = formData.voicemailMessage || "";

  // Dynamic Live Metrics Calculation
  const metrics = useMemo(() => {
    return calculateVapiCallMetrics(
      transcriberProvider,
      transcriberModel,
      llmProvider,
      llmModel,
      voiceProvider
    );
  }, [transcriberProvider, transcriberModel, llmProvider, llmModel, voiceProvider]);

  // Generic field change handler that automatically marks sync status as dirty
  const handleFieldChange = (fields: any) => {
    onChange(fields);
    setSyncStatus("dirty");
  };

  // Audio preview handler
  const handlePlayPreview = async (voice: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;

    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      setPlayingVoiceId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const sampleText =
      voice.previewText ||
      `Hello! I am ${voice.name}. How may I assist your luxury property inquiry today?`;

    const fallbackSpeech = () => {
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(sampleText);
        utterance.onstart = () => setPlayingVoiceId(voice.id);
        utterance.onend = () => setPlayingVoiceId(null);
        utterance.onerror = () => setPlayingVoiceId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setPlayingVoiceId(null);
      }
    };

    const synthesizeAndPlay = async () => {
      try {
        setPlayingVoiceId(voice.id);
        const res = await fetch(`${apiBaseUrl}/api/marketing/voice/audio/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            voiceId: voice.id,
            voiceProvider: voice.provider,
            text: sampleText,
            agentPlatformId: vapiIntegration?.id,
          }),
        });

        if (res.ok) {
          const blob = await res.blob();
          if (blob && blob.size > 200) {
            const blobUrl = URL.createObjectURL(blob);
            const audio = new Audio(blobUrl);
            audioRef.current = audio;
            audio.onended = () => {
              URL.revokeObjectURL(blobUrl);
              setPlayingVoiceId(null);
              audioRef.current = null;
            };
            audio.onerror = () => {
              URL.revokeObjectURL(blobUrl);
              fallbackSpeech();
            };
            await audio.play();
            return;
          }
        }
      } catch {
        // Proceed to fallback
      }
      fallbackSpeech();
    };

    // 1. Direct verified static S3 / CDN preview URL (if not expired presigned)
    const isDirectExpired =
      voice.sampleAudio &&
      (voice.sampleAudio.includes("X-Amz-Expires") || voice.sampleAudio.includes("X-Amz-Signature"));
    if (voice.sampleAudio && voice.sampleAudio.startsWith("http") && !isDirectExpired) {
      try {
        const audio = new Audio(voice.sampleAudio);
        audioRef.current = audio;
        setPlayingVoiceId(voice.id);
        audio.onended = () => {
          setPlayingVoiceId(null);
          audioRef.current = null;
        };
        audio.onerror = () => {
          synthesizeAndPlay();
        };
        await audio.play();
        return;
      } catch {
        synthesizeAndPlay();
        return;
      }
    }

    // 2. Synthesize with neural engine
    await synthesizeAndPlay();
  };

  // 1. Fetch Remote Assistants on Mount / Integration Change
  const fetchAssistants = async () => {
    if (!vapiIntegration?.id) return;
    try {
      setIsLoadingAssistants(true);
      const res = await fetch(
        `${apiBaseUrl}/api/marketing/voice/integrations/agents/${vapiIntegration.id}/assistants`
      );
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          setAssistants(list);
          if (!selectedAssistantId && list.length > 0) {
            handleSelectAssistant(list[0]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load Vapi assistants", err);
    } finally {
      setIsLoadingAssistants(false);
    }
  };

  useEffect(() => {
    fetchAssistants();
  }, [vapiIntegration?.id]);

  // 2. Select an Assistant and Auto-Hydrate Studio
  const handleSelectAssistant = (asst: any) => {
    if (!asst) return;
    setSelectedAssistantId(asst.id);

    onChange({
      assistantId: asst.id,
      assistantName: asst.name || "Vapi Assistant",
      scriptPrompt: asst.model?.systemPrompt || asst.scriptPrompt || scriptPrompt,
      firstMessage: asst.firstMessage || firstMessage,
      firstMessageMode: asst.firstMessageMode || firstMessageMode,
      modelProvider: asst.model?.provider || llmProvider,
      llmModel: asst.model?.model || llmModel,
      temperature: asst.model?.temperature ?? temperature,
      maxTokens: asst.model?.maxTokens ?? maxTokens,
      voiceProvider: asst.voice?.provider || voiceProvider,
      voiceId: asst.voice?.voiceId || voiceId,
      voiceSpeed: asst.voice?.speed ?? voiceSpeed,
      transcriberProvider: asst.transcriber?.provider || transcriberProvider,
      transcriberModel: asst.transcriber?.model || transcriberModel,
      transcriberLanguage: asst.transcriber?.language || transcriberLanguage,
      silenceTimeoutSeconds: asst.silenceTimeoutSeconds ?? silenceTimeoutSeconds,
      maxDurationSeconds: asst.maxDurationSeconds ?? maxDurationSeconds,
      backgroundSound: asst.backgroundSound || backgroundSound,
      backchannelingEnabled: asst.backchannelingEnabled ?? backchannelingEnabled,
      backgroundDenoisingEnabled: asst.backgroundDenoisingEnabled ?? backgroundDenoisingEnabled,
      voicemailDetection: asst.voicemailDetection || voicemailDetection,
      voicemailMessage: asst.voicemailMessage || voicemailMessage,
    });

    setSyncStatus("synced");
  };

  // 3. Save & Sync to VAPI Remote Account
  const handleSaveAndSync = async () => {
    if (!vapiIntegration?.id) return;
    const targetId = selectedAssistantId || formData.assistantId || "default";

    try {
      setIsSaving(true);
      setSyncStatus("saving");
      setStatusMessage("Pushing live configuration to Vapi...");

      const endpoint = `${apiBaseUrl}/api/marketing/voice/integrations/agents/${vapiIntegration.id}/assistants/${targetId}`;

      const payload = {
        name: assistantName,
        firstMessage,
        firstMessageMode,
        silenceTimeoutSeconds,
        maxDurationSeconds,
        backgroundSound,
        backchannelingEnabled,
        backgroundDenoisingEnabled,
        voicemailMessage,
        model: {
          provider: llmProvider,
          model: llmModel,
          temperature,
          maxTokens,
          systemPrompt,
        },
        voice: {
          provider: voiceProvider,
          voiceId,
          speed: voiceSpeed,
          stability: voiceStability,
          similarityBoost: voiceSimilarityBoost,
        },
        transcriber: {
          provider: transcriberProvider,
          model: transcriberModel,
          language: transcriberLanguage,
        },
      };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to update assistant on Vapi");
      }

      const syncedAsst = await res.json().catch(() => null);
      if (syncedAsst && syncedAsst.id) {
        setSelectedAssistantId(syncedAsst.id);
        onChange({ assistantId: syncedAsst.id });
      }

      setSyncStatus("synced");
      setStatusMessage("Live Assistant parameters successfully synchronized with Vapi.");
      setTimeout(() => setStatusMessage(null), 4000);
      fetchAssistants();
    } catch (err: any) {
      setSyncStatus("error");
      setStatusMessage(err?.message || "Error syncing to Vapi");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to insert CRM tags into textareas
  const insertTag = (tag: string, targetField: "scriptPrompt" | "firstMessage") => {
    const currentVal = targetField === "scriptPrompt" ? scriptPrompt : firstMessage;
    const updatedVal = `${currentVal} {{${tag}}}`;
    handleFieldChange({ [targetField]: updatedVal });
  };

  return (
    <div className="space-y-6">
      {/* ── TOP HUD & STATUS BAR ── */}
      <VapiStudioHeader
        assistants={assistants}
        selectedAssistantId={selectedAssistantId}
        isLoadingAssistants={isLoadingAssistants}
        isSaving={isSaving}
        syncStatus={syncStatus}
        statusMessage={statusMessage}
        vapiIntegration={vapiIntegration}
        metrics={metrics}
        onSelectAssistant={handleSelectAssistant}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenTestCallModal={() => setIsTestCallModalOpen(true)}
        onSaveAndSync={handleSaveAndSync}
      />

      {/* ── STUDIO NAVIGATION TABS ── */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200 overflow-x-auto">
        {[
          { id: "script", label: "Dialogue & Prompt", icon: Sparkles },
          { id: "intelligence", label: "LLM Intelligence", icon: Brain },
          { id: "voice", label: "Voice Persona", icon: Volume2 },
          { id: "stt", label: "Speech Recognition", icon: Mic },
          { id: "flow", label: "Call Flow & Safety", icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive
                  ? "bg-white text-purple-700 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-purple-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: DIALOGUE & SYSTEM PROMPT ── */}
      {activeTab === "script" && (
        <VapiDialogueTab
          assistantName={assistantName}
          firstMessage={firstMessage}
          firstMessageMode={firstMessageMode}
          scriptPrompt={scriptPrompt}
          onChange={handleFieldChange}
          onInsertTag={insertTag}
        />
      )}

      {/* ── TAB 2: LLM INTELLIGENCE ENGINE ── */}
      {activeTab === "intelligence" && (
        <VapiIntelligenceTab
          llmProvider={llmProvider}
          llmModel={llmModel}
          temperature={temperature}
          maxTokens={maxTokens}
          onChange={handleFieldChange}
        />
      )}

      {/* ── TAB 3: VOICE PERSONA & AUDIO ── */}
      {activeTab === "voice" && (
        <VapiVoiceTab
          voiceProvider={voiceProvider}
          voiceId={voiceId}
          voiceName={voiceName}
          voiceSpeed={voiceSpeed}
          backgroundSound={backgroundSound}
          playingVoiceId={playingVoiceId}
          voiceSearchQuery={voiceSearchQuery}
          onVoiceSearchChange={setVoiceSearchQuery}
          onPlayPreview={handlePlayPreview}
          onChange={handleFieldChange}
        />
      )}

      {/* ── TAB 4: SPEECH RECOGNITION (STT) ── */}
      {activeTab === "stt" && (
        <VapiSttTab
          transcriberProvider={transcriberProvider}
          transcriberModel={transcriberModel}
          transcriberLanguage={transcriberLanguage}
          onChange={handleFieldChange}
        />
      )}

      {/* ── TAB 5: CALL FLOW, VOICEMAIL & SAFETY ── */}
      {activeTab === "flow" && (
        <VapiCallFlowTab
          silenceTimeoutSeconds={silenceTimeoutSeconds}
          maxDurationSeconds={maxDurationSeconds}
          backchannelingEnabled={backchannelingEnabled}
          backgroundDenoisingEnabled={backgroundDenoisingEnabled}
          voicemailMessage={voicemailMessage}
          onChange={handleFieldChange}
        />
      )}

      {/* ── MODALS ── */}
      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        platform="VAPI"
        agentPlatformId={vapiIntegration?.id}
        apiBaseUrl={apiBaseUrl}
        onAgentCreated={(asst) => {
          fetchAssistants();
          handleSelectAssistant(asst);
        }}
      />

      <DualModeTestCallModal
        isOpen={isTestCallModalOpen}
        onClose={() => setIsTestCallModalOpen(false)}
        assistantName={assistantName}
        assistantId={selectedAssistantId}
        agentPlatformId={vapiIntegration?.id}
        telephonyIntegrations={telephonyIntegrations}
        selectedTelephonyId={formData.telephonyId}
        formData={formData}
        apiBaseUrl={apiBaseUrl}
      />
    </div>
  );
}
