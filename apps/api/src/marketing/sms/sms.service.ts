// ============================================================================
// BrokerOS — SMS Service Facade & Coordinator (< 200 Line Law Compliant)
// ============================================================================

import { Injectable } from '@nestjs/common';
import type {
  ISmsMarketingProvider,
  SmsAudienceEstimationResult,
  SmsCampaignAnalyticsSummary,
  SmsPreFlightCostSummary,
  SmsWebhookEvent,
} from '@brokeros/types';
import {
  CreateSmsCampaignDto,
  SaveDraftSmsCampaignDto,
  PreviewSmsAudienceDto,
  SendTestSmsDto,
  ConnectSmsIntegrationDto,
  AddSenderNumberDto,
  UpdateSenderNumberDto,
  CalculateSmsCostEstimateDto,
  BulkAssignSmsLeadsDto,
  ExportSmsLeadsDto,
} from './dto/sms.dto.js';
import { SmsAudienceService } from './services/sms-audience.service.js';
import { SmsAnalyticsService } from './services/sms-analytics.service.js';
import { SmsIntegrationsService } from './services/sms-integrations.service.js';
import { SmsTrackingService } from './services/sms-tracking.service.js';
import { SmsCampaignService } from './services/sms-campaign.service.js';

@Injectable()
export class SmsService {
  constructor(
    public readonly audienceService: SmsAudienceService,
    public readonly analyticsService: SmsAnalyticsService,
    public readonly integrationsService: SmsIntegrationsService,
    public readonly trackingService: SmsTrackingService,
    public readonly campaignService: SmsCampaignService,
  ) { }

  // ── Facade Delegations: Audience ──

  async previewAudience(
    dto: PreviewSmsAudienceDto,
  ): Promise<SmsAudienceEstimationResult> {
    return this.audienceService.previewAudience(dto);
  }

  async promoteCsvRecipientToLead(recipientId: string, userId?: string) {
    return this.audienceService.promoteCsvRecipientToLead(recipientId, userId);
  }

  async bulkAssignRecipientsToCrm(dto: BulkAssignSmsLeadsDto, userId?: string) {
    return this.audienceService.bulkAssignRecipientsToCrm(dto, userId);
  }

  async getExportLeadsData(dto: ExportSmsLeadsDto) {
    return this.audienceService.getExportLeadsData(dto);
  }

  // ── Facade Delegations: Analytics ──

  async getCampaignAnalytics(
    campaignId: string,
  ): Promise<SmsCampaignAnalyticsSummary> {
    return this.analyticsService.getCampaignAnalytics(campaignId);
  }

  async getCampaignRecipients(
    campaignId: string,
    query?: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      engagement?: string;
      crmStatus?: string;
    },
  ) {
    return this.analyticsService.getCampaignRecipients(campaignId, query);
  }

  // ── Facade Delegations: Integrations & Providers ──

  getAdapter(providerType: string): ISmsMarketingProvider {
    return this.integrationsService.getAdapter(providerType);
  }

  async sendTestSms(dto: SendTestSmsDto) {
    return this.integrationsService.sendTestSms(dto);
  }

  async listIntegrations() {
    return this.integrationsService.listIntegrations();
  }

  async connectIntegration(dto: ConnectSmsIntegrationDto) {
    return this.integrationsService.connectIntegration(dto);
  }

  async deleteIntegration(id: string) {
    return this.integrationsService.deleteIntegration(id);
  }

  async setDefaultIntegration(id: string) {
    return this.integrationsService.setDefaultIntegration(id);
  }

  async syncNumbersForIntegration(integrationId: string) {
    return this.integrationsService.syncNumbersForIntegration(integrationId);
  }

  async addSenderNumber(integrationId: string, dto: AddSenderNumberDto) {
    return this.integrationsService.addSenderNumber(integrationId, dto);
  }

  async updateSenderNumber(numberId: string, dto: UpdateSenderNumberDto) {
    return this.integrationsService.updateSenderNumber(numberId, dto);
  }

  async deleteSenderNumber(numberId: string) {
    return this.integrationsService.deleteSenderNumber(numberId);
  }

  async listAllActiveSenderNumbers() {
    return this.integrationsService.listAllActiveSenderNumbers();
  }

  // ── Facade Delegations: Tracking & Webhooks ──

  async resolveShortLink(
    code: string,
    ip?: string,
    userAgent?: string,
  ): Promise<string> {
    return this.trackingService.resolveShortLink(code, ip, userAgent);
  }

  async processWebhookEvents(events: SmsWebhookEvent[]) {
    return this.trackingService.processWebhookEvents(events);
  }

  // ── Facade Delegations: Campaign Lifecycle & Costing ──

  async getProjects() {
    return this.campaignService.getProjects();
  }

  async saveDraftCampaign(dto: SaveDraftSmsCampaignDto, userId?: string) {
    return this.campaignService.saveDraftCampaign(dto, userId);
  }

  async findAllCampaigns(query?: any) {
    return this.campaignService.findAllCampaigns(query);
  }

  async findOneCampaign(id: string) {
    return this.campaignService.findOneCampaign(id);
  }

  async listCampaigns(query?: { status?: string; isCpCampaign?: boolean }) {
    return this.campaignService.listCampaigns(query);
  }

  async getCampaign(id: string) {
    return this.campaignService.getCampaign(id);
  }

  async createCampaign(dto: CreateSmsCampaignDto, userId?: string) {
    return this.campaignService.createCampaign(dto, userId);
  }

  async dispatchCampaign(id: string) {
    return this.campaignService.dispatchCampaign(id);
  }

  calculateCostEstimate(
    dto: CalculateSmsCostEstimateDto,
  ): SmsPreFlightCostSummary {
    return this.campaignService.calculateCostEstimate(dto);
  }

  async deleteCampaign(id: string) {
    return this.campaignService.deleteCampaign(id);
  }
}
