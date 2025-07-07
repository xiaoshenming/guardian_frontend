import { requestClient } from '#/api/request';

export namespace EventApi {
  /** 事件日志基本信息 */
  export interface EventInfo {
    id: number;
    device_id: number;
    circle_id: number;
    event_type: string;
    event_data: string; // JSON字符串
    event_time: string;
    device_name?: string; // 关联查询的设备名称
  }

  /** 事件列表响应 */
  export interface EventListResponse {
    code: number;
    message: string;
    data: {
      events: EventInfo[];
      total: number;
    };
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
 * 获取指定圈子的事件日志
 */
export async function getCircleEventsApi(circleId: number, page: number = 1, limit: number = 20) {
  return requestClient.get<EventApi.EventListResponse>(`/api/guardian/events/circle/${circleId}`, {
    params: { page, limit }
  });
}

/**
 * 删除事件日志（仅管理员）
 */
export async function deleteEventApi(eventId: number) {
  return requestClient.delete<EventApi.CommonResponse>(`/api/guardian/events/${eventId}`);
}