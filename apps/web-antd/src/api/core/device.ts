import { requestClient } from '#/api/request';

export namespace DeviceApi {
  /** 设备基本信息 */
  export interface DeviceInfo {
    id: number;
    device_sn: string;
    device_name: string;
    device_model?: string;
    device_status: number; // 0: 离线, 1: 在线
    firmware_version?: string;
    last_heartbeat?: string;
    config?: string;
    circle_id?: number; // 可选，因为API响应中可能没有此字段
    bound_by_uid: number;
    bound_by_username?: string;
    create_time: string;
  }

  /** 绑定设备请求 */
  export interface BindDeviceRequest {
    device_sn: string;
    circle_id: number;
    device_name: string;
    device_model?: string;
    config?: string;
  }

  /** 更新设备请求 */
  export interface UpdateDeviceRequest {
    device_name: string;
    config?: string;
  }

  /** 设备列表响应 */
  export interface DeviceListResponse {
    code: number;
    message: string;
    data: DeviceInfo[];
    error: null;
  }

  /** 设备详情响应 */
  export interface DeviceDetailResponse {
    code: number;
    message: string;
    data: DeviceInfo;
    error: null;
  }

  /** 绑定设备响应 */
  export interface BindDeviceResponse {
    code: number;
    message: string;
    data: DeviceInfo;
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
 * 获取指定圈子的设备列表
 */
export async function getCircleDevicesApi(circleId: number) {
  return requestClient.get<DeviceApi.DeviceListResponse>(`/api/guardian/circle/${circleId}/devices`);
}

/**
 * 获取设备详情
 */
export async function getDeviceDetailApi(deviceId: number) {
  return requestClient.get<DeviceApi.DeviceDetailResponse>(`/api/guardian/device/${deviceId}`);
}

/**
 * 绑定设备到圈子
 */
export async function bindDeviceApi(data: DeviceApi.BindDeviceRequest) {
  return requestClient.post<DeviceApi.BindDeviceResponse>('/api/guardian/device/bind', data);
}

/**
 * 更新设备信息
 */
export async function updateDeviceApi(deviceId: number, data: DeviceApi.UpdateDeviceRequest) {
  return requestClient.put<DeviceApi.CommonResponse>(`/api/guardian/device/${deviceId}`, data);
}

/**
 * 解绑设备
 */
export async function unbindDeviceApi(deviceId: number) {
  return requestClient.delete<DeviceApi.CommonResponse>(`/api/guardian/device/${deviceId}`);
}