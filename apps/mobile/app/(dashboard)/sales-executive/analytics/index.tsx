import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { authClient } from '@/lib/auth-client';
import { FinancialOverview } from './components/FinancialOverview';
import { ConversionFunnel } from './components/ConversionFunnel';
import { TowerHeatmap } from './components/TowerHeatmap';
import { ProjectAnalytics } from './components/ProjectAnalytics';
import { SharedLeaderboard } from '@/components/shared/SharedLeaderboard';
import { TrendingUp, Award } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import { exportAnalyticsHtmlMobile } from '@/lib/export-utils';

const ranges = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'all-time', label: 'All Time' },
];

export default function AnalyticsScreen() {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL as string;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('monthly');

  const load = useCallback(async () => {
    try {
      const [analyticsRes, lbRes] = await Promise.all([
        authClient.$fetch<any>(`/api/dashboard/sales-executive/analytics?timeRange=${timeRange}`, { baseURL: baseUrl }),
        authClient.$fetch<any>('/api/dashboard/sales-executive/leaderboard', { baseURL: baseUrl }),
      ]);
      if (analyticsRes.data) setAnalyticsData(analyticsRes.data);
      if (lbRes.data) setLeaderboardData(lbRes.data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load analytics');
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
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-slate-500 font-medium mt-4">Loading premium analytics...</Text>
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
      departmentName: 'Sales Executive Performance Analytics',
      departmentCode: 'SALES_EXECUTIVE',
      timeRange,
      generatedAt: new Date().toLocaleString(),
      summaryCards: [
        { label: 'Total Sales Revenue', value: `₹${(analyticsData.financial?.totalRevenue || 0).toLocaleString()}`, subtitle: 'Booked Value' },
        { label: 'Realized Commission', value: `₹${(analyticsData.financial?.realizedCommission || 0).toLocaleString()}`, subtitle: 'Earned' },
        { label: 'Projected Commission', value: `₹${(analyticsData.financial?.projectedCommission || 0).toLocaleString()}`, subtitle: 'In-flight' },
        { label: 'Units Sold', value: analyticsData.financial?.unitsSold ?? 0, subtitle: 'Closed bookings' },
      ],
      funnelStages: [
        { name: 'Active Leads', count: analyticsData.funnel?.leads ?? 0, color: '#6366f1' },
        { name: 'Site Visits Done', count: analyticsData.funnel?.siteVisits ?? 0, color: '#a855f7' },
        { name: 'In Negotiation', count: analyticsData.funnel?.negotiations ?? 0, color: '#f59e0b' },
        { name: 'Confirmed Bookings', count: analyticsData.funnel?.bookings ?? 0, color: '#10b981' },
      ],
      financialMetrics: [
        { label: 'Total Booked Revenue', value: `₹${(analyticsData.financial?.totalRevenue || 0).toLocaleString()}` },
        { label: 'Realized Commission Payout', value: `₹${(analyticsData.financial?.realizedCommission || 0).toLocaleString()}` },
        { label: 'Pipeline Projected Commission', value: `₹${(analyticsData.financial?.projectedCommission || 0).toLocaleString()}` },
        { label: 'Units Sold Count', value: analyticsData.financial?.unitsSold ?? 0 },
      ],
    };
    exportAnalyticsHtmlMobile(payload, 'sales_exec_analytics');
  };

  return (
    <ScrollView
      className="flex-1 bg-[#f8fafc]"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
    >
      {/* Header */}
      <View className="px-6 pt-8 pb-4">
        <View className="flex-row items-center gap-3 mb-2">
          <View className="w-10 h-10 bg-indigo-100 rounded-xl items-center justify-center">
            <TrendingUp size={20} color="#4f46e5" />
          </View>
          <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics</Text>
        </View>
        <Text className="text-sm font-medium text-slate-500">
          Track your revenue, pipeline conversion, and tower inventory on the go.
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
          className="bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-full flex-row items-center gap-1.5 active:bg-indigo-100"
        >
          <Feather name="file-text" size={14} color="#4f46e5" />
          <Text className="text-indigo-700 font-bold text-xs">Export Report</Text>
        </TouchableOpacity>
      </View>

      {analyticsData && (
        <View className="pb-12">
          <FinancialOverview financialData={analyticsData.financial} />
          <ConversionFunnel funnelData={analyticsData.funnel} />

          {leaderboardData && (
            <View className="px-6 mb-8">
              <SharedLeaderboard
                title="Monthly Leaderboard"
                icon={<Award size={20} className="text-amber-500" />}
                data={leaderboardData.leaderboard || []}
                currentUserId={leaderboardData.currentUserId}
                idKey="id"
                columns={[
                  { key: 'svCompleted', label: 'SVs', width: 'w-10', align: 'right' },
                  { key: 'activeNegotiations', label: 'Neg', width: 'w-10', align: 'right' },
                  { key: 'bookings', label: 'Books', width: 'w-12', align: 'right' },
                  { key: 'score', label: 'Score', width: 'w-12', align: 'right', isPrimary: true },
                ]}
              />
            </View>
          )}

          <TowerHeatmap inventoryData={analyticsData.inventory} />
          <ProjectAnalytics projectData={analyticsData.project} />
        </View>
      )}
    </ScrollView>
  );
}
