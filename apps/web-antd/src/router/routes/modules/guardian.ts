import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:shield-check',
      order: 1000,
      title: '智能守护',
    },
    name: 'Guardian',
    path: '/guardian',
    children: [
      {
        name: 'GuardianDashboard',
        path: '/guardian/dashboard',
        component: () => import('#/views/guardian/dashboard/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:layout-dashboard',
          title: '仪表盘',
        },
      },
      {
        name: 'GuardianCircles',
        path: '/guardian/circles',
        component: () => import('#/views/guardian/circles/index.vue'),
        meta: {
          icon: 'lucide:users',
          title: '守护圈',
        },
      },
      {
        name: 'GuardianCircleDetail',
        path: '/guardian/circles/:id',
        component: () => import('#/views/guardian/circles/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '守护圈详情',
        },
      },
      {
        name: 'GuardianDevices',
        path: '/guardian/devices',
        component: () => import('#/views/guardian/devices/index.vue'),
        meta: {
          icon: 'lucide:smartphone',
          title: '设备管理',
        },
      },
      {
        name: 'GuardianDeviceDetail',
        path: '/guardian/devices/:id',
        component: () => import('#/views/guardian/devices/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '设备详情',
        },
      },
      {
        name: 'GuardianEvents',
        path: '/guardian/events',
        component: () => import('#/views/guardian/events/index.vue'),
        meta: {
          icon: 'lucide:activity',
          title: '事件记录',
        },
      },
      {
        name: 'GuardianAlerts',
        path: '/guardian/alerts',
        component: () => import('#/views/guardian/alerts/index.vue'),
        meta: {
          icon: 'lucide:alert-triangle',
          title: '告警管理',
        },
      },
      {
          name: 'GuardianSettings',
          path: '/guardian/settings',
          component: () => import('#/views/guardian/settings/index.vue'),
          meta: {
            icon: 'lucide:settings',
            title: '系统设置',
          },
        },
        {
          name: 'GuardianUsers',
          path: '/guardian/users',
          component: () => import('#/views/guardian/users/index.vue'),
          meta: {
            icon: 'lucide:users',
            title: '用户管理',
          },
        },
        {
          path: '/guardian/analytics',
          name: 'GuardianAnalytics',
          component: () => import('#/views/guardian/analytics/index.vue'),
          meta: {
            title: '数据分析',
            icon: 'lucide:bar-chart-3',
          },
        },
        {
          path: '/guardian/monitor',
          name: 'GuardianMonitor',
          component: () => import('#/views/guardian/monitor/index.vue'),
          meta: {
            title: '监控中心',
            icon: 'lucide:activity',
          },
        },
    ],
  },
];

export default routes;