import { requestClient } from '#/api/request';
import type { ApiResponse } from './auth';

export interface Device {
  id: number;
  device_sn: string;
  device_name: string;
  device_type: string;
  device_model?: string;
  circle_id?: number;
  bound_user_id?: number;
  status: number; // 0-离线, 1-在线, 2-故障
  battery_level?: number;
  signal_strength?: number;
  firmware_version?: string;
  hardware_version?: string;
  config?: any;
  last_heartbeat?: string;
  bound_at?: string;
  created_at: string;
  updated_at: string;
  circle?: {
    id: number;
    circle_name: string;
  };
  bound_user?: {
    uid: number;
    username: string;
    real_name?: string;
  };
}

export interface DeviceEvent {
  id: number;
  device_id: number;
  circle_id: number;
  event_type: string;
  event_data?: any;
  event_time: string;
  processed: number;
  created_at: string;
}

export interface BindDeviceParams {
  device_sn: string;
  circle_id: number;
  device_name?: string;
}

export interface UpdateDeviceConfigParams {
  device_name?: string;
  config?: any;
}

export interface DeviceStats {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  fault_devices: number;
  battery_low_devices: number;
}

// 绑定设备到守护圈
export async function bindDeviceApi(data: BindDeviceParams): Promise<ApiResponse<Device>> {
  return requestClient.post('/api/device/bind', data);
}

// 获取守护圈设备列表
export async function getCircleDevicesApi(circleId: number): Promise<ApiResponse<Device[]>> {
  return requestClient.get(`/api/device/circle/${circleId}`);
}

// 获取设备详情
export async function getDeviceDetailApi(deviceId: number): Promise<ApiResponse<Device>> {
  return requestClient.get(`/api/device/${deviceId}`);
}

// 更新设备配置
export async function updateDeviceConfigApi(
  deviceId: number, 
  data: UpdateDeviceConfigParams
): Promise<ApiResponse<Device>> {
  return requestClient.put(`/api/device/${deviceId}/config`, data);
}

// 解绑设备
export async function unbindDeviceApi(deviceId: number): Promise<ApiResponse<any>> {
  return requestClient.delete(`/api/device/${deviceId}/unbind`);
}

// 获取设备状态统计
export async function getDeviceStatsApi(circleId?: number): Promise<ApiResponse<DeviceStats>> {
  const url = circleId ? `/api/device/stats?circle_id=${circleId}` : '/api/device/stats';
  return requestClient.get(url);
}

// 获取设备事件列表
export async function getDeviceEventsApi(
  deviceId: number,
  params?: {
    page?: number;
    limit?: number;
    event_type?: string;
    start_time?: string;
    end_time?: string;
  }
): Promise<ApiResponse<{ events: DeviceEvent[]; total: number; page: number; limit: number }>> {
  return requestClient.get(`/api/device/${deviceId}/events`, { params });
}

// 重启设备
export async function rebootDeviceApi(deviceId: number): Promise<ApiResponse<any>> {
  return requestClient.post(`/api/device/${deviceId}/reboot`);
}

// 更新设备固件
export async function updateFirmwareApi(
  deviceId: number, 
  firmwareUrl: string
): Promise<ApiResponse<any>> {
  return requestClient.post(`/api/device/${deviceId}/firmware`, { firmware_url: firmwareUrl });
}

// 获取设备日志
export async function getDeviceLogsApi(
  deviceId: number,
  params?: {
    page?: number;
    limit?: number;
    level?: string;
    start_time?: string;
    end_time?: string;
  }
): Promise<ApiResponse<any>> {
  return requestClient.get(`/api/device/${deviceId}/logs`, { params });
}