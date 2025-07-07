# 智能守护系统权限管理文档

## 概述

本系统实现了基于角色的权限控制（RBAC），支持三级权限管理：

- **权限级别 1 - 基础用户**：可查看仪表盘、守护圈、设备管理、事件记录、告警管理
- **权限级别 2 - 管理员**：在基础权限上增加系统设置、用户管理
- **权限级别 3 - 超级管理员**：在管理员权限上增加数据分析、监控中心

## 文件结构

```
src/
├── utils/permission.ts          # 权限工具函数
├── hooks/usePermission.ts       # 权限管理组合式函数
├── components/PermissionDemo.vue # 权限演示组件
├── router/
│   ├── guard.ts                # 路由守卫（包含权限检查）
│   ├── access.ts               # 权限访问控制
│   └── routes/modules/guardian.ts # 路由配置（包含权限要求）
└── store/auth.ts               # 认证存储（包含权限处理）
```

## 核心功能

### 1. 权限工具函数 (`utils/permission.ts`)

提供权限检查、路由过滤等核心功能：

```typescript
// 获取用户权限级别
const level = getUserPermissionLevel(userInfo);

// 检查路由访问权限
const canAccess = hasRoutePermission(route, userPermissionLevel);

// 过滤可访问的路由
const filteredRoutes = filterAccessibleRoutes(routes, userPermissionLevel);

// 检查页面访问权限
const hasAccess = canAccessRoute('GuardianSettings', userPermissionLevel);
```

### 2. 权限管理Hook (`hooks/usePermission.ts`)

在组件中使用权限检查：

```vue
<script setup>
import { usePermission } from '#/hooks/usePermission';

const {
  userPermissionLevel,
  userPermissionText,
  isAdmin,
  isSuperAdmin,
  permissions,
  hasPermission,
  canAccess
} = usePermission();
</script>

<template>
  <!-- 根据权限显示/隐藏元素 -->
  <div v-if="permissions.canViewSettings">
    系统设置内容
  </div>
  
  <!-- 权限检查按钮 -->
  <button 
    :disabled="!permissions.canManageUsers"
    @click="manageUsers"
  >
    用户管理
  </button>
</template>
```

### 3. 路由权限配置

在路由配置中添加权限要求：

```typescript
{
  name: 'GuardianSettings',
  path: '/guardian/settings',
  component: () => import('#/views/guardian/settings/index.vue'),
  meta: {
    icon: 'lucide:settings',
    title: '系统设置',
    requiredRole: 2, // 需要管理员权限
  },
}
```

### 4. 路由守卫

自动检查用户权限并控制页面访问：

- 未登录用户重定向到登录页
- 权限不足显示错误提示并重定向
- 根据权限过滤可访问的路由和菜单

## 使用指南

### 1. 在组件中检查权限

```vue
<script setup>
import { usePermission } from '#/hooks/usePermission';

const { permissions, hasPermission, getPermissionDeniedMessage } = usePermission();

// 检查具体功能权限
const handleDeleteUser = () => {
  if (!permissions.canManageUsers.value) {
    message.error(getPermissionDeniedMessage(2));
    return;
  }
  // 执行删除操作
};

// 检查权限级别
const handleAdvancedFeature = () => {
  if (!hasPermission(3)) {
    message.error('此功能需要超级管理员权限');
    return;
  }
  // 执行高级功能
};
</script>
```

### 2. 条件渲染

```vue
<template>
  <!-- 基于权限显示不同内容 -->
  <div>
    <!-- 所有用户都能看到 -->
    <BasicDashboard />
    
    <!-- 管理员及以上才能看到 -->
    <AdminPanel v-if="isAdmin" />
    
    <!-- 只有超级管理员能看到 -->
    <SuperAdminTools v-if="isSuperAdmin" />
  </div>
  
  <!-- 基于具体权限显示 -->
  <div>
    <UserManagement v-if="permissions.canManageUsers" />
    <SystemSettings v-if="permissions.canViewSettings" />
    <DataAnalytics v-if="permissions.canViewAnalytics" />
  </div>
</template>
```

