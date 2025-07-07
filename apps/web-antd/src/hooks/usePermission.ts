import { computed } from 'vue';
import { useUserStore } from '@vben/stores';
import { 
  getUserPermissionLevel, 
  canAccessRoute, 
  getPermissionLevelText,
  getUserAccessibleFeatures,
  PermissionLevel 
} from '#/utils/permission';

/**
 * 权限管理组合式函数
 * 提供权限检查、权限级别获取等功能
 */
export function usePermission() {
  const userStore = useUserStore();

  // 当前用户权限级别
  const userPermissionLevel = computed(() => {
    return getUserPermissionLevel(userStore.userInfo);
  });

  // 当前用户权限级别文本
  const userPermissionText = computed(() => {
    return getPermissionLevelText(userPermissionLevel.value);
  });

  // 当前用户可访问的功能列表
  const accessibleFeatures = computed(() => {
    return getUserAccessibleFeatures(userPermissionLevel.value);
  });

  // 权限检查函数
  const hasPermission = (requiredLevel: number): boolean => {
    return userPermissionLevel.value >= requiredLevel;
  };

  // 路由访问权限检查
  const canAccess = (routeName: string): boolean => {
    return canAccessRoute(routeName, userPermissionLevel.value);
  };

  // 是否为基础用户
  const isBasicUser = computed(() => {
    return userPermissionLevel.value >= PermissionLevel.BASIC;
  });

  // 是否为管理员
  const isAdmin = computed(() => {
    return userPermissionLevel.value >= PermissionLevel.ADMIN;
  });

  // 是否为超级管理员
  const isSuperAdmin = computed(() => {
    return userPermissionLevel.value >= PermissionLevel.SUPER_ADMIN;
  });

  // 功能权限检查
  const permissions = {
    // 基础功能权限
    canViewDashboard: computed(() => hasPermission(PermissionLevel.BASIC)),
    canViewCircles: computed(() => hasPermission(PermissionLevel.BASIC)),
    canViewDevices: computed(() => hasPermission(PermissionLevel.BASIC)),
    canViewEvents: computed(() => hasPermission(PermissionLevel.BASIC)),
    canViewAlerts: computed(() => hasPermission(PermissionLevel.BASIC)),
    
    // 管理员功能权限
    canViewSettings: computed(() => hasPermission(PermissionLevel.ADMIN)),
    canManageUsers: computed(() => hasPermission(PermissionLevel.ADMIN)),
    
    // 超级管理员功能权限
    canViewAnalytics: computed(() => hasPermission(PermissionLevel.SUPER_ADMIN)),
    canViewMonitor: computed(() => hasPermission(PermissionLevel.SUPER_ADMIN)),
  };

  // 获取权限不足时的提示信息
  const getPermissionDeniedMessage = (requiredLevel: number): string => {
    const requiredText = getPermissionLevelText(requiredLevel);
    return `权限不足！此功能需要${requiredText}权限，您当前是${userPermissionText.value}。`;
  };

  // 检查并显示权限不足提示
  const checkPermissionWithMessage = (requiredLevel: number): boolean => {
    const hasAccess = hasPermission(requiredLevel);
    if (!hasAccess) {
      console.warn(getPermissionDeniedMessage(requiredLevel));
    }
    return hasAccess;
  };

  return {
    // 权限级别
    userPermissionLevel: userPermissionLevel.value,
    userPermissionText,
    accessibleFeatures,
    
    // 权限检查函数
    hasPermission,
    canAccess,
    checkPermissionWithMessage,
    getPermissionDeniedMessage,
    
    // 角色判断
    isBasicUser,
    isAdmin,
    isSuperAdmin,
    
    // 具体功能权限
    permissions,
    
    // 权限常量
    PermissionLevel,
  };
}

/**
 * 权限指令工厂函数
 * 用于创建 v-permission 指令
 */
export function createPermissionDirective() {
  return {
    mounted(el: HTMLElement, binding: { value: number | string }) {
      const { hasPermission, canAccess } = usePermission();
      
      let hasAccess = false;
      
      if (typeof binding.value === 'number') {
        // 权限级别检查
        hasAccess = hasPermission(binding.value);
      } else if (typeof binding.value === 'string') {
        // 路由名称检查
        hasAccess = canAccess(binding.value);
      }
      
      if (!hasAccess) {
        // 隐藏元素
        el.style.display = 'none';
        // 或者移除元素
        // el.remove();
      }
    },
    
    updated(el: HTMLElement, binding: { value: number | string }) {
      const { hasPermission, canAccess } = usePermission();
      
      let hasAccess = false;
      
      if (typeof binding.value === 'number') {
        hasAccess = hasPermission(binding.value);
      } else if (typeof binding.value === 'string') {
        hasAccess = canAccess(binding.value);
      }
      
      if (hasAccess) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    },
  };
}