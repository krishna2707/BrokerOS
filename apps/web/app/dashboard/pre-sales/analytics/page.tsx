"use client";

import React, { useEffect, useState } from "react";
import PremiumBarChart from "@/components/analytics/PremiumBarChart";
import { CircularPercentage } from "@/components/analytics/CircularPercentage";
import { StatCard } from "@/components/analytics/StatCard";
import { CallOutcomes } from "@/components/analytics/CallOutcomes";
import { LeadSourceChart } from "@/components/analytics/LeadSourceChart";
import {
  PhoneOutgoing,
  PhoneIncoming,
  Target,
  XCircle,
  AlertCircle,
  ListChecks,
  Clock,
  Download,
  BarChart3,
  Loader2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { ExportAnalyticsReportButton } from "@/components/analytics/ExportAnalyticsReportButton";

interface AnalyticsData {
  pipeline: {
    totalLeads: number;
    newLeads: number;
    contacted: number;
    interested: number;
    qualified: number;
    visitScheduled: number;
    visitCompleted: number;
    siteVisits: number;
    booked: number;
    lost: number;
  };
  calls: {
    made: number;
    connected: number;
    notAnswered: number;
    busy: number;
    failed: number;
    voicemail: number;
    connectedPercentage: number;
    avgTalkTimeSeconds: number;
  };
  followUps: {
    completed: number;
  };
  sources: {
    source: string;
    count: number;
  }[];
  conversions: {
    leadToSiteVisitPercentage: number;
  };
}

export default function PreSalesAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("monthly");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/proxy";
        const res = await authClient.$fetch<AnalyticsData>(
          "/api/dashboard/pre-sales/analytics",
          {
            baseURL: baseUrl,
            query: { timeRange },
          }
        );

        if (res.data) {
          setData(res.data);
        }
        if (res.error) {
          throw new Error(res.error.message || "Failed to load analytics");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [timeRange]);

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[var(--brand-600)] animate-spin" />
        <p className="text-xs font-semibold text-[var(--text-muted)]">
          Aggregating pre-sales analytics…
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 m-4 flex items-center gap-3 animate-enter">
        <AlertCircle size={20} className="text-rose-600 shrink-0" />
        <div>
          <h3 className="text-sm font-extrabold text-rose-900 m-0">
            Error loading pre-sales analytics
          </h3>
          <p className="text-xs text-rose-700 mt-1 m-0">
            {error || "Unknown error occurred while fetching metrics."}
          </p>
        </div>
      </div>
    );
  }

  const pipelineStages = [
    { name: "Total Leads", value: data.pipeline.totalLeads },
    { name: "New Leads", value: data.pipeline.newLeads },
    { name: "Contacted", value: data.pipeline.contacted },
    { name: "Interested", value: data.pipeline.interested },
    { name: "Qualified", value: data.pipeline.qualified },
    { name: "Site Visits", value: data.pipeline.siteVisits },
    { name: "Booked", value: data.pipeline.booked },
  ];

  const ranges = [
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
    { id: "all-time", label: "All Time" },
  ];

  const reportPayload = data
    ? {
        departmentName: "Pre-Sales Performance Analytics",
        departmentCode: "PRE_SALES",
        timeRange,
        generatedAt: new Date().toLocaleString(),
        summaryCards: [
          { label: "Total Pipeline", value: data.pipeline.totalLeads, subtitle: "Total Leads" },
          { label: "Calls Made", value: data.calls.made, subtitle: "Outbound dials" },
          { label: "Connected Calls", value: data.calls.connected, change: `${data.calls.connectedPercentage}%`, subtitle: "Conversations" },
          { label: "Follow-Ups Done", value: data.followUps.completed, subtitle: "Schedule compliance" },
          { label: "Site Visits Scheduled", value: data.pipeline.siteVisits, change: `${data.conversions.leadToSiteVisitPercentage}%`, subtitle: "Qualification conversion" },
          { label: "Deals Booked", value: data.pipeline.booked, subtitle: "Confirmed bookings" },
        ],
        funnelStages: [
          { name: "Total Leads", count: data.pipeline.totalLeads, color: "#6366f1" },
          { name: "Contacted", count: data.pipeline.contacted, color: "#818cf8" },
          { name: "Interested", count: data.pipeline.interested, color: "#a855f7" },
          { name: "Qualified", count: data.pipeline.qualified, color: "#fbbf24" },
          { name: "Site Visits", count: data.pipeline.siteVisits, color: "#34d399" },
          { name: "Booked", count: data.pipeline.booked, color: "#10b981" },
          { name: "Lost", count: data.pipeline.lost, color: "#ef4444" },
        ],
        activityMetrics: [
          { label: "Total Dials", value: data.calls.made },
          { label: "Connected Calls", value: data.calls.connected },
          { label: "Connection Percentage", value: `${data.calls.connectedPercentage}%` },
          { label: "Avg Talk Time", value: `${Math.round(data.calls.avgTalkTimeSeconds || 0)}s` },
          { label: "Follow-ups Completed", value: data.followUps.completed },
          { label: "Lead-to-SV Rate", value: `${data.conversions.leadToSiteVisitPercentage}%` },
        ],
      }
    : null;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 m-0">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[var(--brand-700)]">
              <BarChart3 size={18} />
            </div>
            <span>Pre-Sales Performance Analytics</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5 m-0">
            Pipeline velocity, telephonic efficiency, and qualification conversions.
          </p>
        </div>

        {/* Time Range & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/60 shadow-2xs">
            {ranges.map((r) => (
              <button
                key={r.id}
                onClick={() => setTimeRange(r.id)}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  timeRange === r.id
                    ? "bg-white text-[var(--text-primary)] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <ExportAnalyticsReportButton
            payload={reportPayload}
            filenamePrefix="presales_analytics"
          />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Pipeline"
          value={data.pipeline.totalLeads}
          icon={Target}
          delay={0.05}
        />
        <StatCard
          title="Calls Made"
          value={data.calls.made}
          subtitle="Outbound dials"
          icon={PhoneOutgoing}
          delay={0.1}
        />
        <StatCard
          title="Connected"
          value={data.calls.connected}
          subtitle="Direct talks"
          icon={PhoneIncoming}
          delay={0.15}
        />
        <StatCard
          title="Follow-ups Done"
          value={data.followUps.completed}
          subtitle="Scheduled callbacks"
          icon={ListChecks}
          delay={0.2}
        />
        <StatCard
          title="Lost / Dropped"
          value={data.pipeline.lost}
          icon={XCircle}
          trend="down"
          trendValue="Requires audit"
          delay={0.25}
        />
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Pipeline Bar Chart & Calls */}
        <div className="lg:col-span-2 space-y-6">
          <PremiumBarChart
            data={pipelineStages}
            title="Pipeline Stage Progression"
            description="Cumulative lead advancement through stages"
            dataKey="value"
            categoryKey="name"
            color="#9333ea"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Call Outcomes */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider m-0">
                    Call Outcomes
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5 m-0">
                    Disposition breakdown
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200/60">
                  <Clock size={13} className="text-[var(--brand-700)]" />
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-[var(--brand-700)] block">
                      Avg Talk Time
                    </span>
                    <span className="text-xs font-extrabold text-purple-950 tabular-nums">
                      {data.calls.avgTalkTimeSeconds}s
                    </span>
                  </div>
                </div>
              </div>
              <CallOutcomes outcomes={data.calls} />
            </div>

            {/* Call Performance */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center space-y-3">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider w-full text-left m-0">
                Call Connection Ratio
              </h3>
              <CircularPercentage
                percentage={data.calls.connectedPercentage}
                label="Connected Rate"
                subLabel={`${data.calls.connected} of ${data.calls.made} calls`}
                color={data.calls.connectedPercentage > 30 ? "success" : "warning"}
                delay={0.3}
              />
            </div>
          </div>
        </div>

        {/* Circular Metrics & Lead Sources */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider w-full text-left m-0">
              Pipeline Health
            </h3>
            <CircularPercentage
              percentage={data.conversions.leadToSiteVisitPercentage}
              label="Lead to Site Visit"
              subLabel="Overall pipeline conversion rate"
              color="primary"
              delay={0.35}
            />
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
            <div>
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider m-0">
                Top Lead Channels
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5 m-0">
                Source attribution for site visits
              </p>
            </div>
            <LeadSourceChart data={data.sources} />
          </div>
        </div>
      </div>
    </div>
  );
}
