import { requestClient } from '#/api/request';

export interface LoginParams {
  email: string;
  password: string;
  deviceType?: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  code: string;
}

export interface ResetPasswordParams {
  email: string;
  code: string;
  newPassword: string;
}

export interface LoginResult {
  token: string;
  user: {
    uid: number;
    username: string;
    email: string;
    role: number;
    avatar?: string;
    real_name?: string;
  };
}

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
  error: string | null;
}

// 用户登录
export async function loginApi(data: LoginParams): Promise<ApiResponse<LoginResult>> {
  return requestClient.post('/api/auth/login', {
    ...data,
    deviceType: data.deviceType || 'web'
  });
}

// 用户注册
export async function registerApi(data: RegisterParams): Promise<ApiResponse<any>> {
  return requestClient.post('/api/auth/register', data);
}

// 重置密码
export async function resetPasswordApi(data: ResetPasswordParams): Promise<ApiResponse<any>> {
  return requestClient.post('/api/auth/reset-password', data);
}

// 退出登录
export async function logoutApi(): Promise<ApiResponse<any>> {
  return requestClient.post('/api/auth/logout');
}

// 刷新Token
export async function refreshTokenApi(): Promise<ApiResponse<{ token: string }>> {
  return requestClient.post('/api/auth/refresh-token');
}

// 获取当前用户信息
export async function getUserInfoApi(): Promise<ApiResponse<LoginResult['user']>> {
  return requestClient.get('/api/user/profile');
}