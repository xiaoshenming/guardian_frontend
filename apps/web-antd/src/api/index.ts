// 导出 guardian 模块的所有内容
export * from './guardian';

// 导出 core 模块的特定内容，避免冲突
export { getUserInfoApi as getCoreUserInfoApi } from './core/user';
export { updateUserInfoApi, changePasswordApi } from './core/user';
export * from './core/menu';
// 导出 core/auth 的内容，但避免 loginApi 冲突
export { 
  registerApi as coreRegisterApi,
  sendVerificationCodeApi,
  refreshTokenApi,
  logoutApi as coreLogoutApi,
  getAccessCodesApi 
} from './core/auth';
export type { AuthApi } from './core/auth';