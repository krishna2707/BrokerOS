// ============================================================================
// BrokerOS - In-Browser WebRTC Softphone Engine (Twilio Voice SDK + WebRTC)
// Real-time two-way audio streaming connecting CRM agents to PSTN lead phones
// ============================================================================

import { Device, Call } from '@twilio/voice-sdk';

export interface SoftphoneEngineCallbacks {
  onStatusChange: (status: 'INITIALIZING' | 'RINGING' | 'CONNECTED' | 'ENDED' | 'FAILED') => void;
  onVolumeChange: (level: number) => void;
  onError: (errorMessage: string) => void;
}

export class SoftphoneEngine {
  private device: Device | null = null;
  private activeCall: Call | null = null;
  private callbacks: SoftphoneEngineCallbacks;
  private isDestroyed = false;

  constructor(callbacks: SoftphoneEngineCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Initializes the Twilio Voice WebRTC Device with the agent's ephemeral token.
   */
  async initializeDevice(token: string): Promise<void> {
    try {
      if (this.device) {
        this.device.destroy();
        this.device = null;
      }

      this.callbacks.onStatusChange('INITIALIZING');

      this.device = new Device(token, {
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        closeProtection: true,
      });

      this.device.on('registered', () => {
        console.log('[SoftphoneEngine] Twilio WebRTC Device registered and ready');
      });

      this.device.on('error', (twilioError: any) => {
        console.error('[SoftphoneEngine] Twilio Device Error:', twilioError);
        const errMsg = twilioError?.message || (typeof twilioError === 'string' ? twilioError : 'Twilio WebRTC Device error');
        this.callbacks.onError(errMsg);
        this.callbacks.onStatusChange('FAILED');
      });

      await this.device.register();
    } catch (err: any) {
      console.error('[SoftphoneEngine] Device initialization failed:', err);
      const errMsg = err?.message || (typeof err === 'string' ? err : 'Failed to register Twilio WebRTC Device. Please verify carrier credentials.');
      this.callbacks.onError(errMsg);
      this.callbacks.onStatusChange('FAILED');
      throw new Error(errMsg);
    }
  }

  /**
   * Dials out to a customer's phone number through the connected PSTN carrier.
   */
  async connectCall(params: {
    toPhone: string;
    callRecordId: string;
    leadId: string;
  }): Promise<Call> {
    if (!this.device) {
      throw new Error('WebRTC Device not initialized.');
    }

    try {
      this.callbacks.onStatusChange('RINGING');

      const call = await this.device.connect({
        params: {
          To: params.toPhone,
          callRecordId: params.callRecordId,
          leadId: params.leadId,
        },
      });

      this.activeCall = call;

      call.on('ringing', () => {
        console.log('[SoftphoneEngine] Outbound call ringing on customer line');
        this.callbacks.onStatusChange('RINGING');
      });

      call.on('accept', () => {
        console.log('[SoftphoneEngine] Call accepted. Two-way WebRTC audio connected');
        this.callbacks.onStatusChange('CONNECTED');
      });

      call.on('disconnect', () => {
        console.log('[SoftphoneEngine] Call disconnected');
        this.callbacks.onStatusChange('ENDED');
        this.activeCall = null;
      });

      call.on('error', (err: any) => {
        console.error('[SoftphoneEngine] Call error:', err);
        this.callbacks.onError(err?.message || 'Call failed on carrier network');
        this.callbacks.onStatusChange('FAILED');
        this.activeCall = null;
      });

      call.on('volume', (inputVolume: number, outputVolume: number) => {
        // Average the input mic level and customer incoming audio level (scaled 0 to 100)
        const combined = Math.max(inputVolume, outputVolume);
        const normalized = Math.min(100, Math.round(combined * 100));
        this.callbacks.onVolumeChange(normalized);
      });

      return call;
    } catch (err: any) {
      console.error('[SoftphoneEngine] Failed to connect call:', err);
      const errMsg = err?.message || (typeof err === 'string' ? err : 'Could not connect call');
      this.callbacks.onError(errMsg);
      this.callbacks.onStatusChange('FAILED');
      throw new Error(errMsg);
    }
  }

  /**
   * Mutes or unmutes the active microphone audio track.
   */
  setMuted(muted: boolean): void {
    if (this.activeCall) {
      this.activeCall.mute(muted);
    }
  }

  /**
   * Sends DTMF tone over the telecom line (e.g., keypad numbers for phone menus).
   */
  sendDigits(digits: string): void {
    if (this.activeCall) {
      this.activeCall.sendDigits(digits);
    }
  }

  /**
   * Hangs up the active call.
   */
  disconnectCall(): void {
    if (this.activeCall) {
      this.activeCall.disconnect();
      this.activeCall = null;
    }
  }

  /**
   * Tears down device and releases audio resources.
   */
  destroy(): void {
    this.isDestroyed = true;
    this.disconnectCall();
    if (this.device) {
      this.device.destroy();
      this.device = null;
    }
  }
}