### 3. 权限指令（可选）

```vue
<template>
  <!-- 使用权限指令 -->
  <button v-permission="2">管理员功能</button>
  <div v-permission="'GuardianAnalytics'">数据分析内容</div>
</template>
```

### 4. 编程式权限检查

```typescript
import { canAccessRoute, getUserPermissionLevel } from '#/utils/permission';
import { useUserStore } from '@vben/stores';

const userStore = useUserStore();
const userLevel = getUserPermissionLevel(userStore.userInfo);

// 检查是否可以访问特定路由
if (canAccessRoute('GuardianUsers', userLevel)) {
  // 可以访问用户管理页面
  router.push('/guardian/users');
} else {
  // 权限不足
  message.error('权限不足');
}
```

## 权限级别说明

### 基础用户 (级别 1)
- **可访问页面**：仪表盘、守护圈、设备管理、事件记录、告警管理
- **主要功能**：查看数据、基础操作
- **默认首页**：`/guardian/dashboard`

### 管理员 (级别 2)
- **可访问页面**：基础用户权限 + 系统设置、用户管理
- **主要功能**：系统配置、用户管理
- **默认首页**：`/guardian/settings`

### 超级管理员 (级别 3)
- **可访问页面**：管理员权限 + 数据分析、监控中心
- **主要功能**：高级分析、系统监控
- **默认首页**：`/guardian/analytics`

## 扩展权限系统

### 1. 添加新的权限级别

在 `utils/permission.ts` 中修改 `PermissionLevel` 枚举：

```typescript
export enum PermissionLevel {
  BASIC = 1,
  ADMIN = 2,
  SUPER_ADMIN = 3,
  SYSTEM_ADMIN = 4, // 新增权限级别
}
```

### 2. 添加新的页面权限

在路由配置中添加 `requiredRole`：

```typescript
{
  name: 'NewFeature',
  path: '/guardian/new-feature',
  meta: {
    title: '新功能',
    requiredRole: 4, // 需要新的权限级别
  },
}
```

在 `canAccessRoute` 函数中添加映射：

```typescript
const routePermissionMap: Record<string, number> = {
  // ... 现有映射
  'NewFeature': PermissionLevel.SYSTEM_ADMIN,
};
```

### 3. 添加新的功能权限

在 `usePermission` hook 中添加新的权限检查：

```typescript
const permissions = {
  // ... 现有权限
  canAccessNewFeature: computed(() => hasPermission(PermissionLevel.SYSTEM_ADMIN)),
};
```

## 注意事项

1. **安全性**：前端权限控制主要用于用户体验，真正的安全控制应该在后端实现
2. **一致性**：确保前后端权限逻辑保持一致
3. **测试**：使用 `PermissionDemo.vue` 组件测试不同权限级别的效果
4. **缓存**：权限信息会缓存在用户会话中，权限变更后需要重新登录
5. **错误处理**：权限不足时提供清晰的错误提示和引导

## 调试和测试

1. 使用 `PermissionDemo.vue` 组件查看当前权限状态
2. 在浏览器控制台查看权限相关日志
3. 模拟不同权限级别测试功能可用性
4. 检查路由守卫是否正确拦截无权限访问

## 常见问题

**Q: 如何临时提升用户权限进行测试？**
A: 可以在 `PermissionDemo.vue` 中使用模拟功能，或者直接修改用户信息中的 roles 字段。

**Q: 权限检查失败时如何自定义错误处理？**
A: 可以在 `usePermission` hook 中自定义 `checkPermissionWithMessage` 函数的行为。

**Q: 如何实现更细粒度的权限控制？**
A: 可以扩展权限系统，添加功能级别的权限码，而不仅仅依赖角色级别。

**Q: 权限变更后如何立即生效？**
A: 需要重新获取用户信息或重新登录，也可以实现实时权限更新机制。