import { requestClient } from '#/api/request';

export namespace CircleApi {
  /** 守护圈基本信息 */
  export interface CircleInfo {
    id: number;
    circle_name: string;
    description: string;
    creator_uid: number;
    circle_code?: string;
    create_time: string;
    member_count?: number;
    device_count?: number;
    creator_name?: string;
    creator_email?: string;
  }

  /** 创建守护圈请求 */
  export interface CreateCircleRequest {
    circle_name: string;
    description?: string;
  }

  /** 更新守护圈请求 */
  export interface UpdateCircleRequest {
    circle_name: string;
    description?: string;
  }

  /** 守护圈列表响应 */
  export interface CircleListResponse {
    code: number;
    message: string;
    data: CircleInfo[];
    error: null;
  }

  /** 守护圈详情响应 */
  export interface CircleDetailResponse {
    code: number;
    message: string;
    data: CircleInfo;
    error: null;
  }

  /** 创建守护圈响应 */
  export interface CreateCircleResponse {
    code: number;
    message: string;
    data: CircleInfo;
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
 * 获取守护圈列表
 */
export async function getCircleListApi() {
  return requestClient.get<CircleApi.CircleListResponse>('/api/guardian/circle');
}

/**
 * 获取守护圈详情
 */
export async function getCircleDetailApi(id: number) {
  return requestClient.get<CircleApi.CircleDetailResponse>(`/api/guardian/circle/${id}`);
}

/**
 * 创建守护圈
 */
export async function createCircleApi(data: CircleApi.CreateCircleRequest) {
  return requestClient.post<CircleApi.CreateCircleResponse>('/api/guardian/circle', data);
}

/**
 * 更新守护圈
 */
export async function updateCircleApi(id: number, data: CircleApi.UpdateCircleRequest) {
  return requestClient.put<CircleApi.CommonResponse>(`/api/guardian/circle/${id}`, data);
}

/**
 * 删除守护圈
 */
export async function deleteCircleApi(id: number) {
  return requestClient.delete<CircleApi.CommonResponse>(`/api/guardian/circle/${id}`);
}