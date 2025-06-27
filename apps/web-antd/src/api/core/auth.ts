import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    name: string;        // 用户名/邮箱/手机号
    password: string;    // 密码
    deviceType?: string; // 设备类型，默认为 'web'
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    code: number;
    message: string;
    data: {
      token: string;
      user: {
        id: number;
        uid: string;
        role: string;
        email: string;
        loginName: string;
      };
    };
    error: null;
  }

  /** 注册接口参数 */
  export interface RegisterParams {
    name: string;     // 用户名
    email: string;    // 邮箱
    password: string; // 密码
    code: string;     // 验证码
  }

  /** 注册接口返回值 */
  export interface RegisterResult {
    code: number;
    message: string;
    data: {
      uid: string;
      loginName: string;
      email: string;
    } | null;
    error: null;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  const params = {
    name: data.name,
    password: data.password,
    deviceType: data.deviceType || 'web'
  };
  return requestClient.post<AuthApi.LoginResult>('/api/auth/login', params);
}

/**
 * 注册
 */
export async function registerApi(data: AuthApi.RegisterParams) {
  return requestClient.post<AuthApi.RegisterResult>('/api/auth/register', data);
}

/**
 * 发送邮箱验证码
 */
export async function sendVerificationCodeApi(data: { email: string; type: number }) {
  return requestClient.post('/api/email/send-code', data);
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return requestClient.post('/api/auth/logout', {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/api/auth/codes');
}
