<template>
  <div class="guardian-analytics">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>数据分析</h1>
          <p>数据分析与统计报告，洞察系统运行状况</p>
        </div>
        <div class="header-actions">
          <a-space>
            <a-range-picker
              v-model:value="dateRange"
              :placeholder="['开始日期', '结束日期']"
              @change="handleDateRangeChange"
            />
            <a-button @click="refreshData">
              <template #icon><ReloadOutlined /></template>
              刷新
            </a-button>
            <a-button @click="exportReport">
              <template #icon><DownloadOutlined /></template>
              导出报告
            </a-button>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <div class="metrics-section">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card :bordered="false" class="metric-card">
            <a-statistic
              title="总用户数"
              :value="metrics.totalUsers"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix><UserOutlined /></template>
              <template #suffix>
                <span class="trend-indicator positive">+12%</span>
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card :bordered="false" class="metric-card">
            <a-statistic
              title="活跃守护圈"
              :value="metrics.activeCircles"
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix><TeamOutlined /></template>
              <template #suffix>
                <span class="trend-indicator positive">+8%</span>
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card :bordered="false" class="metric-card">
            <a-statistic
              title="在线设备"
              :value="metrics.onlineDevices"
              :value-style="{ color: '#722ed1' }"
            >
              <template #prefix><MobileOutlined /></template>
              <template #suffix>
                <span class="trend-indicator negative">-3%</span>
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card :bordered="false" class="metric-card">
            <a-statistic
              title="今日事件"
              :value="metrics.todayEvents"
              :value-style="{ color: '#fa8c16' }"
            >
              <template #prefix><ActivityOutlined /></template>
              <template #suffix>
                <span class="trend-indicator positive">+15%</span>
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <a-row :gutter="[16, 16]">
        <!-- 用户增长趋势 -->
        <a-col :xs="24" :lg="12">
          <a-card title="用户增长趋势" :bordered="false">
            <div ref="userGrowthChart" class="chart-container"></div>
          </a-card>
        </a-col>
        
        <!-- 事件类型分布 -->
        <a-col :xs="24" :lg="12">
          <a-card title="事件类型分布" :bordered="false">
            <div ref="eventTypeChart" class="chart-container"></div>
          </a-card>
        </a-col>
        
        <!-- 设备状态分布 -->
        <a-col :xs="24" :lg="12">
          <a-card title="设备状态分布" :bordered="false">
            <div ref="deviceStatusChart" class="chart-container"></div>
          </a-card>
        </a-col>
        
        <!-- 告警级别统计 -->
        <a-col :xs="24" :lg="12">
          <a-card title="告警级别统计" :bordered="false">
            <div ref="alertLevelChart" class="chart-container"></div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 详细数据表格 -->
    <div class="tables-section">
      <a-row :gutter="[16, 16]">
        <!-- 热门守护圈 -->
        <a-col :xs="24" :lg="12">
          <a-card title="热门守护圈" :bordered="false">
            <template #extra>
              <a-button type="link" size="small" @click="$router.push('/guardian/circles')">
                查看全部
              </a-button>
            </template>
            <a-table
              :columns="circleColumns"
              :data-source="topCircles"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <a @click="$router.push(`/guardian/circles/${record.id}`)">
                    {{ record.name }}
                  </a>
                </template>
                <template v-else-if="column.key === 'activity'">
                  <a-progress
                    :percent="record.activity"
                    size="small"
                    :show-info="false"
                  />
                  <span class="ml-2">{{ record.activity }}%</span>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
        
        <!-- 最近事件 -->
        <a-col :xs="24" :lg="12">
          <a-card title="最近事件" :bordered="false">
            <template #extra>
              <a-button type="link" size="small" @click="$router.push('/guardian/events')">
                查看全部
              </a-button>
            </template>
            <a-list
              :data-source="recentEvents"
              size="small"
            >
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #avatar>
                      <a-avatar :style="getEventAvatarStyle(item.type)" size="small">
                        <component :is="getEventIcon(item.type)" />
                      </a-avatar>
                    </template>
                    <template #title>
                      <span>{{ getEventTypeText(item.type) }}</span>
                      <a-tag :color="getEventLevelColor(item.level)" size="small" class="ml-2">
                        {{ getEventLevelText(item.level) }}
                      </a-tag>
                    </template>
                    <template #description>
                      <div class="event-description">
                        <span>{{ item.description }}</span>
                        <span class="event-time">{{ formatDateTime(item.createdAt) }}</span>
                      </div>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 系统健康状态 -->
    <div class="health-section">
      <a-card title="系统健康状态" :bordered="false">
        <a-row :gutter="[24, 24]">
          <a-col :xs="24" :sm="8">
            <div class="health-item">
              <div class="health-title">
                <DatabaseOutlined class="health-icon" />
                数据库连接
              </div>
              <div class="health-status">
                <a-badge status="success" text="正常" />
                <span class="health-value">99.9%</span>
              </div>
            </div>
          </a-col>
          <a-col :xs="24" :sm="8">
            <div class="health-item">
              <div class="health-title">
                <CloudOutlined class="health-icon" />
                API 服务
              </div>
              <div class="health-status">
                <a-badge status="success" text="正常" />
                <span class="health-value">99.8%</span>
              </div>
            </div>
          </a-col>
          <a-col :xs="24" :sm="8">
            <div class="health-item">
              <div class="health-title">
                <WifiOutlined class="health-icon" />
                MQTT 服务
              </div>
              <div class="health-status">
                <a-badge status="success" text="正常" />
                <span class="health-value">99.7%</span>
              </div>
            </div>
          </a-col>
        </a-row>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import {
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  TeamOutlined,
  MobileOutlined,
  ActivityOutlined,
  DatabaseOutlined,
  CloudOutlined,
  WifiOutlined,
  ExclamationCircleOutlined,
  AlertOutlined,
  HeartOutlined,
} from '@ant-design/icons-vue';
import { formatDateTime } from '@vben/utils';
import * as echarts from 'echarts';
import type { Dayjs } from 'dayjs';

