import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 token
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      
      // 转换参数格式以适配后端接口
      const loginParams = {
        name: params.username || params.name,
        password: params.password,
        deviceType: 'web'
      };
      
      const response = await loginApi(loginParams);
      const { token, user } = response;

      // 如果成功获取到 token
      if (token) {
        accessStore.setAccessToken(token);

        // 将后端用户信息转换为前端格式
        userInfo = {
          avatar: '', // 后端暂无头像字段，使用默认值
          desc: `${user.role} 用户`, // 使用角色作为描述
          homePath: '/analytics',
          id: user.id.toString(),
          realName: user.loginName,
          roles: [user.role],
          username: user.loginName,
        };

        userStore.setUserInfo(userInfo);
        
        // 获取权限码
         try {
           const accessCodes = await getAccessCodesApi();
           accessStore.setAccessCodes(accessCodes);
         } catch (error) {
           // 如果获取权限码失败，设置默认权限
           console.warn('获取权限码失败，使用默认权限:', error);
           accessStore.setAccessCodes([]);
         }

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                userInfo.homePath || preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.realName) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    let userInfo: null | UserInfo = null;
    userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
