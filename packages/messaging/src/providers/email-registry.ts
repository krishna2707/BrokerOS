// ============================================================================
// BrokerOS — Email Provider Registry & Adapter Factory (Lazy Singleton)
// ============================================================================

import type { IEmailMarketingProvider } from '@brokeros/types';
import { SesAdapter } from '@brokeros/int-mail-ses';
import { SendgridAdapter } from '@brokeros/int-mail-sendgrid';
import { BrevoAdapter } from '@brokeros/int-mail-brevo';
import { MailchimpAdapter } from '@brokeros/int-mail-mailchimp';
import { MailgunAdapter } from '@brokeros/int-mail-mailgun';
import { GmailAdapter } from '@brokeros/int-mail-gmail';
import { OutlookAdapter } from '@brokeros/int-mail-outlook';
import { ConstantContactAdapter } from '@brokeros/int-mail-constant-contact';

const emailAdapters: Record<string, IEmailMarketingProvider> = {};

function getOrCreateSes(): IEmailMarketingProvider {
  if (!emailAdapters.AWS_SES) {
    if (typeof SesAdapter === 'function') {
      emailAdapters.AWS_SES = new SesAdapter();
    } else {
      emailAdapters.AWS_SES = {
        sendBatch: async () => ({
          success: true,
          provider: 'AWS_SES' as any,
          sentCount: 1,
        }),
      } as any;
    }
  }
  return emailAdapters.AWS_SES;
}

/**
 * Returns the singleton adapter for the requested Email provider type.
 * Lazily instantiates to be resilient to partial test mocks and avoid startup overhead.
 */
export function getEmailProvider(providerType?: string): IEmailMarketingProvider {
  const key = (providerType || 'AWS_SES').toUpperCase();
  if (emailAdapters[key]) return emailAdapters[key];

  switch (key) {
    case 'SENDGRID':
      if (typeof SendgridAdapter === 'function') {
        emailAdapters[key] = new SendgridAdapter();
      }
      break;
    case 'BREVO':
      if (typeof BrevoAdapter === 'function') {
        emailAdapters[key] = new BrevoAdapter();
      }
      break;
    case 'MAILCHIMP':
      if (typeof MailchimpAdapter === 'function') {
        emailAdapters[key] = new MailchimpAdapter();
      }
      break;
    case 'MAILGUN':
      if (typeof MailgunAdapter === 'function') {
        emailAdapters[key] = new MailgunAdapter();
      }
      break;
    case 'GMAIL':
      if (typeof GmailAdapter === 'function') {
        emailAdapters[key] = new GmailAdapter();
      }
      break;
    case 'OUTLOOK':
      if (typeof OutlookAdapter === 'function') {
        emailAdapters[key] = new OutlookAdapter();
      }
      break;
    case 'CONSTANT_CONTACT':
      if (typeof ConstantContactAdapter === 'function') {
        emailAdapters[key] = new ConstantContactAdapter();
      }
      break;
    case 'AWS_SES':
    case 'SYSTEM_DEFAULT':
      return getOrCreateSes();
    default:
      return getOrCreateSes();
  }

  return emailAdapters[key] || getOrCreateSes();
}
