<template>
  <Page
    description="权限系统测试和演示页面"
    title="权限管理测试"
  >
    <div class="p-6">
      <!-- 当前用户权限信息 -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center">
            <UserOutlined class="mr-2" />
            当前用户权限信息
          </div>
        </template>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Statistic
            title="用户名"
            :value="userStore.userInfo?.realName || '未知'"
          />
          <Statistic
            title="权限级别"
            :value="userPermissionLevel"
            :value-style="{ color: getPermissionColor(userPermissionLevel) }"
          />
          <Statistic
            title="权限描述"
            :value="userPermissionText"
          />
          <Statistic
            title="可访问功能"
            :value="accessibleFeatures.length"
            suffix="个"
          />
        </div>
        
        <div class="mt-4">
          <Tag
            v-for="feature in accessibleFeatures"
            :key="feature"
            color="blue"
            class="mb-2"
          >
            {{ feature }}
          </Tag>
        </div>
      </Card>

      <!-- 权限级别对比 -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center">
            <SafetyOutlined class="mr-2" />
            权限级别对比
          </div>
        </template>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 基础用户 -->
          <div 
            class="p-4 rounded-lg border-2 transition-all"
            :class="{
              'border-green-500 bg-green-50 shadow-lg': userPermissionLevel >= 1,
              'border-gray-300 bg-gray-50': userPermissionLevel < 1
            }"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-lg">基础用户</h3>
              <Badge 
                :status="userPermissionLevel >= 1 ? 'success' : 'default'"
                :text="userPermissionLevel >= 1 ? '已授权' : '未授权'"
              />
            </div>
            <p class="text-sm text-gray-600 mb-3">
              权限级别：1<br>
              可访问：仪表盘、守护圈、设备管理、事件记录、告警管理
            </p>
            <div class="space-y-1">
              <div v-for="feature in basicFeatures" :key="feature" class="flex items-center">
                <CheckCircleOutlined class="text-green-500 mr-2" />
                <span class="text-sm">{{ feature }}</span>
              </div>
            </div>
          </div>

          <!-- 管理员 -->
          <div 
            class="p-4 rounded-lg border-2 transition-all"
            :class="{
              'border-blue-500 bg-blue-50 shadow-lg': userPermissionLevel >= 2,
              'border-gray-300 bg-gray-50': userPermissionLevel < 2
            }"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-lg">管理员</h3>
              <Badge 
                :status="userPermissionLevel >= 2 ? 'processing' : 'default'"
                :text="userPermissionLevel >= 2 ? '已授权' : '未授权'"
              />
            </div>
            <p class="text-sm text-gray-600 mb-3">
              权限级别：2<br>
              在基础权限上增加：系统设置、用户管理
            </p>
            <div class="space-y-1">
              <div v-for="feature in adminFeatures" :key="feature" class="flex items-center">
                <CheckCircleOutlined 
                  :class="userPermissionLevel >= 2 ? 'text-blue-500' : 'text-gray-400'"
                  class="mr-2" 
                />
                <span class="text-sm" :class="userPermissionLevel >= 2 ? '' : 'text-gray-400'">
                  {{ feature }}
                </span>
              </div>
            </div>
          </div>

          <!-- 超级管理员 -->
          <div 
            class="p-4 rounded-lg border-2 transition-all"
            :class="{
              'border-purple-500 bg-purple-50 shadow-lg': userPermissionLevel >= 3,
              'border-gray-300 bg-gray-50': userPermissionLevel < 3
            }"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-lg">超级管理员</h3>
              <Badge 
                :status="userPermissionLevel >= 3 ? 'error' : 'default'"
                :text="userPermissionLevel >= 3 ? '已授权' : '未授权'"
              />
            </div>
            <p class="text-sm text-gray-600 mb-3">
              权限级别：3<br>
              在管理员权限上增加：数据分析、监控中心
            </p>
            <div class="space-y-1">
              <div v-for="feature in superAdminFeatures" :key="feature" class="flex items-center">
                <CheckCircleOutlined 
                  :class="userPermissionLevel >= 3 ? 'text-purple-500' : 'text-gray-400'"
                  class="mr-2" 
                />
                <span class="text-sm" :class="userPermissionLevel >= 3 ? '' : 'text-gray-400'">
                  {{ feature }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- 功能权限测试 -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center">
            <ExperimentOutlined class="mr-2" />
            功能权限测试
          </div>
        </template>
        
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <Button
            v-for="test in permissionTests"
            :key="test.name"
            :type="test.hasPermission ? 'primary' : 'default'"
            :disabled="!test.hasPermission"
            :danger="!test.hasPermission"
            @click="handlePermissionTest(test)"
            class="h-auto py-3 px-2"
          >
            <div class="text-center">
              <div class="text-sm font-medium">{{ test.label }}</div>
              <div class="text-xs mt-1">级别 {{ test.requiredLevel }}</div>
              <div class="text-xs mt-1">
                <CheckCircleOutlined v-if="test.hasPermission" class="text-green-500" />
                <CloseCircleOutlined v-else class="text-red-500" />
              </div>
            </div>
          </Button>
        </div>
      </Card>

      <!-- 路由权限测试 -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center">
            <LinkOutlined class="mr-2" />
            路由权限测试
          </div>
        </template>
        
        <div class="space-y-3">
          <div 
            v-for="route in routeTests"
            :key="route.name"
            class="flex items-center justify-between p-3 border rounded-lg"
            :class="{
              'border-green-200 bg-green-50': route.canAccess,
              'border-red-200 bg-red-50': !route.canAccess
            }"
          >
            <div class="flex items-center">
              <component :is="route.icon" class="mr-3 text-lg" />
              <div>
                <div class="font-medium">{{ route.title }}</div>
                <div class="text-sm text-gray-500">{{ route.path }}</div>
              </div>
            </div>
            
            <div class="flex items-center space-x-3">
              <Tag :color="route.canAccess ? 'green' : 'red'">
                需要级别 {{ route.requiredLevel }}
              </Tag>
              
              <Button
                :type="route.canAccess ? 'primary' : 'default'"
                :disabled="!route.canAccess"
                size="small"
                @click="navigateToRoute(route)"
              >
                {{ route.canAccess ? '访问' : '无权限' }}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <!-- 权限操作日志 -->
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <HistoryOutlined class="mr-2" />
              权限操作日志
            </div>
            <Button size="small" @click="clearLogs">清空日志</Button>
          </div>
        </template>
        
        <div class="max-h-60 overflow-y-auto">
          <div v-if="permissionLogs.length === 0" class="text-center text-gray-500 py-4">
            暂无操作日志
          </div>
          <div 
            v-for="(log, index) in permissionLogs"
            :key="index"
            class="flex items-center justify-between py-2 border-b last:border-b-0"
          >
            <div class="flex items-center">
              <div 
                class="w-2 h-2 rounded-full mr-3"
                :class="{
                  'bg-green-500': log.success,
                  'bg-red-500': !log.success
                }"
              ></div>
              <span class="text-sm">{{ log.message }}</span>
            </div>
            <span class="text-xs text-gray-500">{{ log.time }}</span>
          </div>
        </div>
      </Card>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Card, 
  Statistic, 
  Tag, 
  Badge, 
  Button,
  message 
} from 'ant-design-vue';
import {
  UserOutlined,
  SafetyOutlined,
  ExperimentOutlined,
  LinkOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DashboardOutlined,
  UsersOutlined,
  SmartphoneOutlined,
  ActivityOutlined,
  AlertTriangleOutlined,
  SettingsOutlined,
  BarChart3Outlined
} from '@ant-design/icons-vue';
import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';
import { usePermission } from '#/hooks/usePermission';

