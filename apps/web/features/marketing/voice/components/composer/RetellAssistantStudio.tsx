"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Brain, Volume2, Mic, Sliders } from "lucide-react";
import { CreateAgentModal } from "./CreateAgentModal";
import { DualModeTestCallModal } from "./DualModeTestCallModal";
import {
  DEFAULT_RETELL_VOICES,
  RetellStudioHeader,
  RetellDialogueTab,
  RetellEngineTab,
  RetellVoiceTab,
  RetellSttTab,
  RetellAmbientTab,
} from "./retell";

export interface RetellAssistantStudioProps {
  formData: any;
  onChange: (fields: any) => void;
  agentIntegrations?: any[];
  telephonyIntegrations?: any[];
  selectedProject?: any;
  apiBaseUrl?: string;
}

export function RetellAssistantStudio({
  formData,
  onChange,
  agentIntegrations = [],
  telephonyIntegrations = [],
  selectedProject,
  apiBaseUrl = "",
}: RetellAssistantStudioProps) {
  const [activeTab, setActiveTab] = useState<"script" | "engine" | "voice" | "stt" | "ambient">("script");

  // Agent management
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(formData.assistantId || "");
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "dirty" | "saving" | "error">("synced");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTestCallModalOpen, setIsTestCallModalOpen] = useState(false);

  // Voice Catalog & Audio Preview State
  const [availableVoices, setAvailableVoices] = useState<any[]>(DEFAULT_RETELL_VOICES);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState("");
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Retell integration record
  const retellIntegration =
    agentIntegrations.find((a) => a.platform === "RETELL" && a.id === formData.agentPlatformId) ||
    agentIntegrations.find((a) => a.platform === "RETELL") ||
    null;

  useEffect(() => {
    if (retellIntegration && formData.agentPlatformId !== retellIntegration.id) {
      onChange({ agentPlatformId: retellIntegration.id });
    }
  }, [retellIntegration?.id]);

  useEffect(() => {
    fetchAgents();
    fetchVoices();
  }, [retellIntegration?.id]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const handleFieldChange = (fields: any) => {
    onChange(fields);
    setSyncStatus("dirty");
  };

  // ── Fetch Voices Catalog ──
  const fetchVoices = async () => {
    if (!retellIntegration?.id) return;
    setIsLoadingVoices(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/marketing/voice/integrations/agents/${retellIntegration.id}/catalog`);
      if (res.ok) {
        const cat = await res.json();
        if (Array.isArray(cat.voices) && cat.voices.length > 0) {
          setAvailableVoices(cat.voices);
          if (!formData.voiceId) {
            onChange({ voiceId: cat.voices[0].id, voiceName: cat.voices[0].name });
          }
        }
      }
    } catch (e) {
      console.error("Failed to load Retell voices catalog", e);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // ── Audio Preview Handler ──
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

    if (voice.previewUrl && voice.previewUrl.startsWith("http")) {
      try {
        const audio = new Audio(voice.previewUrl);
        audioRef.current = audio;
        setPlayingVoiceId(voice.id);
        audio.onended = () => {
          setPlayingVoiceId(null);
          audioRef.current = null;
        };
        audio.onerror = () => {
          fallbackSpeech();
        };
        await audio.play();
        return;
      } catch {
        fallbackSpeech();
        return;
      }
    }

    fallbackSpeech();
  };

  // ── Fetch agents ──
  const fetchAgents = async () => {
    if (!retellIntegration?.id) return;
    setIsLoadingAgents(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/marketing/voice/integrations/agents/${retellIntegration.id}/assistants`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          setAgents(list);
          if (!selectedAgentId && list.length > 0) applyAgent(list[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load Retell agents", e);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  // ── Apply agent config to form ──
  const applyAgent = (agent: any) => {
    if (!agent) return;
    const id = agent.id || agent.agent_id;
    setSelectedAgentId(id);
    onChange({
      assistantId: id,
      assistantName: agent.name || agent.agent_name || "Retell Agent",
      voiceId: agent.voice?.voiceId || agent.voiceId || formData.voiceId,
      retellVoiceModel: agent.voice?.model || formData.retellVoiceModel,
      voiceSpeed: agent.voice?.speed ?? formData.voiceSpeed,
      retellEmotion: agent.voice?.emotion || formData.retellEmotion,
      retellLanguage: agent.language || formData.retellLanguage,
      retellAmbientSound: agent.ambientSound || formData.retellAmbientSound,
      retellBackchannel: agent.enableBackchannel ?? formData.retellBackchannel,
      retellReminderMs: agent.reminderTriggerMs ?? formData.retellReminderMs,
      maxDurationSeconds: agent.maxCallDurationMs
        ? Math.round(agent.maxCallDurationMs / 1000)
        : formData.maxDurationSeconds,
      ...(agent.scriptPrompt ? { scriptPrompt: agent.scriptPrompt } : {}),
      ...(agent.firstMessage ? { firstMessage: agent.firstMessage } : {}),
      ...(agent.llmModel ? { llmModel: agent.llmModel } : {}),
    });
    setSyncStatus("synced");
  };

  // ── Save & Sync ──
  const handleSaveAndSync = async () => {
    if (!retellIntegration?.id) return;
    const targetId = selectedAgentId || formData.assistantId || "default";
    setIsSaving(true);
    setSyncStatus("saving");
    setStatusMessage("Pushing config to Retell...");
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/marketing/voice/integrations/agents/${retellIntegration.id}/assistants/${targetId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.assistantName,
            voiceId: formData.voiceId,
            retellVoiceModel: formData.retellVoiceModel,
            voiceSpeed: formData.voiceSpeed,
            retellEmotion: formData.retellEmotion,
            retellLanguage: formData.retellLanguage,
            retellAmbientSound: formData.retellAmbientSound,
            retellBackchannel: formData.retellBackchannel,
            retellReminderMs: formData.retellReminderMs,
            maxDurationSeconds: formData.maxDurationSeconds,
            scriptPrompt: formData.scriptPrompt,
            firstMessage: formData.firstMessage,
            llmModel: formData.llmModel,
          }),
        }
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message || "Retell sync failed");
      }
      const syncedAgent = await res.json().catch(() => null);
      if (syncedAgent && (syncedAgent.agent_id || syncedAgent.id)) {
        const newId = syncedAgent.agent_id || syncedAgent.id;
        setSelectedAgentId(newId);
        onChange({ assistantId: newId });
      }
      setSyncStatus("synced");
      setStatusMessage("Agent synced with Retell.");
      setTimeout(() => setStatusMessage(null), 4000);
      fetchAgents();
    } catch (err: any) {
      setSyncStatus("error");
      setStatusMessage(err?.message || "Sync error");
    } finally {
      setIsSaving(false);
    }
  };

  const insertTag = (tag: string, field: "scriptPrompt" | "firstMessage") => {
    const cur = field === "scriptPrompt" ? formData.scriptPrompt || "" : formData.firstMessage || "";
    handleFieldChange({ [field]: `${cur}{{${tag}}}` });
  };

  // ── Derived values ──
  const agentName = formData.assistantName || "BrokerOS Retell Sales AI";
  const scriptPrompt = formData.scriptPrompt || "";
  const firstMessage = formData.firstMessage || "";
  const llmModel = formData.llmModel || "gpt-5.6-terra";
  const useS2sMode = Boolean(formData.useS2sMode);
  const s2sModel = formData.s2sModel || "gpt-realtime-2.1";
  const modelTemperature = formData.modelTemperature ?? formData.temperature ?? 0.0;
  const modelHighPriority = Boolean(formData.modelHighPriority);
  const voiceId = formData.voiceId || "11labs-rachel";
  const voiceSpeed = formData.voiceSpeed ?? 1.0;
  const voiceTemperature = formData.voiceTemperature ?? 1.0;
  const retellVoiceModel = formData.retellVoiceModel || "eleven_flash_v2_5";
  const retellEmotion = formData.retellEmotion || "calm";
  const retellLanguage = formData.retellLanguage || "en-IN";
  const retellAmbientSound = formData.retellAmbientSound || "";
  const retellBackchannel = formData.retellBackchannel ?? true;
  const retellReminderMs = formData.retellReminderMs ?? 10000;
  const maxDurationSeconds = formData.maxDurationSeconds ?? 600;
  const enableExpressiveMode = Boolean(formData.enableExpressiveMode);
  const enableDynamicResponsiveness = Boolean(formData.enableDynamicResponsiveness);
  const enableDynamicVoiceSpeed = Boolean(formData.enableDynamicVoiceSpeed);
  const responsiveness = formData.responsiveness ?? 1.0;
  const interruptionSensitivity = formData.interruptionSensitivity ?? 1.0;
  const sttMode = formData.sttMode || "fast";
  const vocabSpecialization = formData.vocabSpecialization || "general";
  const denoisingMode = formData.denoisingMode || "noise-cancellation";
  const ambientVolume = formData.ambientSoundVolume ?? formData.ambientVolume ?? 0.8;
  const endCallAfterSilenceMs = formData.endCallAfterSilenceMs ?? 600000;
  const voicemailAction = formData.voicemailAction || "hangup";
  const voicemailMessage = formData.voicemailMessage || "";
  const beginMessageDelayMs = formData.beginMessageDelayMs ?? 1000;

  // Cost estimate
  const ttsPerMin = retellVoiceModel.startsWith("eleven")
    ? 0.03
    : retellVoiceModel.startsWith("sonic")
    ? 0.02
    : retellVoiceModel.startsWith("speech")
    ? 0.015
    : 0.02;
  const totalCostPerMin = (0.005 + 0.002 + ttsPerMin).toFixed(3);
  const latencyMs = sttMode === "fast" ? "700" : "1100";

  return (
    <div className="space-y-6">
      {/* ── TOP HUD ── */}
      <RetellStudioHeader
        agents={agents}
        selectedAgentId={selectedAgentId}
        isLoadingAgents={isLoadingAgents}
        isSaving={isSaving}
        syncStatus={syncStatus}
        statusMessage={statusMessage}
        retellIntegration={retellIntegration}
        totalCostPerMin={totalCostPerMin}
        latencyMs={latencyMs}
        onSelectAgent={applyAgent}
        onRefreshAgents={fetchAgents}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenTestCallModal={() => setIsTestCallModalOpen(true)}
        onSaveAndSync={handleSaveAndSync}
      />

      {/* ── Tab Navigation ── */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200 overflow-x-auto">
        {(
          [
            { id: "script", label: "Dialogue & Prompt", icon: Sparkles },
            { id: "engine", label: "Response Engine", icon: Brain },
            { id: "voice", label: "Voice Persona", icon: Volume2 },
            { id: "stt", label: "STT & Behavior", icon: Mic },
            { id: "ambient", label: "Ambient & Advanced", icon: Sliders },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-white text-emerald-700 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: DIALOGUE & SYSTEM PROMPT ── */}
      {activeTab === "script" && (
        <RetellDialogueTab
          agentName={agentName}
          scriptPrompt={scriptPrompt}
          firstMessage={firstMessage}
          beginMessageDelayMs={beginMessageDelayMs}
          onChange={handleFieldChange}
          onInsertTag={insertTag}
        />
      )}

      {/* ── TAB 2: RESPONSE ENGINE ── */}
      {activeTab === "engine" && (
        <RetellEngineTab
          useS2sMode={useS2sMode}
          s2sModel={s2sModel}
          llmModel={llmModel}
          modelTemperature={modelTemperature}
          modelHighPriority={modelHighPriority}
          onChange={handleFieldChange}
        />
      )}

      {/* ── TAB 3: VOICE PERSONA ── */}
      {activeTab === "voice" && (
        <RetellVoiceTab
          availableVoices={availableVoices}
          voiceId={voiceId}
          voiceName={formData.voiceName || voiceId}
          voiceSpeed={voiceSpeed}
          voiceTemperature={voiceTemperature}
          retellEmotion={retellEmotion}
          enableExpressiveMode={enableExpressiveMode}
          playingVoiceId={playingVoiceId}
          voiceSearchQuery={voiceSearchQuery}
          isLoadingVoices={isLoadingVoices}
          onVoiceSearchChange={setVoiceSearchQuery}
          onFetchVoices={fetchVoices}
          onPlayPreview={handlePlayPreview}
          onChange={handleFieldChange}
        />
      )}

      {/* ── TAB 4: STT & BEHAVIOR ── */}
      {activeTab === "stt" && (
        <RetellSttTab
          sttMode={sttMode}
          retellLanguage={retellLanguage}
          vocabSpecialization={vocabSpecialization}
          responsiveness={responsiveness}
          interruptionSensitivity={interruptionSensitivity}
          retellBackchannel={retellBackchannel}
          enableDynamicResponsiveness={enableDynamicResponsiveness}
          retellReminderMs={retellReminderMs}
          maxDurationSeconds={maxDurationSeconds}
          endCallAfterSilenceMs={endCallAfterSilenceMs}
          onChange={handleFieldChange}
        />
      )}

      {/* ── TAB 5: AMBIENT & ADVANCED ── */}
      {activeTab === "ambient" && (
        <RetellAmbientTab
          retellAmbientSound={retellAmbientSound}
          ambientVolume={ambientVolume}
          denoisingMode={denoisingMode}
          voicemailAction={voicemailAction}
          voicemailMessage={voicemailMessage}
          enableDynamicVoiceSpeed={enableDynamicVoiceSpeed}
          onChange={handleFieldChange}
        />
      )}

      {/* ── Create Agent Modal ── */}
      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        platform="RETELL"
        agentPlatformId={retellIntegration?.id}
        apiBaseUrl={apiBaseUrl}
        onAgentCreated={(created) => {
          setIsCreateModalOpen(false);
          const id = created.agent_id || created.id;
          const name = created.agent_name || created.name || "New Retell Agent";
          onChange({ assistantId: id, assistantName: name });
          fetchAgents();
        }}
      />

      {/* ── Dual Mode Live Test Call Modal ── */}
      <DualModeTestCallModal
        isOpen={isTestCallModalOpen}
        onClose={() => setIsTestCallModalOpen(false)}
        assistantName={agentName}
        assistantId={selectedAgentId}
        agentPlatformId={retellIntegration?.id}
        platform="RETELL"
        telephonyIntegrations={telephonyIntegrations}
        selectedTelephonyId={formData.telephonyId}
        formData={formData}
        apiBaseUrl={apiBaseUrl}
      />
    </div>
  );
}
