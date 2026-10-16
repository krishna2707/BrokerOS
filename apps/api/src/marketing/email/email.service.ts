// ============================================================================
// BrokerOS — Email Service Facade & Coordinator (< 200 Line Law Compliant)
// ============================================================================

import { Injectable } from '@nestjs/common';
import type {
  AudienceEstimationResult,
  CampaignAnalyticsSummary,
  EmailWebhookEvent,
  IEmailMarketingProvider,
  PreFlightCostSummary,
} from '@brokeros/types';
import {
  CreateCampaignDto,
  SaveDraftCampaignDto,
  PreviewAudienceDto,
  SendTestEmailDto,
  ConnectIntegrationDto,
  AddSenderDomainDto,
  UpdateSenderDomainDto,
  CalculateCostEstimateDto,
  BulkAssignLeadsDto,
  ExportLeadsDto,
} from './dto/email.dto.js';
import { EmailAudienceService } from './services/email-audience.service.js';
import { EmailAnalyticsService } from './services/email-analytics.service.js';
import { EmailIntegrationsService } from './services/email-integrations.service.js';
import { EmailTrackingService } from './services/email-tracking.service.js';
import { EmailCampaignService } from './services/email-campaign.service.js';

@Injectable()
export class EmailService {
  constructor(
    public readonly audienceService: EmailAudienceService,
    public readonly analyticsService: EmailAnalyticsService,
    public readonly integrationsService: EmailIntegrationsService,
    public readonly trackingService: EmailTrackingService,
    public readonly campaignService: EmailCampaignService,
  ) {}

  // ── Facade Delegations: Audience ──

  async previewAudience(dto: PreviewAudienceDto): Promise<AudienceEstimationResult> {
    return this.audienceService.previewAudience(dto);
  }

  async promoteCsvRecipientToLead(recipientId: string, userId?: string) {
    return this.audienceService.promoteCsvRecipientToLead(recipientId, userId);
  }

  async bulkAssignRecipientsToCrm(dto: BulkAssignLeadsDto, userId?: string) {
    return this.audienceService.bulkAssignRecipientsToCrm(dto, userId);
  }

  async getExportLeadsData(dto: ExportLeadsDto) {
    return this.audienceService.getExportLeadsData(dto);
  }

  // ── Facade Delegations: Analytics ──

  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalyticsSummary> {
    return this.analyticsService.getCampaignAnalytics(campaignId);
  }

  async getCampaignRecipients(campaignId: string, query?: any) {
    return this.analyticsService.getCampaignRecipients(campaignId, query);
  }

  // ── Facade Delegations: Integrations & Providers ──

  getAdapter(providerType: string): IEmailMarketingProvider {
    return this.integrationsService.getAdapter(providerType);
  }

  renderMergeTags(template: string, data: any): string {
    return this.integrationsService.renderMergeTags(template, data);
  }

  async sendTestEmail(dto: SendTestEmailDto) {
    return this.integrationsService.sendTestEmail(dto);
  }

  async listIntegrations() {
    return this.integrationsService.listIntegrations();
  }

  async connectIntegration(dto: ConnectIntegrationDto) {
    return this.integrationsService.connectIntegration(dto);
  }

  async deleteIntegration(id: string) {
    return this.integrationsService.deleteIntegration(id);
  }

  async setDefaultIntegration(id: string) {
    return this.integrationsService.setDefaultIntegration(id);
  }

  async syncDomainsForIntegration(id: string) {
    return this.integrationsService.syncDomainsForIntegration(id);
  }

  async addSenderDomain(integrationId: string, dto: AddSenderDomainDto) {
    return this.integrationsService.addSenderDomain(integrationId, dto);
  }

  async updateSenderDomain(domainId: string, dto: UpdateSenderDomainDto) {
    return this.integrationsService.updateSenderDomain(domainId, dto);
  }

  async deleteSenderDomain(domainId: string) {
    return this.integrationsService.deleteSenderDomain(domainId);
  }

  async listAllActiveSenderDomains() {
    return this.integrationsService.listAllActiveSenderDomains();
  }

  // ── Facade Delegations: Tracking ──

  async recordOpenEvent(campaignId: string, recipientId: string, ip?: string, userAgent?: string) {
    return this.trackingService.recordOpenEvent(campaignId, recipientId, ip, userAgent);
  }

  async recordClickEvent(campaignId: string, recipientId: string, url: string, ip?: string, userAgent?: string) {
    return this.trackingService.recordClickEvent(campaignId, recipientId, url, ip, userAgent);
  }

  async recordUnsubscribe(email: string, campaignId?: string, reason?: string) {
    return this.trackingService.recordUnsubscribe(email, campaignId, reason);
  }

  async processWebhookEvents(events: EmailWebhookEvent[]) {
    return this.trackingService.processWebhookEvents(events);
  }

  // ── Facade Delegations: Campaign Lifecycle & Costing ──

  calculateCostEstimate(dto: CalculateCostEstimateDto): PreFlightCostSummary {
    return this.campaignService.calculateCostEstimate(dto);
  }

  async getProjects() {
    return this.campaignService.getProjects();
  }

  async saveDraftCampaign(dto: SaveDraftCampaignDto, userId?: string) {
    return this.campaignService.saveDraftCampaign(dto, userId);
  }

  async createCampaign(dto: CreateCampaignDto, userId?: string) {
    return this.campaignService.createCampaign(dto, userId);
  }

  async dispatchCampaign(campaignId: string) {
    return this.campaignService.dispatchCampaign(campaignId);
  }

  async findAllCampaigns(query?: any) {
    return this.campaignService.findAllCampaigns(query);
  }

  async findOneCampaign(id: string) {
    return this.campaignService.findOneCampaign(id);
  }

  async deleteCampaign(id: string) {
    return this.campaignService.deleteCampaign(id);
  }
}

// Backward-compatibility alias
export { EmailService as MarketingService };
