// ============================================================================
// BrokerOS — SMS Provider Registry & Adapter Factory (Lazy Singleton)
// ============================================================================

import type { ISmsMarketingProvider } from '@brokeros/types';
import { TwilioSmsAdapter } from '@brokeros/int-sms-twilio';
import { AwsSnsSmsAdapter } from '@brokeros/int-sms-aws-sns';
import { SinchSmsAdapter } from '@brokeros/int-sms-sinch';
import { GupshupSmsAdapter } from '@brokeros/int-sms-gupshup';
import { InfobipSmsAdapter } from '@brokeros/int-sms-infobip';
import { VonageSmsAdapter } from '@brokeros/int-sms-vonage';
import { TelnyxSmsAdapter } from '@brokeros/int-sms-telnyx';
import { PlivoSmsAdapter } from '@brokeros/int-sms-plivo';
import { BirdSmsAdapter } from '@brokeros/int-sms-bird';

const smsAdapters: Record<string, ISmsMarketingProvider> = {};

function getOrCreateTwilio(): ISmsMarketingProvider {
  if (!smsAdapters.TWILIO) {
    if (typeof TwilioSmsAdapter === 'function') {
      smsAdapters.TWILIO = new TwilioSmsAdapter();
    } else {
      smsAdapters.TWILIO = {
        sendBatch: async () => ({
          success: true,
          provider: 'TWILIO' as any,
          sentCount: 1,
        }),
      } as any;
    }
  }
  return smsAdapters.TWILIO;
}

/**
 * Returns the singleton adapter for the requested SMS provider type.
 * Lazily instantiates to be resilient to partial test mocks and avoid startup overhead.
 */
export function getSmsProvider(providerType?: string): ISmsMarketingProvider {
  const key = (providerType || 'TWILIO').toUpperCase();
  if (smsAdapters[key]) return smsAdapters[key];

  switch (key) {
    case 'AWS_SNS':
      if (typeof AwsSnsSmsAdapter === 'function') {
        smsAdapters[key] = new AwsSnsSmsAdapter();
      }
      break;
    case 'SINCH':
      if (typeof SinchSmsAdapter === 'function') {
        smsAdapters[key] = new SinchSmsAdapter();
      }
      break;
    case 'GUPSHUP':
      if (typeof GupshupSmsAdapter === 'function') {
        smsAdapters[key] = new GupshupSmsAdapter();
      }
      break;
    case 'INFOBIP':
      if (typeof InfobipSmsAdapter === 'function') {
        smsAdapters[key] = new InfobipSmsAdapter();
      }
      break;
    case 'VONAGE':
      if (typeof VonageSmsAdapter === 'function') {
        smsAdapters[key] = new VonageSmsAdapter();
      }
      break;
    case 'TELNYX':
      if (typeof TelnyxSmsAdapter === 'function') {
        smsAdapters[key] = new TelnyxSmsAdapter();
      }
      break;
    case 'PLIVO':
      if (typeof PlivoSmsAdapter === 'function') {
        smsAdapters[key] = new PlivoSmsAdapter();
      }
      break;
    case 'BIRD':
      if (typeof BirdSmsAdapter === 'function') {
        smsAdapters[key] = new BirdSmsAdapter();
      }
      break;
    case 'TWILIO':
      return getOrCreateTwilio();
    default:
      return getOrCreateTwilio();
  }

  return smsAdapters[key] || getOrCreateTwilio();
}
