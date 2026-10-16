import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { authClient } from '@/lib/auth-client';
import { FinancialOverview } from '@/components/dashboards/sales-executive/analytics/FinancialOverview';
import { ConversionFunnel } from '@/components/dashboards/sales-executive/analytics/ConversionFunnel';
import { TowerHeatmap } from '@/components/dashboards/sales-executive/analytics/TowerHeatmap';
import { SharedLeaderboard } from '@/components/shared/SharedLeaderboard';
import { DetailedMetricsGrid } from '@/components/dashboards/sales-manager/analytics/DetailedMetricsGrid';
import { Users, Award } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import { exportAnalyticsHtmlMobile } from '@/lib/export-utils';

const ranges = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'all-time', label: 'All Time' },
];

export default function SalesManagerAnalyticsScreen() {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL as string;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('monthly');

  const load = useCallback(async () => {
    try {
      const res = await authClient.$fetch<any>(`/api/dashboard/sales-manager/analytics?timeRange=${timeRange}`, { baseURL: baseUrl });
      if (res.data) setAnalyticsData(res.data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load team analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [baseUrl, timeRange]);

  useEffect(() => {
    setLoading(true);
    // Debounce to prevent concurrent SecureStore access on rapid taps (avoids navigation context errors)
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading && !refreshing && !analyticsData) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f8fafc]">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-slate-500 font-medium mt-4">Loading team analytics...</Text>
      </View>
    );
  }

  if (error && !analyticsData) {
    return (
      <View className="flex-1 p-6 bg-[#f8fafc] justify-center">
        <View className="bg-red-50 p-6 rounded-2xl border border-red-100">
          <Text className="text-red-700 font-medium text-center">{error}</Text>
        </View>
      </View>
    );
  }

  const handleExportReport = () => {
    if (!analyticsData) return;
    const payload = {
      departmentName: 'Sales Manager Team Analytics & Forecasting',
      departmentCode: 'SALES_MANAGER',
      timeRange,
      generatedAt: new Date().toLocaleString(),
      summaryCards: [
        { label: 'Team Total Revenue', value: `₹${(analyticsData.financial?.totalRevenue || 0).toLocaleString()}`, subtitle: 'Booked Gross Sales' },
        { label: 'Team Deals Closed', value: analyticsData.financial?.dealsClosed ?? 0, subtitle: 'Confirmed bookings' },
        { label: 'Average Deal Size', value: `₹${(analyticsData.financial?.averageDealSize || 0).toLocaleString()}`, subtitle: 'Per booking average' },
        { label: 'Pipeline Value', value: `₹${(analyticsData.financial?.pipelineValue || 0).toLocaleString()}`, subtitle: 'Open negotiation value' },
      ],
      funnelStages: analyticsData.funnel
        ? [
          { name: 'Team Leads', count: analyticsData.funnel.leads ?? 0, color: '#6366f1' },
          { name: 'Site Visits', count: analyticsData.funnel.siteVisits ?? 0, color: '#a855f7' },
          { name: 'Negotiations', count: analyticsData.funnel.negotiations ?? 0, color: '#f59e0b' },
          { name: 'Bookings', count: analyticsData.funnel.bookings ?? 0, color: '#10b981' },
        ]
        : undefined,
      financialMetrics: [
        { label: 'Aggregate Team Revenue', value: `₹${(analyticsData.financial?.totalRevenue || 0).toLocaleString()}` },
        { label: 'Total Bookings Count', value: analyticsData.financial?.dealsClosed ?? 0 },
        { label: 'Mean Ticket Size', value: `₹${(analyticsData.financial?.averageDealSize || 0).toLocaleString()}` },
        { label: 'In-Flight Pipeline Value', value: `₹${(analyticsData.financial?.pipelineValue || 0).toLocaleString()}` },
      ],
    };
    exportAnalyticsHtmlMobile(payload, 'sales_manager_analytics');
  };

  return (
    <ScrollView
      className="flex-1 bg-[#f8fafc]"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
    >
      {/* Header */}
      <View className="px-6 pt-8 pb-4">
        <View className="flex-row items-center gap-3 mb-2">
          <View className="w-10 h-10 bg-emerald-100 rounded-xl items-center justify-center">
            <Users size={20} color="#10b981" />
          </View>
          <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">Team Analytics</Text>
        </View>
        <Text className="text-sm font-medium text-slate-500">
          Track your team&apos;s aggregate revenue, pipeline conversion, and project inventory velocity.
        </Text>
      </View>

      {/* Time Range Segmented Control & Export */}
      <View className="px-6 mb-4 flex-row items-center justify-between flex-wrap gap-2">
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
          className="bg-emerald-50 border border-emerald-300 px-3.5 py-2 rounded-full flex-row items-center gap-1.5 active:bg-emerald-100"
        >
          <Feather name="file-text" size={14} color="#059669" />
          <Text className="text-emerald-700 font-bold text-xs">Export Report</Text>
        </TouchableOpacity>
      </View>

      {analyticsData && (
        <View className="pb-12">
          <FinancialOverview financialData={analyticsData.financial} />

          <View className="mt-6 mb-6 px-6">
            <DetailedMetricsGrid metrics={analyticsData.detailedMetrics} />
          </View>

          <ConversionFunnel funnelData={analyticsData.funnel} />

          <View className="mt-6 mb-6 px-6">
            <SharedLeaderboard
              title="Team Leaderboard"
              icon={<Award size={20} className="text-amber-500" />}
              data={analyticsData.leaderboard || []}
              idKey="id"
              columns={[
                { key: 'svCompleted', label: 'SVs', width: 'w-10', align: 'right' },
                { key: 'activeNegotiations', label: 'Neg', width: 'w-10', align: 'right' },
                { key: 'bookings', label: 'Books', width: 'w-12', align: 'right' },
                { key: 'score', label: 'Score', width: 'w-12', align: 'right', isPrimary: true },
              ]}
            />
          </View>

          <View className="mt-6">
            <TowerHeatmap inventoryData={analyticsData.inventory} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}
