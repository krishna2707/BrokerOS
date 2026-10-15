// ============================================================================
// BrokerOS — Email Credentials Resolver
// ============================================================================

import type { ProviderCredentials } from '@brokeros/types';
import type { PrismaClient } from '@brokeros/prisma';

export async function resolveEmailCredentials(
  prisma: PrismaClient,
  provider: string,
  fromEmail?: string | null,
  fromName?: string | null,
): Promise<ProviderCredentials | undefined> {
  if (provider === 'SYSTEM_DEFAULT') return undefined;

  const integration = await prisma.marketingIntegration.findFirst({
    where: { provider: provider as any, isActive: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  if (!integration) return undefined;

  return {
    apiKey: integration.apiKey || undefined,
    awsAccessKeyId: integration.awsAccessKeyId || undefined,
    awsSecretKey: integration.awsSecretKey || undefined,
    awsRegion: integration.awsRegion || undefined,
    mailchimpServer: integration.mailchimpServer || undefined,
    mailgunDomain: integration.mailgunDomain || undefined,
    mailgunRegion: (integration.mailgunRegion as 'US' | 'EU') || undefined,
    oauthClientId: integration.oauthClientId || undefined,
    oauthClientSecret: integration.oauthClientSecret || undefined,
    oauthRefreshToken: integration.oauthRefreshToken || undefined,
    oauthTenantId: integration.oauthTenantId || undefined,
    googleAppPassword: integration.googleAppPassword || undefined,
    fromEmail: fromEmail || integration.fromEmail || undefined,
    fromName: fromName || integration.fromName || undefined,
  };
}
