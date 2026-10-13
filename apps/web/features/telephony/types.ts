export type CallState =
  | 'IDLE'
  | 'INITIALIZING'
  | 'RINGING'
  | 'CONNECTED'
  | 'ENDED'
  | 'FAILED';

export interface ActiveLead {
  id: string;
  name: string;
  phone: string;
  temperature?: string;
}

export interface TelephonyContextType {
  callState: CallState;
  activeLead: ActiveLead | null;
  durationSeconds: number;
  isMuted: boolean;
  volumeLevel: number;
  activeProvider: string | null;
  callRecordId: string | null;
  bridgeType?: 'WEBRTC' | 'PSTN_BRIDGE' | 'MOCK';
  agentPhone?: string;
  initiateCall: (lead: ActiveLead) => Promise<void>;
  hangUp: () => Promise<void>;
  toggleMute: () => void;
  error: string | null;
  dismissCall: () => void;
}