// 响应式数据
const dateRange = ref<[Dayjs, Dayjs]>();
const loading = ref(false);

// 核心指标
const metrics = reactive({
  totalUsers: 1248,
  activeCircles: 89,
  onlineDevices: 456,
  todayEvents: 127,
});

// 图表引用
const userGrowthChart = ref();
const eventTypeChart = ref();
const deviceStatusChart = ref();
const alertLevelChart = ref();

// 热门守护圈数据
const topCircles = ref([
  { id: 1, name: '家庭守护圈', members: 8, devices: 12, activity: 95 },
  { id: 2, name: '老年关爱圈', members: 15, devices: 18, activity: 88 },
  { id: 3, name: '社区安全圈', members: 25, devices: 30, activity: 82 },
  { id: 4, name: '学校监护圈', members: 12, devices: 20, activity: 76 },
  { id: 5, name: '企业安全圈', members: 35, devices: 45, activity: 71 },
]);

// 最近事件数据
const recentEvents = ref([
  {
    id: 1,
    type: 'fall',
    level: 'critical',
    description: '检测到跌倒事件，位置：客厅',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    type: 'sos',
    level: 'urgent',
    description: 'SOS求救信号，需要立即响应',
    createdAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 3,
    type: 'low_battery',
    level: 'warning',
    description: '设备电量不足，请及时充电',
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 4,
    type: 'offline',
    level: 'info',
    description: '设备离线，最后在线时间：10分钟前',
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
]);

// 表格列配置
const circleColumns = [
  {
    title: '守护圈名称',
    key: 'name',
    dataIndex: 'name',
  },
  {
    title: '成员数',
    dataIndex: 'members',
    width: 80,
  },
  {
    title: '设备数',
    dataIndex: 'devices',
    width: 80,
  },
  {
    title: '活跃度',
    key: 'activity',
    width: 120,
  },
];

// 方法
const refreshData = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.success('数据刷新成功');
  } catch (error) {
    message.error('数据刷新失败');
  } finally {
    loading.value = false;
  }
};

const exportReport = () => {
  message.info('报告导出功能开发中...');
};

const handleDateRangeChange = (dates: [Dayjs, Dayjs] | null) => {
  if (dates) {
    // 根据日期范围重新加载数据
    refreshData();
  }
};

const getEventIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    fall: ExclamationCircleOutlined,
    sos: AlertOutlined,
    low_battery: ActivityOutlined,
    offline: WifiOutlined,
    health: HeartOutlined,
  };
  return iconMap[type] || ActivityOutlined;
};

