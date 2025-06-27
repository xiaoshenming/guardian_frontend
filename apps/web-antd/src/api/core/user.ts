import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/api/user/info');
}

/**
 * 更新用户信息
 */
export async function updateUserInfoApi(data: Partial<UserInfo>) {
  return requestClient.put('/api/user/info', data);
}

/**
 * 修改密码
 */
export async function changePasswordApi(data: {
  oldPassword: string;
  newPassword: string;
}) {
  return requestClient.post('/api/user/change-password', data);
}
