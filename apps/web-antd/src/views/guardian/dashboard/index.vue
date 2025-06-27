<template>
  <div class="guardian-dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <a-card :bordered="false" class="welcome-card">
        <div class="welcome-content">
          <div class="welcome-text">
            <h1>欢迎使用智能守护系统</h1>
        <p class="welcome-subtitle">系统概览</p>
          </div>
          <div class="welcome-actions">
            <a-space>
              <a-button type="primary" @click="createCircle">
                <template #icon><PlusOutlined /></template>
                创建守护圈
              </a-button>
              <a-button @click="bindDevice">
                <template #icon><LinkOutlined /></template>
                绑定智能设备
              </a-button>
            </a-space>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="守护圈总数"
              :value="stats.totalCircles"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix>
                <TeamOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="设备总数"
              :value="stats.totalDevices"
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix>
                <MobileOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="在线设备"
              :value="stats.onlineDevices"
              :value-style="{ color: '#faad14' }"
            >
              <template #prefix>
                <WifiOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="紧急告警"
              :value="stats.urgentAlerts"
              :value-style="{ color: '#ff4d4f' }"
            >
              <template #prefix>
                <AlertOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 内容区域 -->
    <div class="content-section">
      <a-row :gutter="[16, 16]">
        <!-- 最近事件 -->
        <a-col :xs="24" :lg="12">
          <a-card title="最近事件" :bordered="false">
            <template #extra>
              <a-button type="link" @click="viewAllEvents">
                查看更多
              </a-button>
            </template>
            <a-list
              :data-source="recentEvents"
              :loading="eventsLoading"
              size="small"
            >
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #avatar>
                      <a-avatar :style="getEventAvatarStyle(item.type)">
                        <component :is="getEventIcon(item.type)" />
                      </a-avatar>
                    </template>
                    <template #title>
                      <span>{{ getEventTypeName(item.type) }}</span>
                      <a-tag :color="getEventLevelColor(item.level)" size="small" class="ml-2">
                        {{ item.level }}
                      </a-tag>
                    </template>
                    <template #description>
                      <div>
                        <div>{{ item.deviceName }} - {{ item.content }}</div>
                        <div class="text-gray-500 text-xs mt-1">
                          {{ formatTime(item.createdAt) }}
                        </div>
                      </div>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>

        <!-- 设备状态 -->
        <a-col :xs="24" :lg="12">
          <a-card title="设备状态" :bordered="false">
            <template #extra>
              <a-button type="link" @click="viewAllDevices">
                查看更多
              </a-button>
            </template>
            <div class="device-status-chart">
              <div ref="deviceChartRef" style="height: 300px;"></div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions-section">
      <a-card title="快捷操作" :bordered="false">
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :sm="8">
            <div class="quick-action-item" @click="createCircle">
              <div class="action-icon">
                <PlusCircleOutlined />
              </div>
              <div class="action-text">
                <div class="action-title">创建守护圈</div>
                <div class="action-desc">创建新的守护圈</div>
              </div>
            </div>
          </a-col>
          <a-col :xs="24" :sm="8">
            <div class="quick-action-item" @click="bindDevice">
              <div class="action-icon">
                <LinkOutlined />
              </div>
              <div class="action-text">
                <div class="action-title">绑定智能设备</div>
                <div class="action-desc">绑定新的智能设备</div>
              </div>
            </div>
          </a-col>
          <a-col :xs="24" :sm="8">
            <div class="quick-action-item" @click="viewAlerts">
              <div class="action-icon">
                <BellOutlined />
              </div>
              <div class="action-text">
                <div class="action-title">查看告警</div>
                <div class="action-desc">查看最新告警信息</div>
              </div>
            </div>
          </a-col>
        </a-row>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  PlusOutlined,
  LinkOutlined,
  TeamOutlined,
  MobileOutlined,
  WifiOutlined,
  AlertOutlined,
  PlusCircleOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons-vue';
import * as echarts from 'echarts';
import { getUserStats, getRecentEvents } from '#/api/guardian';
import type { UserStats, Event } from '#/api/guardian';

const router = useRouter();