const router = useRouter();
const userStore = useUserStore();

const {
  userPermissionLevel,
  userPermissionText,
  accessibleFeatures,
  permissions,
  canAccess,
  getPermissionDeniedMessage
} = usePermission();

// 权限操作日志
const permissionLogs = ref<Array<{
  message: string;
  success: boolean;
  time: string;
}>>([]);

// 添加日志
const addLog = (message: string, success: boolean) => {
  permissionLogs.value.unshift({
    message,
    success,
    time: new Date().toLocaleTimeString()
  });
  
  // 限制日志数量
  if (permissionLogs.value.length > 50) {
    permissionLogs.value = permissionLogs.value.slice(0, 50);
  }
};

// 清空日志
const clearLogs = () => {
  permissionLogs.value = [];
  message.success('日志已清空');
};

// 获取权限级别颜色
const getPermissionColor = (level: number) => {
  switch (level) {
    case 1: return '#52c41a';
    case 2: return '#1890ff';
    case 3: return '#722ed1';
    default: return '#d9d9d9';
  }
};

// 功能分类
const basicFeatures = ['仪表盘', '守护圈', '设备管理', '事件记录', '告警管理'];
const adminFeatures = ['系统设置', '用户管理'];
const superAdminFeatures = ['数据分析', '监控中心'];

