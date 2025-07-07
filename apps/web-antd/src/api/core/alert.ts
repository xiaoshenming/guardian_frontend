import { requestClient } from '#/api/request';

export namespace AlertApi {
  /** 告警基本信息 */
  export interface AlertInfo {
    id: number;
    device_id: number;
    circle_id: number;
    alert_type: string;
    alert_level: number; // 1: 低, 2: 中, 3: 高, 4: 紧急
    alert_message: string;
    alert_data: string; // JSON字符串
    alert_time: string;
    status: number; // 1: 待处理, 2: 已处理, 3: 已忽略
    handled_by?: number;
    handled_time?: string;
    device_name?: string; // 关联查询的设备名称
    circle_name?: string; // 关联查询的圈子名称
    handler_name?: string; // 处理人姓名
  }

  /** 更新告警状态请求 */
  export interface UpdateAlertRequest {
    status: number; // 2: 已处理, 3: 已忽略
  }

  /** 告警统计信息 */
  export interface AlertStats {
    total: number;
    pending: number;
    acknowledged: number;
    ignored: number;
    today: number;
  }

  /** 告警列表响应 */
  export interface AlertListResponse {
    code: number;
    message: string;
    data: {
      alerts: AlertInfo[];
      total: number;
      page: number;
      limit: number;
    };
    error: null;
  }

  /** 告警统计响应 */
  export interface AlertStatsResponse {
    code: number;
    message: string;
    data: AlertStats;
    error: null;
  }

  /** 通用响应 */
  export interface CommonResponse {
    code: number;
    message: string;
    data: null;
    error: null;
  }
}

/**
 * 获取告警记录（根据用户角色返回不同范围的数据）
 */
export async function getAlertsApi(params?: {
  status?: string; // 'pending' | 'acknowledged' | 'all'
  page?: number;
  limit?: number;
  circleId?: number;
}) {
  return requestClient.get<AlertApi.AlertListResponse>('/api/guardian/alerts', {
    params
  });
}

/**
 * 获取告警统计信息
 */
export async function getAlertStatsApi() {
  return requestClient.get<AlertApi.AlertStatsResponse>('/api/guardian/alerts/stats');
}

/**
 * 获取指定圈子的告警记录
 */
export async function getCircleAlertsApi(
  circleId: number, 
  params?: {
    status?: string;
    page?: number;
    limit?: number;
  }
) {
  return requestClient.get<AlertApi.AlertListResponse>(`/api/guardian/alerts/${circleId}`, {
    params
  });
}

/**
 * 更新告警状态
 */
export async function updateAlertStatusApi(alertId: number, data: AlertApi.UpdateAlertRequest) {
  return requestClient.put<AlertApi.CommonResponse>(`/api/guardian/alerts/${alertId}`, data);
}

/**
 * 删除告警记录（仅管理员）
 */
export async function deleteAlertApi(alertId: number) {
  return requestClient.delete<AlertApi.CommonResponse>(`/api/guardian/alerts/${alertId}`);
}