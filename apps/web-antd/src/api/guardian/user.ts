import { requestClient } from '#/api/request';
import type { ApiResponse } from './auth';

export interface UserProfile {
  uid: number;
  username: string;
  email: string;
  phone?: string;
  role: number;
  status: number;
  avatar?: string;
  real_name?: string;
  gender?: number;
  birthday?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  last_login_time?: string;
  last_login_ip?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileParams {
  username?: string;
  phone?: string;
  avatar?: string;
  real_name?: string;
  gender?: number;
  birthday?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
}

export interface ChangePasswordParams {
  old_password: string;
  new_password: string;
}

export interface ChangeEmailParams {
  new_email: string;
  code: string;
}

export interface UserStats {
  totalCircles: number;
  totalDevices: number;
  onlineDevices: number;
  urgentAlerts: number;
  todayEvents: number;
}

export interface UserDetailStats {
  total_circles: number;
  total_devices: number;
  total_events: number;
  unread_alerts: number;
  recent_activities: {
    type: string;
    content: string;
    time: string;
  }[];
}

// 获取用户资料
export async function getUserProfileApi(): Promise<ApiResponse<UserProfile>> {
  return requestClient.get('/api/user/profile');
}

// 更新用户资料
export async function updateUserProfileApi(data: UpdateProfileParams): Promise<ApiResponse<UserProfile>> {
  return requestClient.put('/api/user/profile', data);
}

// 修改密码
export async function changePasswordApi(data: ChangePasswordParams): Promise<ApiResponse<any>> {
  return requestClient.post('/api/user/change-password', data);
}

// 修改邮箱
export async function changeEmailApi(data: ChangeEmailParams): Promise<ApiResponse<any>> {
  return requestClient.post('/api/user/change-email', data);
}

// 上传头像
export async function uploadAvatarApi(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
  const formData = new FormData();
  formData.append('avatar', file);
  return requestClient.post('/api/user/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

// 获取用户统计信息（仪表板用）
export async function getUserStats(): Promise<ApiResponse<UserStats>> {
  return requestClient.get('/api/user/dashboard-stats');
}

// 获取用户详细统计信息
export async function getUserStatsApi(): Promise<ApiResponse<UserDetailStats>> {
  return requestClient.get('/api/user/stats');
}

// 获取用户活动日志
export async function getUserActivitiesApi(params?: {
  page?: number;
  limit?: number;
  start_time?: string;
  end_time?: string;
}): Promise<ApiResponse<{
  activities: {
    id: number;
    type: string;
    content: string;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
  }[];
  total: number;
  page: number;
  limit: number;
}>> {
  return requestClient.get('/api/user/activities', { params });
}

// 注销账户
export async function deleteAccountApi(password: string): Promise<ApiResponse<any>> {
  return requestClient.post('/api/user/delete-account', { password });
}

// 获取用户设置
export async function getUserSettingsApi(): Promise<ApiResponse<{
  notifications: {
    email_alerts: boolean;
    sms_alerts: boolean;
    push_alerts: boolean;
    alert_levels: number[];
  };
  privacy: {
    profile_visibility: string;
    activity_visibility: string;
  };
  preferences: {
    language: string;
    timezone: string;
    theme: string;
  };
}>> {
  return requestClient.get('/api/user/settings');
}

// 更新用户设置
export async function updateUserSettingsApi(settings: any): Promise<ApiResponse<any>> {
  return requestClient.put('/api/user/settings', settings);
}