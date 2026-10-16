// ============================================================================
// BrokerOS — Shared Dashboard Metrics, Tasks & Leaderboard Types
// ============================================================================

import type { LeadListItemDto } from './lead.js';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  image?: string | null;
  employeeCode?: string;
  coldCalls?: number;
  followUps?: number;
  siteVisits?: number;
  bookings?: number;
  score: number;
}

export interface PostSalesFollowUp {
  id: string;
  scheduledDate: string;
  status: string;
  lead: {
    id: string;
    firstName: string;
    lastName?: string;
    phone: string;
    temperature?: string;
    status: string;
    avatar?: string;
  };
}

export interface PostSalesDashboardData {
  widgets: {
    totalBooked: number;
    documentsPending: number;
    loanCases: number;
    agreementPending: number;
    possessionPending: number;
    handoverCompleted: number;
  };
  documentsList: LeadListItemDto[];
  loanList: LeadListItemDto[];
  agreementList: LeadListItemDto[];
  possessionList: LeadListItemDto[];
  todayFollowUpList: PostSalesFollowUp[];
}

export interface SalesExecDashboardData {
  widgets: {
    siteVisitsScheduled: number;
    todaySiteVisitsDone: number;
    siteVisitsCompleted: number;
    negotiations: number;
    bookingsGenerated: number;
  };
  dailyTasks: {
    followUp: { target: number; done: number; backlog: number };
    siteVisits: { target: number; done: number; backlog: number };
  };
  todaySiteVisitList: any[];
  backlogSiteVisitList: any[];
  todayFollowUpList: any[];
  missedFollowUpBacklog: any[];
}

export interface SalesManagerDashboardData {
  widgets: {
    siteVisitsScheduled: number;
    siteVisitsCompleted: number;
    negotiations: number;
    bookingsGenerated: number;
  };
  pipeline?: Record<string, number>;
  teamLeaderboard?: Array<{
    id: string;
    name: string;
    image: string | null;
    svCompleted: number;
    bookings: number;
    activeNegotiations: number;
    score: number;
  }>;
  todaySiteVisitList: Array<{
    id: string;
    scheduledDate: string;
    status: string;
    project?: { name: string };
    salesExec?: { name: string; username: string };
    lead?: { id: string; firstName: string; lastName: string; phone: string; temperature: string };
  }>;
  todayFollowUpList: Array<{
    id: string;
    scheduledDate: string;
    status: string;
    user?: { name: string; username: string };
    lead?: { id: string; firstName: string; lastName: string; temperature: string; status: string };
  }>;
  backlogSiteVisitList: Array<{
    id: string;
    scheduledDate: string;
    status: string;
    project?: { name: string };
    salesExec?: { name: string; username: string };
    lead?: { id: string; firstName: string; lastName: string; phone: string; temperature: string };
  }>;
  missedFollowUpBacklog: Array<{
    id: string;
    scheduledDate: string;
    status: string;
    user?: { name: string; username: string };
    lead?: { id: string; firstName: string; lastName: string; temperature: string; status: string };
  }>;
}

export interface PreSalesDashboardData {
  widgets: {
    newLeads: number;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
    todayFollowUps: number;
    missedFollowUps: number;
    siteVisitsScheduled: number;
    bookingsGenerated: number;
  };
  pipeline: Record<string, number>;
  dailyTasks: {
    coldCall: { target: number; done: number; backlog: number };
    followUp: { target: number; done: number; backlog: number };
  };
  backlogs: {
    coldCallBacklogCount: number;
    missedFollowUps: Array<{
      id: string;
      scheduledDate: string;
      lead: { id: string; firstName: string; lastName?: string; temperature?: string; status: string } | null;
    }>;
  };
  todayFollowUpList: Array<{
    id: string;
    scheduledDate: string;
    status: string;
    lead: { id: string; firstName: string; lastName?: string; temperature?: string; status: string } | null;
  }>;
}
