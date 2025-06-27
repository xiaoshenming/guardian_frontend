import { requestClient } from '#/api/request';
import type { ApiResponse } from './auth';

export interface Event {
  id: number;
  device_id: number;
  circle_id: number;
  event_type: string;
  event_data?: any;
  event_time: string;
  processed: number;
  created_at: string;
  device?: {
    id: number;
    device_name: string;
    device_sn: string;
  };
}

export interface Alert {
  id: number;
  event_id: number;
  circle_id: number;
  alert_level: number; // 1-一般, 2-重要, 3-紧急
  alert_content: string;
  status: number; // 0-未确认, 1-已确认, 2-已处理
  acknowledged_by?: number;
  acknowledged_at?: string;
  resolved_by?: number;
  resolved_at?: string;
  created_at: string;
  event?: Event;
  acknowledged_user?: {
    uid: number;
    username: string;
    real_name?: string;
  };
  resolved_user?: {
    uid: number;
    username: string;
    real_name?: string;
  };
}

export interface EventStats {
  total_events: number;
  today_events: number;
  event_types: {
    [key: string]: number;
  };
  alert_levels: {
    general: number;
    important: number;
    urgent: number;
  };
  device_activity: {
    device_id: number;
    device_name: string;
    event_count: number;
  }[];
}

export interface EventListParams {
  page?: number;
  limit?: number;
  event_type?: string;
  start_time?: string;
  end_time?: string;
  device_id?: number;
}

export interface AlertListParams {
  page?: number;
  limit?: number;
  alert_level?: number;
  status?: number;
  start_time?: string;
  end_time?: string;
}

// 获取守护圈事件列表
export async function getCircleEventsApi(
  circleId: number,
  params?: EventListParams
): Promise<ApiResponse<{ events: Event[]; total: number; page: number; limit: number }>> {
  return requestClient.get(`/api/event/circle/${circleId}`, { params });
}

// 获取设备事件列表
export async function getDeviceEventsApi(
  deviceId: number,
  params?: EventListParams
): Promise<ApiResponse<{ events: Event[]; total: number; page: number; limit: number }>> {
  return requestClient.get(`/api/event/device/${deviceId}`, { params });
}

// 获取事件详情
export async function getEventDetailApi(eventId: number): Promise<ApiResponse<Event>> {
  return requestClient.get(`/api/event/${eventId}`);
}

// 获取告警列表
export async function getAlertsApi(
  circleId: number,
  params?: AlertListParams
): Promise<ApiResponse<{ alerts: Alert[]; total: number; page: number; limit: number }>> {
  return requestClient.get(`/api/event/alerts/${circleId}`, { params });
}

// 确认告警
export async function acknowledgeAlertApi(
  alertId: number,
  action: 'acknowledge' | 'resolve',
  note?: string
): Promise<ApiResponse<any>> {
  return requestClient.post(`/api/event/alert/${alertId}/acknowledge`, {
    action,
    note
  });
}

// 获取事件统计
export async function getEventStatsApi(
  circleId: number,
  timeRange?: {
    start_time: string;
    end_time: string;
  }
): Promise<ApiResponse<EventStats>> {
  return requestClient.get(`/api/event/stats/${circleId}`, {
    params: timeRange
  });
}

// 批量处理告警
export async function batchProcessAlertsApi(
  alertIds: number[],
  action: 'acknowledge' | 'resolve' | 'ignore',
  note?: string
): Promise<ApiResponse<any>> {
  return requestClient.post('/api/event/alerts/batch', {
    alert_ids: alertIds,
    action,
    note
  });
}

// 导出事件数据
export async function exportEventsApi(
  circleId: number,
  params: {
    start_time: string;
    end_time: string;
    event_type?: string;
    format: 'csv' | 'excel';
  }
): Promise<ApiResponse<{ download_url: string }>> {
  return requestClient.post(`/api/event/export/${circleId}`, params);
}

// 获取实时事件流（WebSocket连接信息）
export async function getEventStreamInfoApi(
  circleId: number
): Promise<ApiResponse<{ ws_url: string; token: string }>> {
  return requestClient.get(`/api/event/stream/${circleId}`);
}

// 获取最近事件
export async function getRecentEvents(
  params?: { limit?: number; event_type?: string }
): Promise<ApiResponse<{ list: Event[]; total: number }>> {
  return requestClient.get('/api/event/recent', { params });
}