const getEventAvatarStyle = (type: string) => {
  const colorMap: Record<string, string> = {
    fall: '#f5222d',
    sos: '#fa541c',
    low_battery: '#faad14',
    offline: '#8c8c8c',
    health: '#52c41a',
  };
  return { backgroundColor: colorMap[type] || '#1890ff' };
};

const getEventTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    fall: '跌倒检测',
    sos: 'SOS求救',
    low_battery: '低电量',
    offline: '设备离线',
    health: '健康异常',
  };
  return textMap[type] || type;
};

const getEventLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    critical: 'red',
    urgent: 'orange',
    warning: 'gold',
    info: 'blue',
  };
  return colorMap[level] || 'default';
};

const getEventLevelText = (level: string) => {
  const textMap: Record<string, string> = {
    critical: '紧急',
    urgent: '重要',
    warning: '警告',
    info: '信息',
  };
  return textMap[level] || level;
};

// 初始化图表
const initCharts = () => {
  nextTick(() => {
    // 用户增长趋势图
    if (userGrowthChart.value) {
      const chart1 = echarts.init(userGrowthChart.value);
      chart1.setOption({
        tooltip: {
          trigger: 'axis',
        },
        xAxis: {
          type: 'category',
          data: ['1月', '2月', '3月', '4月', '5月', '6月'],
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: '新增用户',
            type: 'line',
            smooth: true,
            data: [120, 132, 101, 134, 90, 230],
            itemStyle: { color: '#1890ff' },
          },
          {
            name: '活跃用户',
            type: 'line',
            smooth: true,
            data: [220, 182, 191, 234, 290, 330],
            itemStyle: { color: '#52c41a' },
          },
        ],
      });
    }

    // 事件类型分布饼图
    if (eventTypeChart.value) {
      const chart2 = echarts.init(eventTypeChart.value);
      chart2.setOption({
        tooltip: {
          trigger: 'item',
        },
        series: [
          {
            type: 'pie',
            radius: '60%',
            data: [
              { value: 35, name: '跌倒检测' },
              { value: 25, name: 'SOS求救' },
              { value: 20, name: '低电量' },
              { value: 15, name: '设备离线' },
              { value: 5, name: '其他' },
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
          },
        ],
      });
    }

    // 设备状态分布环形图
    if (deviceStatusChart.value) {
      const chart3 = echarts.init(deviceStatusChart.value);
      chart3.setOption({
        tooltip: {
          trigger: 'item',
        },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            data: [
              { value: 456, name: '在线', itemStyle: { color: '#52c41a' } },
              { value: 89, name: '离线', itemStyle: { color: '#ff4d4f' } },
              { value: 23, name: '故障', itemStyle: { color: '#faad14' } },
            ],
          },
        ],
      });
    }

    // 告警级别统计柱状图
    if (alertLevelChart.value) {
      const chart4 = echarts.init(alertLevelChart.value);
      chart4.setOption({
        tooltip: {
          trigger: 'axis',
        },
        xAxis: {
          type: 'category',
          data: ['紧急', '重要', '警告', '信息'],
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            type: 'bar',
            data: [
              { value: 12, itemStyle: { color: '#f5222d' } },
              { value: 28, itemStyle: { color: '#fa541c' } },
              { value: 45, itemStyle: { color: '#faad14' } },
              { value: 67, itemStyle: { color: '#1890ff' } },
            ],
          },
        ],
      });
    }
  });
};

// 生命周期
onMounted(() => {
  initCharts();
});
</script>

<style scoped>
.guardian-analytics {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-title p {
  margin: 4px 0 0 0;
  color: #666;
}

.metrics-section {
  margin-bottom: 24px;
}

.metric-card {
  text-align: center;
}

.trend-indicator {
  font-size: 12px;
  margin-left: 8px;
}

.trend-indicator.positive {
  color: #52c41a;
}

.trend-indicator.negative {
  color: #ff4d4f;
}

.charts-section {
  margin-bottom: 24px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.tables-section {
  margin-bottom: 24px;
}

.event-description {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-time {
  font-size: 12px;
  color: #999;
}

.health-section {
  margin-bottom: 24px;
}

.health-item {
  text-align: center;
  padding: 16px;
}

.health-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.health-icon {
  margin-right: 8px;
  font-size: 16px;
}

.health-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.health-value {
  font-weight: 600;
  color: #52c41a;
}

.ml-2 {
  margin-left: 8px;
}

@media (max-width: 768px) {
  .guardian-analytics {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style>