// 响应式数据
const stats = ref<UserStats>({
  totalCircles: 0,
  totalDevices: 0,
  onlineDevices: 0,
  urgentAlerts: 0,
  todayEvents: 0,
});

const recentEvents = ref<Event[]>([]);
const eventsLoading = ref(false);
const deviceChartRef = ref<HTMLElement>();
let deviceChart: echarts.ECharts | null = null;

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await getUserStats();
    stats.value = response.data;
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
};

// 获取最近事件
const fetchRecentEvents = async () => {
  eventsLoading.value = true;
  try {
    const response = await getRecentEvents({ limit: 10 });
    recentEvents.value = response.data.list;
  } catch (error) {
    console.error('获取最近事件失败:', error);
  } finally {
    eventsLoading.value = false;
  }
};

// 初始化设备状态图表
let chartInitRetryCount = 0;
const MAX_CHART_INIT_RETRIES = 10;

const initDeviceChart = () => {
  if (!deviceChartRef.value) {
    console.warn('deviceChartRef.value is null');
    return;
  }
  
  // 检查 DOM 元素的尺寸
  const rect = deviceChartRef.value.getBoundingClientRect();
  
  if (rect.width === 0 || rect.height === 0) {
    if (chartInitRetryCount < MAX_CHART_INIT_RETRIES) {
      chartInitRetryCount++;
      console.warn(`Chart container has zero width or height, retrying... (${chartInitRetryCount}/${MAX_CHART_INIT_RETRIES})`);
      setTimeout(() => initDeviceChart(), 300);
      return;
    } else {
      console.error('Chart container initialization failed after maximum retries');
      return;
    }
  }
  
  // 重置重试计数
  chartInitRetryCount = 0;
  
  // 如果图表已存在，先销毁
  if (deviceChart) {
    deviceChart.dispose();
  }
  
  deviceChart = echarts.init(deviceChartRef.value);
  
  // 设置ResizeObserver
  setupResizeObserver();
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: ['在线', '离线', '故障']
    },
    series: [
      {
        name: '设备状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: stats.value.onlineDevices, name: '在线', itemStyle: { color: '#52c41a' } },
          { value: stats.value.totalDevices - stats.value.onlineDevices, name: '离线', itemStyle: { color: '#faad14' } },
          { value: 2, name: '故障', itemStyle: { color: '#ff4d4f' } }
        ]
      }
    ]
  };
  
  deviceChart.setOption(option);
};

// 防抖函数
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 更新图表数据
const updateDeviceChart = debounce(() => {
  if (!deviceChart || !stats.value) {
    return;
  }
  
  const option = {
    series: [{
      data: [
        { value: stats.value.onlineDevices, name: '在线', itemStyle: { color: '#52c41a' } },
        { value: stats.value.totalDevices - stats.value.onlineDevices, name: '离线', itemStyle: { color: '#faad14' } },
        { value: 2, name: '故障', itemStyle: { color: '#ff4d4f' } }
      ]
    }]
  };
  
  deviceChart.setOption(option);
}, 100);

// 监听stats变化，更新图表
watch(stats, () => {
  updateDeviceChart();
}, { deep: true });

// 窗口大小变化时重新调整图表
const handleResize = () => {
  if (deviceChart) {
    deviceChart.resize();
  }
};

// 使用ResizeObserver监听容器尺寸变化
let resizeObserver: ResizeObserver | null = null;

const setupResizeObserver = () => {
  if (deviceChartRef.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === deviceChartRef.value && deviceChart) {
          // 使用requestAnimationFrame优化性能
          requestAnimationFrame(() => {
            deviceChart?.resize();
          });
        }
      }
    });
    resizeObserver.observe(deviceChartRef.value);
  }
};

// 组件卸载时清理
onUnmounted(() => {
  if (deviceChart) {
    deviceChart.dispose();
    deviceChart = null;
  }
  // 移除窗口resize事件监听
  window.removeEventListener('resize', handleResize);
  // 清理ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

// 获取事件图标
const getEventIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    fall_detection: ExclamationCircleOutlined,
    gesture_wave: CheckCircleOutlined,
    gesture_ok: CheckCircleOutlined,
    motion_detection: ClockCircleOutlined,
    sound_detection: BellOutlined,
    emergency: AlertOutlined,
    heartbeat: CheckCircleOutlined,
    battery_low: ExclamationCircleOutlined,
    device_offline: ExclamationCircleOutlined,
  };
  return iconMap[type] || ClockCircleOutlined;
};

