import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { authClient } from '../../../lib/auth-client';
import { StatCard } from '../../../components/analytics/StatCard';
import { PremiumProgressBar } from '../../../components/analytics/PremiumProgressBar';
import { PremiumBarChart } from '../../../components/analytics/PremiumBarChart';
import { Feather } from '@expo/vector-icons';
import { exportAnalyticsHtmlMobile } from '../../../lib/export-utils';

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
  const baseURL = process.env.EXPO_PUBLIC_API_URL as string;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('monthly');

  const load = useCallback(async () => {
    try {
      const res = await authClient.$fetch<AnalyticsData>(`/api/dashboard/pre-sales/analytics?timeRange=${timeRange}`, { baseURL });
      if (res.data) {
        setData(res.data);
      }
      if (res.error) {
        throw new Error(res.error.message || 'Failed to load analytics');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [baseURL, timeRange]);

  useEffect(() => {
    setLoading(true);

    // Debounce the load to prevent concurrent SecureStore access via better-auth
    // which can throw a CodedError on Android if tapped rapidly.
    const timer = setTimeout(() => {
      load();
    }, 300);

    return () => clearTimeout(timer);
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading && !refreshing && !data) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-400 mt-3 text-sm font-medium">Crunching numbers...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 p-6">
        <Text className="text-red-500 font-bold text-lg mb-2">Error loading analytics</Text>
        <Text className="text-red-400 text-center">{error}</Text>
      </View>
    );
  }

  const pipelineStages = [
    { stage: 'Total Leads', count: data.pipeline.totalLeads, color: '#6366f1' },
    { stage: 'New Leads', count: data.pipeline.newLeads, color: '#818cf8' },
    { stage: 'Contacted', count: data.pipeline.contacted, color: '#a855f7' },
    { stage: 'Interested', count: data.pipeline.interested, color: '#fbbf24' },
    { stage: 'Qualified', count: data.pipeline.qualified, color: '#34d399' },
    { stage: 'Site Visits', count: data.pipeline.siteVisits, color: '#10b981' },
    { stage: 'Booked', count: data.pipeline.booked, color: '#059669' },
  ];

  const ranges = [
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
    { id: 'all-time', label: 'All Time' },
  ];

  const handleExportReport = () => {
    if (!data) return;
    const payload = {
      departmentName: 'Pre-Sales Performance Analytics',
      departmentCode: 'PRE_SALES',
      timeRange,
      generatedAt: new Date().toLocaleString(),
      summaryCards: [
        { label: 'Total Pipeline', value: data.pipeline.totalLeads, subtitle: 'Total Leads' },
        { label: 'Calls Made', value: data.calls.made, subtitle: 'Outbound dials' },
        { label: 'Connected Calls', value: data.calls.connected, change: `${data.calls.connectedPercentage}%`, subtitle: 'Conversations' },
        { label: 'Follow-Ups Done', value: data.followUps.completed, subtitle: 'Schedule compliance' },
        { label: 'Site Visits', value: data.pipeline.siteVisits, change: `${data.conversions.leadToSiteVisitPercentage}%`, subtitle: 'Qualification conversion' },
        { label: 'Deals Booked', value: data.pipeline.booked, subtitle: 'Confirmed bookings' },
      ],
      funnelStages: [
        { name: 'Total Leads', count: data.pipeline.totalLeads, color: '#6366f1' },
        { name: 'Contacted', count: data.pipeline.contacted, color: '#818cf8' },
        { name: 'Interested', count: data.pipeline.interested, color: '#a855f7' },
        { name: 'Qualified', count: data.pipeline.qualified, color: '#fbbf24' },
        { name: 'Site Visits', count: data.pipeline.siteVisits, color: '#34d399' },
        { name: 'Booked', count: data.pipeline.booked, color: '#10b981' },
        { name: 'Lost', count: data.pipeline.lost, color: '#ef4444' },
      ],
      activityMetrics: [
        { label: 'Total Outbound Dials', value: data.calls.made },
        { label: 'Connected Calls', value: data.calls.connected },
        { label: 'Connection Rate', value: `${data.calls.connectedPercentage}%` },
        { label: 'Avg Talk Time', value: `${Math.round(data.calls.avgTalkTimeSeconds || 0)}s` },
        { label: 'Follow-ups Completed', value: data.followUps.completed },
        { label: 'Lead-to-SV Rate', value: `${data.conversions.leadToSiteVisitPercentage}%` },
      ],
    };
    exportAnalyticsHtmlMobile(payload, 'presales_analytics');
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="p-5 pb-12 gap-6"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row justify-between items-center mb-2 mt-2">
        <View className="flex-1">
          <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics</Text>
          <Text className="text-slate-500 mt-1.5 text-sm font-medium">
            Deep dive into your pipeline progression, call performance, and conversion rates.
          </Text>
        </View>
      </View>

      {/* Time Range Segmented Control & Export */}
      <View className="flex-row items-center justify-between flex-wrap gap-2">
        <View className="flex-row bg-slate-200 border-0 p-1.5 rounded-full self-start">
          {ranges.map(r => (
            <TouchableOpacity
              key={r.id}
              onPress={() => setTimeRange(r.id)}
            >
              <View
                key={timeRange === r.id ? 'active' : 'inactive'}
                className={`px-4 py-1.5 rounded-full ${timeRange === r.id ? 'bg-white shadow-sm' : ''}`}
              >
                <Text className={`text-sm font-bold ${timeRange === r.id ? 'text-slate-900' : 'text-slate-500'}`}>
                  {r.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleExportReport}
          className="bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-full flex-row items-center gap-1.5 active:bg-indigo-100"
        >
          <Feather name="file-text" size={14} color="#4f46e5" />
          <Text className="text-indigo-700 font-bold text-xs">Export Report</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-2 mt-4">
        <Text className="text-xl font-bold text-slate-900">Overview & Pipeline</Text>
      </View>

      <View className="flex-row justify-between flex-wrap">
        <StatCard
          title="Total Leads"
          value={data.pipeline.totalLeads}
          icon="target"
          delay={0.1}
        />
        <StatCard
          title="Calls Made"
          value={data.calls.made}
          subtitle="Outbound dials"
          icon="phone-outgoing"
          delay={0.15}
        />
        <StatCard
          title="Calls Connected"
          value={data.calls.connected}
          subtitle="Conversations"
          icon="phone-incoming"
          delay={0.2}
        />
        <StatCard
          title="Follow-ups"
          value={data.followUps.completed}
          subtitle="Completed"
          icon="check-square"
          delay={0.25}
        />
        <StatCard
          title="Lost Leads"
          value={data.pipeline.lost}
          icon="x-circle"
          trend="down"
          trendValue="Requires attention"
          delay={0.65}
        />
      </View>

      <View className="mb-4">
        <PremiumBarChart
          data={pipelineStages}
          title="Pipeline Progression"
          description="Cumulative historical progression"
        />
      </View>

      <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
        <Text className="text-lg font-bold text-gray-900 mb-6">Deep Dive: Call Performance</Text>

        {/* Call Outcomes Bar */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-gray-700">Call Outcomes</Text>
            <Text className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
              Avg Time: {data.calls.avgTalkTimeSeconds}s
            </Text>
          </View>

          <View className="flex-row h-3 rounded-full overflow-hidden bg-gray-100 mb-4">
            <View style={{ flex: data.calls.connected }} className="bg-emerald-500 h-full" />
            <View style={{ flex: data.calls.notAnswered }} className="bg-amber-400 h-full" />
            <View style={{ flex: data.calls.busy }} className="bg-orange-500 h-full" />
            <View style={{ flex: data.calls.failed }} className="bg-rose-500 h-full" />
            <View style={{ flex: data.calls.voicemail }} className="bg-blue-400 h-full" />
          </View>

          <View className="flex-row flex-wrap justify-between gap-y-2">
            <View className="flex-row items-center w-[48%]">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-xs text-gray-600 font-medium flex-1">Connected</Text>
              <Text className="text-xs font-bold text-gray-900">{data.calls.connected}</Text>
            </View>
            <View className="flex-row items-center w-[48%]">
              <View className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
              <Text className="text-xs text-gray-600 font-medium flex-1">Not Answered</Text>
              <Text className="text-xs font-bold text-gray-900">{data.calls.notAnswered}</Text>
            </View>
            <View className="flex-row items-center w-[48%]">
              <View className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
              <Text className="text-xs text-gray-600 font-medium flex-1">Busy</Text>
              <Text className="text-xs font-bold text-gray-900">{data.calls.busy}</Text>
            </View>
            <View className="flex-row items-center w-[48%]">
              <View className="w-2 h-2 rounded-full bg-blue-400 mr-2" />
              <Text className="text-xs text-gray-600 font-medium flex-1">Voicemail</Text>
              <Text className="text-xs font-bold text-gray-900">{data.calls.voicemail}</Text>
            </View>
          </View>
        </View>



        <PremiumProgressBar
          percentage={data.calls.connectedPercentage}
          label="Call Connected Rate"
          subLabel={`${data.calls.connected} / ${data.calls.made} Calls`}
          color={data.calls.connectedPercentage > 30 ? 'success' : 'warning'}
          delay={0.5}
        />

        <View className="h-6" />

        <PremiumProgressBar
          percentage={data.conversions.leadToSiteVisitPercentage}
          label="Lead to Site Visit"
          subLabel="Overall pipeline health"
          color="primary"
          delay={0.7}
        />
      </View>
    </ScrollView>
  );
}
