import { requestClient } from '#/api/request';

export namespace DashboardApi {
  /** 仪表盘统计数据 */
  export interface StatsData {
    totalCircles: number;
    totalMembers: number;
    totalDevices: number;
    totalAlerts: number;
    activeDevices: number;
    pendingAlerts: number;
    myCircles: number;
    todayEvents: number;
  }

  /** 统计数据响应 */
  export interface StatsResponse {
    stats: StatsData;
    userRole: number;
    timestamp: string;
  }

  /** 图表数据项 */
  export interface ChartDataItem {
    date?: string;
    name?: string;
    value: number;
  }

  /** 图表数据 */
  export interface ChartsData {
    alertTrend: ChartDataItem[];
    deviceStatus: ChartDataItem[];
    circleActivity: ChartDataItem[];
    alertTypes: ChartDataItem[];
    memberGrowth: ChartDataItem[];
  }

  /** 图表数据响应 */
  export interface ChartsResponse {
    charts: ChartsData;
    userRole: number;
    timestamp: string;
    description: Record<string, string>;
  }
}

/**
 * 获取仪表盘统计数据
 */
export async function getDashboardStatsApi() {
  return requestClient.get<DashboardApi.StatsResponse>('/api/guardian/circle/dashboard/stats');
}

/**
 * 获取仪表盘图表数据
 */
export async function getDashboardChartsApi() {
  return requestClient.get<DashboardApi.ChartsResponse>('/api/guardian/circle/dashboard/charts');
}