// 权限测试项目
const permissionTests = computed(() => [
  {
    name: 'dashboard',
    label: '仪表盘',
    requiredLevel: 1,
    hasPermission: permissions.canViewDashboard.value
  },
  {
    name: 'circles',
    label: '守护圈',
    requiredLevel: 1,
    hasPermission: permissions.canViewCircles.value
  },
  {
    name: 'devices',
    label: '设备管理',
    requiredLevel: 1,
    hasPermission: permissions.canViewDevices.value
  },
  {
    name: 'events',
    label: '事件记录',
    requiredLevel: 1,
    hasPermission: permissions.canViewEvents.value
  },
  {
    name: 'alerts',
    label: '告警管理',
    requiredLevel: 1,
    hasPermission: permissions.canViewAlerts.value
  },
  {
    name: 'settings',
    label: '系统设置',
    requiredLevel: 2,
    hasPermission: permissions.canViewSettings.value
  },
  {
    name: 'users',
    label: '用户管理',
    requiredLevel: 2,
    hasPermission: permissions.canManageUsers.value
  },
  {
    name: 'analytics',
    label: '数据分析',
    requiredLevel: 3,
    hasPermission: permissions.canViewAnalytics.value
  },
  {
    name: 'monitor',
    label: '监控中心',
    requiredLevel: 3,
    hasPermission: permissions.canViewMonitor.value
  }
]);

// 路由测试项目
const routeTests = computed(() => [
  {
    name: 'GuardianDashboard',
    title: '仪表盘',
    path: '/guardian/dashboard',
    icon: DashboardOutlined,
    requiredLevel: 1,
    canAccess: canAccess('GuardianDashboard')
  },
  {
    name: 'GuardianCircles',
    title: '守护圈',
    path: '/guardian/circles',
    icon: UsersOutlined,
    requiredLevel: 1,
    canAccess: canAccess('GuardianCircles')
  },
  {
    name: 'GuardianDevices',
    title: '设备管理',
    path: '/guardian/devices',
    icon: SmartphoneOutlined,
    requiredLevel: 1,
    canAccess: canAccess('GuardianDevices')
  },
  {
    name: 'GuardianEvents',
    title: '事件记录',
    path: '/guardian/events',
    icon: ActivityOutlined,
    requiredLevel: 1,
    canAccess: canAccess('GuardianEvents')
  },
  {
    name: 'GuardianAlerts',
    title: '告警管理',
    path: '/guardian/alerts',
    icon: AlertTriangleOutlined,
    requiredLevel: 1,
    canAccess: canAccess('GuardianAlerts')
  },
  {
    name: 'GuardianSettings',
    title: '系统设置',
    path: '/guardian/settings',
    icon: SettingsOutlined,
    requiredLevel: 2,
    canAccess: canAccess('GuardianSettings')
  },
  {
    name: 'GuardianUsers',
    title: '用户管理',
    path: '/guardian/users',
    icon: UsersOutlined,
    requiredLevel: 2,
    canAccess: canAccess('GuardianUsers')
  },
  {
    name: 'GuardianAnalytics',
    title: '数据分析',
    path: '/guardian/analytics',
    icon: BarChart3Outlined,
    requiredLevel: 3,
    canAccess: canAccess('GuardianAnalytics')
  },
  {
    name: 'GuardianMonitor',
    title: '监控中心',
    path: '/guardian/monitor',
    icon: ActivityOutlined,
    requiredLevel: 3,
    canAccess: canAccess('GuardianMonitor')
  }
]);

// 处理权限测试
const handlePermissionTest = (test: any) => {
  if (test.hasPermission) {
    message.success(`✅ ${test.label} - 权限验证通过`);
    addLog(`权限测试通过：${test.label} (级别 ${test.requiredLevel})`, true);
  } else {
    const errorMsg = getPermissionDeniedMessage(test.requiredLevel);
    message.error(errorMsg);
    addLog(`权限测试失败：${test.label} - ${errorMsg}`, false);
  }
};

// 导航到路由
const navigateToRoute = (route: any) => {
  if (route.canAccess) {
    router.push(route.path);
    addLog(`成功访问：${route.title}`, true);
  } else {
    const errorMsg = `无法访问 ${route.title}，需要级别 ${route.requiredLevel} 权限`;
    message.error(errorMsg);
    addLog(errorMsg, false);
  }
};
</script>

<style scoped>
.permission-demo {
  max-width: 1200px;
  margin: 0 auto;
}
</style>