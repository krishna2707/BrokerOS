// ============================================================================
// BrokerOS — SMS Credentials Resolver
// ============================================================================

import type { SmsProviderCredentials } from '@brokeros/types';
import type { PrismaClient } from '@brokeros/prisma';

export async function resolveSmsCredentials(
  prisma: PrismaClient,
  provider: string,
  fromPhone?: string | null,
): Promise<SmsProviderCredentials | undefined> {
  const integration = await prisma.smsIntegration.findFirst({
    where: { provider: provider as any, isActive: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  if (!integration) return undefined;

  return {
    accountSid: integration.accountSid || undefined,
    authToken: integration.authToken || undefined,
    messagingServiceSid: integration.messagingServiceSid || undefined,
    apiKey: integration.apiKey || undefined,
    servicePlanId: integration.servicePlanId || undefined,
    awsAccessKeyId: integration.awsAccessKeyId || undefined,
    awsSecretKey: integration.awsSecretKey || undefined,
    awsRegion: integration.awsRegion || undefined,
    dltEntityId: integration.dltEntityId || undefined,
    fromNumber: fromPhone || undefined,
    senderId: fromPhone || undefined,
  };
}
