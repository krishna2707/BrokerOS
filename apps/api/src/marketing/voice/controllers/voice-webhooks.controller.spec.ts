jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

jest.mock('@brokeros/int-voice', () => ({
  getVoiceAgentProvider: jest.fn().mockReturnValue({
    parseWebhookEvent: jest
      .fn()
      .mockReturnValue([{ event: 'call.completed', callId: 'call-123' }]),
  }),
}));

import { VoiceWebhooksController } from './voice-webhooks.controller.js';

describe('VoiceWebhooksController', () => {
  let controller: VoiceWebhooksController;
  let mockTrackingService: any;
  let mockRes: any;

  beforeEach(() => {
    mockTrackingService = {
      processWebhookEvents: jest.fn().mockResolvedValue(undefined),
    };

    mockRes = {
      type: jest.fn(),
    };

    controller = new VoiceWebhooksController(mockTrackingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleVobizAnswer', () => {
    it('should generate valid Vobiz media stream response', () => {
      const xml = controller.handleVobizAnswer(
        'c-1',
        'r-1',
        'Hello from test & BrokerOS',
        undefined,
        undefined,
        mockRes,
      );

      expect(mockRes.type).toHaveBeenCalledWith('text/xml');
      expect(xml).toContain('<Stream url="');
      expect(xml).toContain('<Parameter name="campaignId" value="c-1"/>');
    });

    it('should generate SIP Dial response when agent is VAPI', () => {
      const xml = controller.handleVobizAnswer(
        'c-1',
        'r-1',
        undefined,
        'VAPI',
        undefined,
        mockRes,
      );

      expect(xml).toContain('<Dial>');
      expect(xml).toContain('<Sip>sip:assistant@sip.vapi.ai</Sip>');
    });
  });

  describe('handleTwilioAnswer', () => {
    it('should generate valid Twilio TwiML media stream response', () => {
      const xml = controller.handleTwilioAnswer(
        'c-1',
        'r-1',
        'Welcome to BrokerOS',
        undefined,
        undefined,
        mockRes,
      );

      expect(mockRes.type).toHaveBeenCalledWith('text/xml');
      expect(xml).toContain('<Stream url="');
      expect(xml).toContain('<Parameter name="campaignId" value="c-1"/>');
    });

    it('should generate SIP Dial response when agent is RETELL', () => {
      const xml = controller.handleTwilioAnswer(
        'c-1',
        'r-1',
        undefined,
        'RETELL',
        undefined,
        mockRes,
      );

      expect(xml).toContain('<Dial>');
      expect(xml).toContain('<Sip>sip:agent@sip.retellai.com</Sip>');
    });
  });

  describe('handleTelnyxAnswer', () => {
    it('should generate valid Telnyx TeXML stream response', () => {
      const xml = controller.handleTelnyxAnswer(
        'c-1',
        'r-1',
        undefined,
        'OPENAI_REALTIME',
        undefined,
        mockRes,
      );

      expect(mockRes.type).toHaveBeenCalledWith('text/xml');
      expect(xml).toContain('<Stream url="');
      expect(xml).toContain('<Parameter name="campaignId" value="c-1"/>');
    });
  });

  describe('handleWebhook', () => {
    it('should route twilio-answer provider to handleTwilioAnswer', async () => {
      const res = await controller.handleWebhook(
        'twilio-answer',
        {},
        { campaignId: 'c-test' },
        {},
        mockRes,
      );

      expect(res).toContain('<Stream url="');
    });

    it('should route vobiz-answer provider to handleVobizAnswer', async () => {
      const res = await controller.handleWebhook(
        'vobiz-answer',
        {},
        { campaignId: 'c-test' },
        {},
        mockRes,
      );

      expect(res).toContain('<Stream url="');
    });

    it('should route telnyx-answer provider to handleTelnyxAnswer', async () => {
      const res = await controller.handleWebhook(
        'telnyx-answer',
        {},
        { campaignId: 'c-telnyx' },
        {},
        mockRes,
      );

      expect(res).toContain('<Stream url="');
    });

    it('should parse and process agent platform webhook events', async () => {
      const res = await controller.handleWebhook(
        'vapi',
        { 'x-vapi-signature': 'sig' },
        {},
        { type: 'end-of-call-report' },
      );

      expect(mockTrackingService.processWebhookEvents).toHaveBeenCalledWith([
        { event: 'call.completed', callId: 'call-123' },
      ]);
      expect(res).toEqual({ success: true, processed: 1 });
    });

    it('should catch parsing errors and return success: true safely', async () => {
      const { getVoiceAgentProvider } = await import('@brokeros/int-voice');
      (getVoiceAgentProvider as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Unsupported platform');
      });

      const res = await controller.handleWebhook(
        'unknown-provider',
        {},
        {},
        {},
      );

      expect(res).toEqual({ success: true });
    });
  });
});
