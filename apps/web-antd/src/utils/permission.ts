import type { RouteRecordRaw } from 'vue-router';
import type { UserInfo } from '@vben/types';

/**
 * 权限级别枚举
 */
export enum PermissionLevel {
  /** 基础用户 - 可查看仪表盘、守护圈、设备管理、事件记录、告警管理 */
  BASIC = 1,
  /** 管理员 - 在基础权限上增加系统设置、用户管理 */
  ADMIN = 2,
  /** 超级管理员 - 在管理员权限上增加数据分析、监控中心 */
  SUPER_ADMIN = 3,
}

/**
 * 获取用户权限级别
 * @param userInfo 用户信息
 * @returns 权限级别
 */
export function getUserPermissionLevel(userInfo: UserInfo | null): number {
  if (!userInfo) {
    return 0; // 未登录用户无权限
  }

  // 从用户角色中获取权限级别
  // 假设用户的 role 字段直接对应权限级别
  const role = userInfo.roles?.[0];
  
  if (typeof role === 'string') {
    // 如果角色是字符串，需要转换为数字
    switch (role.toLowerCase()) {
      case 'user':
      case 'basic':
        return PermissionLevel.BASIC;
      case 'admin':
      case 'manager':
        return PermissionLevel.ADMIN;
      case 'super_admin':
      case 'superadmin':
      case 'root':
        return PermissionLevel.SUPER_ADMIN;
      default:
        return PermissionLevel.BASIC;
    }
  }
  
  if (typeof role === 'number') {
    return role;
  }
  
  // 默认返回基础权限
  return PermissionLevel.BASIC;
}

/**
 * 检查用户是否有访问指定路由的权限
 * @param route 路由配置
 * @param userPermissionLevel 用户权限级别
 * @returns 是否有权限
 */
export function hasRoutePermission(
  route: RouteRecordRaw,
  userPermissionLevel: number
): boolean {
  const requiredRole = route.meta?.requiredRole as number;
  
  // 如果路由没有设置权限要求，默认允许访问
  if (typeof requiredRole !== 'number') {
    return true;
  }
  
  // 用户权限级别必须大于等于路由要求的权限级别
  return userPermissionLevel >= requiredRole;
}

/**
 * 过滤用户可访问的路由
 * @param routes 路由配置数组
 * @param userPermissionLevel 用户权限级别
 * @returns 过滤后的路由数组
 */
export function filterAccessibleRoutes(
  routes: RouteRecordRaw[],
  userPermissionLevel: number
): RouteRecordRaw[] {
  return routes
    .map((route) => {
      // 检查当前路由权限
      if (!hasRoutePermission(route, userPermissionLevel)) {
        return null;
      }
      
      // 如果有子路由，递归过滤
      if (route.children && route.children.length > 0) {
        const filteredChildren = filterAccessibleRoutes(
          route.children,
          userPermissionLevel
        );
        
        // 如果所有子路由都被过滤掉了，则隐藏父路由
        if (filteredChildren.length === 0) {
          return {
            ...route,
            meta: {
              ...route.meta,
              hideInMenu: true, // 在菜单中隐藏
            },
          };
        }
        
        return {
          ...route,
          children: filteredChildren,
        };
      }
      
      return route;
    })
    .filter((route): route is RouteRecordRaw => route !== null);
}

/**
 * 检查用户是否有访问指定页面的权限（用于路由守卫）
 * @param routeName 路由名称
 * @param userPermissionLevel 用户权限级别
 * @returns 是否有权限
 */
export function canAccessRoute(
  routeName: string,
  userPermissionLevel: number
): boolean {
  // 定义页面权限映射
  const routePermissionMap: Record<string, number> = {
    // 基础权限页面 (权限级别 1)
    'GuardianDashboard': PermissionLevel.BASIC,
    'GuardianCircles': PermissionLevel.BASIC,
    'GuardianDevices': PermissionLevel.BASIC,
    'GuardianEvents': PermissionLevel.BASIC,
    'GuardianAlerts': PermissionLevel.BASIC,
    
    // 管理员权限页面 (权限级别 2)
    'GuardianSettings': PermissionLevel.ADMIN,
    'GuardianUsers': PermissionLevel.ADMIN,
    
    // 超级管理员权限页面 (权限级别 3)
    'GuardianAnalytics': PermissionLevel.SUPER_ADMIN,
    'GuardianMonitor': PermissionLevel.SUPER_ADMIN,
  };
  
  const requiredPermission = routePermissionMap[routeName];
  
  // 如果路由不在权限映射中，默认允许访问
  if (typeof requiredPermission !== 'number') {
    return true;
  }
  
  return userPermissionLevel >= requiredPermission;
}

/**
 * 获取权限级别的描述文本
 * @param level 权限级别
 * @returns 描述文本
 */
export function getPermissionLevelText(level: number): string {
  switch (level) {
    case PermissionLevel.BASIC:
      return '基础用户';
    case PermissionLevel.ADMIN:
      return '管理员';
    case PermissionLevel.SUPER_ADMIN:
      return '超级管理员';
    default:
      return '未知权限';
  }
}

/**
 * 获取用户可访问的功能列表
 * @param userPermissionLevel 用户权限级别
 * @returns 功能列表
 */
export function getUserAccessibleFeatures(userPermissionLevel: number): string[] {
  const features: string[] = [];
  
  if (userPermissionLevel >= PermissionLevel.BASIC) {
    features.push('仪表盘', '守护圈', '设备管理', '事件记录', '告警管理');
  }
  
  if (userPermissionLevel >= PermissionLevel.ADMIN) {
    features.push('系统设置', '用户管理');
  }
  
  if (userPermissionLevel >= PermissionLevel.SUPER_ADMIN) {
    features.push('数据分析', '监控中心');
  }
  
  return features;
}