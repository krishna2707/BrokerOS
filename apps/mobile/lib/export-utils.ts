import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { formatLeadsToCsv, generateAnalyticsHtmlReport, AnalyticsReportPayload } from '@brokeros/constants';
import { Alert } from 'react-native';

/**
 * Filter-aware CSV export for mobile leads and customers.
 * Generates RFC-4180 CSV, saves to app cache, and opens native share sheet.
 */
export async function exportLeadsToCsvMobile(
  leads: any[],
  filenamePrefix: string = 'leads_export'
): Promise<boolean> {
  try {
    if (!leads || leads.length === 0) {
      Alert.alert('No Leads', 'There are no leads in the current filtered view to export.');
      return false;
    }

    const csvContent = formatLeadsToCsv(leads);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${filenamePrefix}_${dateStr}.csv`;
    const fileUri = `${FileSystem.cacheDirectory || ''}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Leads CSV',
        UTI: 'public.comma-separated-values-text',
      });
      return true;
    } else {
      Alert.alert('Sharing Unavailable', 'File sharing is not available on this device.');
      return false;
    }
  } catch (error: any) {
    console.error('Error exporting leads CSV:', error);
    Alert.alert('Export Failed', error?.message || 'Could not export leads CSV.');
    return false;
  }
}

/**
 * Standalone responsive HTML Analytics Report export for mobile.
 * Generates styled HTML report, saves to app cache, and opens native share sheet.
 */
export async function exportAnalyticsHtmlMobile(
  payload: AnalyticsReportPayload,
  filenamePrefix: string = 'analytics_report'
): Promise<boolean> {
  try {
    if (!payload) {
      Alert.alert('No Data', 'Analytics data is not ready to be exported.');
      return false;
    }

    const htmlContent = generateAnalyticsHtmlReport(payload);
    const dateStr = new Date().toISOString().split('T')[0];
    const timeRangeTag = payload.timeRange ? payload.timeRange.toLowerCase() : 'all';
    const fileName = `${filenamePrefix}_${timeRangeTag}_${dateStr}.html`;
    const fileUri = `${FileSystem.cacheDirectory || ''}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/html',
        dialogTitle: 'Export Analytics Report',
        UTI: 'public.html',
      });
      return true;
    } else {
      Alert.alert('Sharing Unavailable', 'File sharing is not available on this device.');
      return false;
    }
  } catch (error: any) {
    console.error('Error exporting analytics HTML report:', error);
    Alert.alert('Export Failed', error?.message || 'Could not export report.');
    return false;
  }
}
