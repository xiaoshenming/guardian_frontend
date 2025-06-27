import { requestClient } from '#/api/request';
import type { ApiResponse } from './auth';

export interface SendCodeParams {
  email: string;
  type: 'register' | 'reset_password' | 'change_email';
}

export interface VerifyCodeParams {
  email: string;
  code: string;
  type: 'register' | 'reset_password' | 'change_email';
}

// 发送邮箱验证码
export async function sendEmailCodeApi(data: SendCodeParams): Promise<ApiResponse<any>> {
  return requestClient.post('/api/email/send-code', data);
}

// 验证邮箱验证码
export async function verifyEmailCodeApi(data: VerifyCodeParams): Promise<ApiResponse<any>> {
  return requestClient.post('/api/email/verify-code', data);
}

// 检查邮箱是否已注册
export async function checkEmailExistsApi(email: string): Promise<ApiResponse<{ exists: boolean }>> {
  return requestClient.get('/api/email/check-exists', {
    params: { email }
  });
}