// 获取事件头像样式
const getEventAvatarStyle = (type: string) => {
  const colorMap: Record<string, string> = {
    fall_detection: '#ff4d4f',
    gesture_wave: '#52c41a',
    gesture_ok: '#52c41a',
    motion_detection: '#1890ff',
    sound_detection: '#faad14',
    emergency: '#ff4d4f',
    heartbeat: '#52c41a',
    battery_low: '#faad14',
    device_offline: '#ff4d4f',
  };
  return { backgroundColor: colorMap[type] || '#1890ff' };
};

// 获取事件级别颜色
const getEventLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    general: 'blue',
    important: 'orange',
    urgent: 'red',
  };
  return colorMap[level] || 'blue';
};

// 获取事件类型中文名称
const getEventTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    fall_detection: '跌倒检测',
    gesture_wave: '挥手手势',
    gesture_ok: 'OK手势',
    motion_detection: '运动检测',
    sound_detection: '声音检测',
    emergency: '紧急求助',
    heartbeat: '心跳检测',
    battery_low: '电量不足',
    device_offline: '设备离线',
  };
  return typeMap[type] || type;
};

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN');
};

// 快捷操作
const createCircle = () => {
  router.push('/guardian/circles?action=create');
};

const bindDevice = () => {
  router.push('/guardian/devices?action=bind');
};

const viewAlerts = () => {
  router.push('/guardian/alerts');
};

const viewAllEvents = () => {
  router.push('/guardian/events');
};

const viewAllDevices = () => {
  router.push('/guardian/devices');
};

// 生命周期
onMounted(async () => {
  await fetchStats();
  await fetchRecentEvents();
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);
  
  // 使用 nextTick 和 setTimeout 确保 DOM 完全渲染后再初始化图表
  nextTick(() => {
    setTimeout(() => {
      initDeviceChart();
    }, 500); // 增加延迟时间，确保容器完全渲染
  });
});
</script>

<style scoped lang="less">
.guardian-dashboard {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;

  .welcome-section {
    margin-bottom: 24px;

    .welcome-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      
      :deep(.ant-card-body) {
        padding: 32px;
      }
    }

    .welcome-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      @media (max-width: 768px) {
        flex-direction: column;
        text-align: center;
        gap: 20px;
      }
    }

    .welcome-text {
      h1 {
        color: white;
        margin: 0;
        font-size: 28px;
        font-weight: 600;
      }

      .welcome-subtitle {
        color: rgba(255, 255, 255, 0.8);
        margin: 8px 0 0 0;
        font-size: 16px;
      }
    }
  }

  .stats-section {
    margin-bottom: 24px;

    .stat-card {
      text-align: center;
      
      :deep(.ant-statistic-title) {
        font-size: 14px;
        color: #666;
      }
      
      :deep(.ant-statistic-content) {
        font-size: 24px;
        font-weight: 600;
      }
    }
  }

  .content-section {
    margin-bottom: 24px;

    .device-status-chart {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .quick-actions-section {
    .quick-action-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      background: white;

      &:hover {
        border-color: #1890ff;
        box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
      }

      .action-icon {
        font-size: 24px;
        color: #1890ff;
        margin-right: 12px;
      }

      .action-text {
        .action-title {
          font-size: 16px;
          font-weight: 500;
          color: #262626;
          margin-bottom: 4px;
        }

        .action-desc {
          font-size: 12px;
          color: #8c8c8c;
        }
      }
    }
  }
}

:deep(.ant-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.ant-list-item-meta-title) {
  margin-bottom: 4px;
}

.ml-2 {
  margin-left: 8px;
}

.text-gray-500 {
  color: #8c8c8c;
}

.text-xs {
  font-size: 12px;
}

.mt-1 {
  margin-top: 4px;
}
</style>