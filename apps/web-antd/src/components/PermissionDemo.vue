<template>
  <div class="permission-demo p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-4">权限管理演示</h2>
      <div class="bg-blue-50 p-4 rounded-lg">
        <p class="text-blue-800">
          <strong>当前用户权限：</strong>{{ userPermissionText }} (级别 {{ userPermissionLevel }})
        </p>
        <p class="text-blue-600 mt-2">
          <strong>可访问功能：</strong>{{ accessibleFeatures.join('、') }}
        </p>
      </div>
    </div>

    <!-- 权限级别展示 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div 
        class="p-4 rounded-lg border-2"
        :class="isBasicUser ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'"
      >
        <h3 class="font-semibold mb-2">基础用户 (级别 1)</h3>
        <p class="text-sm text-gray-600 mb-3">
          可访问：仪表盘、守护圈、设备管理、事件记录、告警管理
        </p>
        <div class="flex items-center">
          <span 
            class="inline-block w-3 h-3 rounded-full mr-2"
            :class="isBasicUser ? 'bg-green-500' : 'bg-gray-400'"
          ></span>
          <span class="text-sm">{{ isBasicUser ? '已授权' : '未授权' }}</span>
        </div>
      </div>

      <div 
        class="p-4 rounded-lg border-2"
        :class="isAdmin ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'"
      >
        <h3 class="font-semibold mb-2">管理员 (级别 2)</h3>
        <p class="text-sm text-gray-600 mb-3">
          在基础权限上增加：系统设置、用户管理
        </p>
        <div class="flex items-center">
          <span 
            class="inline-block w-3 h-3 rounded-full mr-2"
            :class="isAdmin ? 'bg-blue-500' : 'bg-gray-400'"
          ></span>
          <span class="text-sm">{{ isAdmin ? '已授权' : '未授权' }}</span>
        </div>
      </div>

      <div 
        class="p-4 rounded-lg border-2"
        :class="isSuperAdmin ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50'"
      >
        <h3 class="font-semibold mb-2">超级管理员 (级别 3)</h3>
        <p class="text-sm text-gray-600 mb-3">
          在管理员权限上增加：数据分析、监控中心
        </p>
        <div class="flex items-center">
          <span 
            class="inline-block w-3 h-3 rounded-full mr-2"
            :class="isSuperAdmin ? 'bg-purple-500' : 'bg-gray-400'"
          ></span>
          <span class="text-sm">{{ isSuperAdmin ? '已授权' : '未授权' }}</span>
        </div>
      </div>
    </div>

    <!-- 功能权限测试 -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-4">功能权限测试</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <!-- 基础功能 -->
        <PermissionButton 
          :has-permission="permissions.canViewDashboard"
          label="仪表盘"
          required-level="1"
        />
        <PermissionButton 
          :has-permission="permissions.canViewCircles"
          label="守护圈"
          required-level="1"
        />
        <PermissionButton 
          :has-permission="permissions.canViewDevices"
          label="设备管理"
          required-level="1"
        />
        <PermissionButton 
          :has-permission="permissions.canViewEvents"
          label="事件记录"
          required-level="1"
        />
        <PermissionButton 
          :has-permission="permissions.canViewAlerts"
          label="告警管理"
          required-level="1"
        />
        
        <!-- 管理员功能 -->
        <PermissionButton 
          :has-permission="permissions.canViewSettings"
          label="系统设置"
          required-level="2"
        />
        <PermissionButton 
          :has-permission="permissions.canManageUsers"
          label="用户管理"
          required-level="2"
        />
        
        <!-- 超级管理员功能 -->
        <PermissionButton 
          :has-permission="permissions.canViewAnalytics"
          label="数据分析"
          required-level="3"
        />
        <PermissionButton 
          :has-permission="permissions.canViewMonitor"
          label="监控中心"
          required-level="3"
        />
      </div>
    </div>

    <!-- 路由权限测试 -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-4">路由权限测试</h3>
      <div class="space-y-2">
        <div v-for="route in testRoutes" :key="route.name" class="flex items-center justify-between p-3 bg-gray-50 rounded">
          <span class="font-medium">{{ route.title }}</span>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">需要级别 {{ route.requiredLevel }}</span>
            <span 
              class="px-2 py-1 text-xs rounded"
              :class="canAccess(route.name) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
            >
              {{ canAccess(route.name) ? '可访问' : '无权限' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 权限提升模拟 -->
    <div class="bg-yellow-50 p-4 rounded-lg">
      <h3 class="text-lg font-semibold mb-2">权限模拟测试</h3>
      <p class="text-sm text-gray-600 mb-3">
        在实际应用中，权限由后端控制。这里仅用于演示不同权限级别的效果。
      </p>
      <div class="space-x-2">
        <button 
          @click="simulatePermission(1)"
          class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          模拟基础用户
        </button>
        <button 
          @click="simulatePermission(2)"
          class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          模拟管理员
        </button>
        <button 
          @click="simulatePermission(3)"
          class="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
        >
          模拟超级管理员
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePermission } from '#/hooks/usePermission';
import { useUserStore } from '@vben/stores';

// 权限按钮组件
const PermissionButton = defineComponent({
  props: {
    hasPermission: Boolean,
    label: String,
    requiredLevel: String,
  },
  template: `
    <button 
      :class="[
        'px-3 py-2 rounded text-sm font-medium transition-colors',
        hasPermission 
          ? 'bg-green-500 text-white hover:bg-green-600' 
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      ]"
      :disabled="!hasPermission"
    >
      {{ label }}
      <span class="text-xs ml-1">({{ requiredLevel }})</span>
    </button>
  `,
});

// 使用权限管理
const {
  userPermissionLevel,
  userPermissionText,
  accessibleFeatures,
  canAccess,
  isBasicUser,
  isAdmin,
  isSuperAdmin,
  permissions,
} = usePermission();

const userStore = useUserStore();

// 测试路由列表
const testRoutes = ref([
  { name: 'GuardianDashboard', title: '仪表盘', requiredLevel: 1 },
  { name: 'GuardianCircles', title: '守护圈', requiredLevel: 1 },
  { name: 'GuardianDevices', title: '设备管理', requiredLevel: 1 },
  { name: 'GuardianEvents', title: '事件记录', requiredLevel: 1 },
  { name: 'GuardianAlerts', title: '告警管理', requiredLevel: 1 },
  { name: 'GuardianSettings', title: '系统设置', requiredLevel: 2 },
  { name: 'GuardianUsers', title: '用户管理', requiredLevel: 2 },
  { name: 'GuardianAnalytics', title: '数据分析', requiredLevel: 3 },
  { name: 'GuardianMonitor', title: '监控中心', requiredLevel: 3 },
]);

// 模拟权限变更（仅用于演示）
const simulatePermission = (level: number) => {
  if (userStore.userInfo) {
    // 注意：这只是演示用途，实际应用中权限应该由后端控制
    userStore.userInfo.roles = [level];
    console.log(`模拟权限变更为级别 ${level}`);
  }
};
</script>

<style scoped>
.permission-demo {
  max-width: 1200px;
  margin: 0 auto;
}
</style>