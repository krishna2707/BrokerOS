// ============================================================================
// BrokerOS — Vapi API Outbound Call Dispatcher
// ============================================================================

import type { SendVoiceOptions, SendVoiceResult } from '@brokeros/types';
import { normalizeVapiVoice } from './vapi-voices.js';
import { buildVapiVoicePayload, formatVapiBackgroundSound } from './vapi-models.js';

export async function dispatchVapiOutboundCall(
  apiKey: string,
  options: SendVoiceOptions,
): Promise<SendVoiceResult> {
  const isUUID = (val?: string) => !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  const resolvedAssistantId = isUUID(options.assistantId)
    ? options.assistantId
    : isUUID(options.llmModel)
      ? options.llmModel
      : undefined;
  const isAssistantId = !!resolvedAssistantId;

  const payload: any = {
    customer: {
      number: options.toPhone,
    },
  };

  // FIX #1089 + #1088: The old code injected raw Twilio credentials into the Vapi
  // call payload as payload.phoneNumber = { twilioPhoneNumber, twilioAccountSid,
  // twilioAuthToken }. Vapi's POST /call schema does NOT accept inline credentials;
  // it expects a pre-registered phone number referenced by its UUID (phoneNumberId).
  //
  // The correct flow:
  //   1. If fromNumber is already a UUID, use it directly as phoneNumberId.
  //   2. Otherwise query GET /phone-number to find the imported number by E.164 match.
  //   3. If no match found, return a clear error so the caller can fix their config.
  if (isUUID(options.fromNumber)) {
    // fromNumber is already a phoneNumberId (UUID) — use it directly
    payload.phoneNumberId = options.fromNumber;
  } else {
    // Look up registered phone numbers in Vapi account (works for Twilio and other imports)
    try {
      const pRes = await fetch('https://api.vapi.ai/phone-number', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (pRes.ok) {
        const numbers = (await pRes.json()) as any[];
        if (Array.isArray(numbers) && numbers.length > 0) {
          const cleanFrom = (options.fromNumber || '').replace(/[^\d+]/g, '');
          // Try to match the imported number by phone number digits or by UUID
          const match = cleanFrom
            ? numbers.find(
              (n) =>
                (n.number && n.number.replace(/[^\d+]/g, '') === cleanFrom) ||
                n.id === options.fromNumber,
            )
            : null;

          if (match) {
            payload.phoneNumberId = match.id;
          } else if (options.fromNumber) {
            // FIX #1089: fromNumber was provided but not found in Vapi's registered numbers.
            // Return an actionable error rather than sending a malformed payload.
            return {
              success: false,
              error:
                `Phone number "${options.fromNumber}" is not registered in your Vapi workspace. ` +
                `Please import it under Vapi Dashboard > Phone Numbers and try again.`,
            };
          } else {
            // No fromNumber specified — use the first available registered number
            payload.phoneNumberId = numbers[0].id;
          }
        } else {
          // No phone numbers registered in Vapi at all
          return {
            success: false,
            error:
              'No phone numbers are registered in your Vapi workspace. ' +
              'Import at least one number under Vapi Dashboard > Phone Numbers.',
          };
        }
      }
    } catch (phoneErr: any) {
      // Network error fetching phone numbers — let Vapi return the specific error
      console.warn(`[vapi-dispatcher] Could not fetch Vapi phone numbers: ${phoneErr?.message}`);
    }
  }

  const { provider: vapiVoiceProvider, voiceId: cleanVoiceId } = normalizeVapiVoice(
    options.voiceProvider,
    options.voiceId,
  );

  // Map Model Provider
  let vapiModelProvider = 'openai';
  let cleanModel = (options.llmModel || '').toLowerCase().replace(/^(openai\/|azure\/|groq\/|google\/|anthropic\/)/, '');
  let vapiModel = 'gpt-4o-mini';

  if (cleanModel.includes('gpt-4o-mini') || cleanModel.includes('gpt-4.1-mini') || cleanModel.includes('mini')) {
    vapiModelProvider = 'openai';
    vapiModel = 'gpt-4o-mini';
  } else if (cleanModel.includes('gpt-4o') || cleanModel.includes('gpt-4')) {
    vapiModelProvider = 'openai';
    vapiModel = 'gpt-4o';
  } else if (cleanModel.includes('claude-3-5-sonnet') || cleanModel.includes('sonnet')) {
    vapiModelProvider = 'anthropic';
    vapiModel = 'claude-3-5-sonnet-20241022';
  } else if (cleanModel.includes('claude-3-haiku') || cleanModel.includes('haiku')) {
    vapiModelProvider = 'anthropic';
    vapiModel = 'claude-3-haiku-20240307';
  } else if (cleanModel.includes('llama') || cleanModel.includes('groq')) {
    vapiModelProvider = 'groq';
    vapiModel = 'llama-3.3-70b-versatile';
  } else if (cleanModel.includes('gemini')) {
    vapiModelProvider = 'google';
    vapiModel = 'gemini-1.5-flash';
  }

  const voicemailConfig =
    options.voicemailDetection && options.voicemailDetection !== 'off' && options.voicemailDetection !== 'none'
      ? { provider: 'vapi' }
      : 'off';

  const waitSeconds = ((options.maxTurnSilenceMs ?? 400) / 1000);
  const startSpeakingPlan = { waitSeconds };

  const voicePayload = buildVapiVoicePayload({
    voiceProvider: vapiVoiceProvider,
    voiceId: cleanVoiceId,
    voiceSpeed: options.voiceSpeed,
  });

  const safeBgSound = formatVapiBackgroundSound(options.backgroundSound) || 'off';

  if (isAssistantId) {
    payload.assistantId = resolvedAssistantId;
    payload.assistantOverrides = {
      variableValues: options.variables || {},
      // FIX #1088: Default firstMessage when blank — prevents mutual-silence deadlock
      firstMessage: options.firstMessage?.trim() || 'Hello, thank you for connecting with us. How can I assist you with your property search today?',
      voicemailDetection: voicemailConfig,
      maxDurationSeconds: options.maxDurationSeconds || 600,
      backgroundSound: safeBgSound,
      startSpeakingPlan,
      voice: voicePayload,
      transcriber: {
        provider: 'deepgram',
        model: options.transcriberModel || 'nova-3',
        language: options.transcriberLanguage || 'en',
      },
    };
    if (options.scriptPrompt) {
      payload.assistantOverrides.model = {
        provider: vapiModelProvider,
        model: vapiModel,
        messages: [{ role: 'system', content: options.scriptPrompt }],
      };
    }
  } else {
    payload.assistant = {
      transcriber: {
        provider: 'deepgram',
        model: options.transcriberModel || 'nova-3',
        language: options.transcriberLanguage || 'en',
      },
      model: {
        provider: vapiModelProvider,
        model: vapiModel,
        messages: [
          {
            role: 'system',
            content: options.scriptPrompt || 'You are an intelligent real estate sales advisor.',
          },
        ],
      },
      voice: voicePayload,
      // FIX #1088: Always ensure firstMessage is set so the AI speaks first.
      // When blank, an empty opening causes both parties to wait in silence until
      // the turn-timeout (silenceTimeoutSeconds) disconnects the call.
      firstMessage: options.firstMessage?.trim() || 'Hello, thank you for connecting with us. How can I assist you with your property search today?',
      firstMessageMode: options.firstMessageMode || 'assistant-speaks-first',
      voicemailDetection: voicemailConfig,
      backgroundSound: safeBgSound,
      maxDurationSeconds: options.maxDurationSeconds || 600,
      startSpeakingPlan,
    };
  }

  try {
    const res = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as any;

    if (res.status >= 200 && res.status < 300) {
      return {
        success: true,
        providerCallId: data.id || data.callId || `vapi_${Date.now()}`,
      };
    }

    return {
      success: false,
      error: data.message || (Array.isArray(data.message) ? data.message.join('; ') : `Vapi dispatch failed with HTTP ${res.status}`),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to dispatch call via Vapi',
    };
  }
}
