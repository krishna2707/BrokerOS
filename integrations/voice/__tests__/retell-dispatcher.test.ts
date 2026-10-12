import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dispatchRetellOutboundCall } from '../agents/retell/src/retell-dispatcher.js';

describe('@brokeros/int-voice — Retell Dispatcher Voice Override Tests (#1092)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('includes voice_id and voice_temperature in agent_override.agent payload', async () => {
    let capturedPayload: any = null;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.includes('list-phone-numbers')) {
          return {
            ok: true,
            status: 200,
            json: async () => [{ phone_number: '+15551234567' }],
          };
        }
        if (url.includes('create-phone-call')) {
          capturedPayload = JSON.parse(init?.body as string);
          return {
            status: 201,
            json: async () => ({ call_id: 'retell_call_123' }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );

    const result = await dispatchRetellOutboundCall('mock_retell_key', {
      assistantId: 'agent_test_999',
      toPhone: '+15559876543',
      fromNumber: '+15551234567',
      campaignId: 'camp_001',
      llmModel: 'gpt-5.6-terra',
      voiceProvider: '11labs',
      voiceId: '11labs-rachel',
      voiceTemperature: 0.75,
      voiceSpeed: 1.1,
      scriptPrompt: 'Hello, welcome to BrokerOS test.',
    });

    expect(result.success).toBe(true);
    expect(result.providerCallId).toBe('retell_call_123');
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.agent_id).toBe('agent_test_999');
    expect(capturedPayload.agent_override).toBeDefined();
    expect(capturedPayload.agent_override.agent.voice_id).toBe('11labs-rachel');
    expect(capturedPayload.agent_override.agent.voice_temperature).toBe(0.75);
    expect(capturedPayload.agent_override.agent.voice_speed).toBe(1.1);
  });

  it('overrides voice_id for Cartesia and Retell voices correctly', async () => {
    let capturedPayload: any = null;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.includes('list-phone-numbers')) {
          return {
            ok: true,
            status: 200,
            json: async () => [{ phone_number: '+15551234567' }],
          };
        }
        if (url.includes('create-phone-call')) {
          capturedPayload = JSON.parse(init?.body as string);
          return {
            status: 201,
            json: async () => ({ call_id: 'retell_call_456' }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );

    const result = await dispatchRetellOutboundCall('mock_retell_key', {
      assistantId: 'agent_test_999',
      toPhone: '+15559876543',
      fromNumber: '+15551234567',
      campaignId: 'camp_002',
      llmModel: 'gpt-5.6-terra',
      voiceProvider: 'cartesia',
      voiceId: 'cartesia-allie',
      retellVoiceTemperature: 0.5,
      scriptPrompt: 'Checking Cartesia voice override.',
    });

    expect(result.success).toBe(true);
    expect(capturedPayload.agent_override.agent.voice_id).toBe('cartesia-allie');
    expect(capturedPayload.agent_override.agent.voice_temperature).toBe(0.5);
  });

  it('does not set voice_id in override if voiceId is an agent ID', async () => {
    let capturedPayload: any = null;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.includes('list-phone-numbers')) {
          return {
            ok: true,
            status: 200,
            json: async () => [{ phone_number: '+15551234567' }],
          };
        }
        if (url.includes('create-phone-call')) {
          capturedPayload = JSON.parse(init?.body as string);
          return {
            status: 201,
            json: async () => ({ call_id: 'retell_call_789' }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );

    const result = await dispatchRetellOutboundCall('mock_retell_key', {
      toPhone: '+15559876543',
      fromNumber: '+15551234567',
      campaignId: 'camp_003',
      llmModel: 'gpt-5.6-terra',
      voiceProvider: 'retell',
      voiceId: 'agent_fallback_123',
      scriptPrompt: 'Testing fallback agent ID.',
    });

    expect(result.success).toBe(true);
    expect(capturedPayload.agent_id).toBe('agent_fallback_123');
    // agent_override may either be undefined or not have voice_id
    if (capturedPayload.agent_override) {
      expect(capturedPayload.agent_override.agent.voice_id).toBeUndefined();
    }
  });
});
