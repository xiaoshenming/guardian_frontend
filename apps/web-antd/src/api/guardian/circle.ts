import { requestClient } from '#/api/request';
import type { ApiResponse } from './auth';

export interface Circle {
  id: number;
  circle_name: string;
  circle_desc?: string;
  invite_code: string;
  owner_id: number;
  max_members: number;
  status: number;
  settings?: any;
  created_at: string;
  updated_at: string;
  member_count?: number;
  device_count?: number;
  online_device_count?: number;
  unresolved_alert_count?: number;
}

export interface CircleMember {
  id: number;
  circle_id: number;
  user_id: number;
  role: number; // 1-普通成员, 2-管理员, 3-圈主
  nickname?: string;
  joined_at: string;
  user?: {
    uid: number;
    username: string;
    email: string;
    avatar?: string;
    real_name?: string;
  };
}

export interface CreateCircleParams {
  circle_name: string;
  circle_desc?: string;
  max_members?: number;
  settings?: any;
}

export interface UpdateMemberRoleParams {
  member_id: number;
  role: number;
}

// 创建守护圈
export async function createCircleApi(data: CreateCircleParams): Promise<ApiResponse<Circle>> {
  return requestClient.post('/api/circle/create', data);
}

// 获取用户的守护圈列表
export async function getUserCirclesApi(): Promise<ApiResponse<Circle[]>> {
  return requestClient.get('/api/circle/list');
}

// 通过邀请码加入守护圈
export async function joinCircleApi(inviteCode: string): Promise<ApiResponse<any>> {
  return requestClient.post('/api/circle/join', { invite_code: inviteCode });
}

// 获取守护圈详情
export async function getCircleDetailApi(circleId: number): Promise<ApiResponse<Circle>> {
  return requestClient.get(`/api/circle/${circleId}`);
}

// 获取守护圈成员列表
export async function getCircleMembersApi(circleId: number): Promise<ApiResponse<CircleMember[]>> {
  return requestClient.get(`/api/circle/${circleId}/members`);
}

// 更新成员角色（仅圈主可操作）
export async function updateMemberRoleApi(
  circleId: number, 
  data: UpdateMemberRoleParams
): Promise<ApiResponse<any>> {
  return requestClient.put(`/api/circle/${circleId}/member/role`, data);
}

// 移除成员（仅圈主可操作）
export async function removeMemberApi(
  circleId: number, 
  memberId: number
): Promise<ApiResponse<any>> {
  return requestClient.delete(`/api/circle/${circleId}/member/${memberId}`);
}

// 退出守护圈
export async function leaveCircleApi(circleId: number): Promise<ApiResponse<any>> {
  return requestClient.post(`/api/circle/${circleId}/leave`);
}

// 更新守护圈信息
export async function updateCircleApi(
  circleId: number, 
  data: Partial<CreateCircleParams>
): Promise<ApiResponse<Circle>> {
  return requestClient.put(`/api/circle/${circleId}`, data);
}

// 删除守护圈（仅圈主可操作）
export async function deleteCircleApi(circleId: number): Promise<ApiResponse<any>> {
  return requestClient.delete(`/api/circle/${circleId}`);
}

// 别名导出，保持向后兼容
export const createCircle = createCircleApi;
export const getUserCircles = getUserCirclesApi;
export const joinCircle = joinCircleApi;
export const getCircleDetail = getCircleDetailApi;
export const getCircleMembers = getCircleMembersApi;
export const updateMemberRole = updateMemberRoleApi;
export const removeMember = removeMemberApi;
export const leaveCircle = leaveCircleApi;
export const updateCircle = updateCircleApi;
export const deleteCircle = deleteCircleApi;
export const getCircleList = getUserCirclesApi; // 兼容旧的命名