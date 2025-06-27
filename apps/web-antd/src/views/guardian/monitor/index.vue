<template>
  <div class="guardian-monitor">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>监控中心</h1>
          <p>实时监控系统运行状态，确保服务稳定可靠</p>
        </div>
        <div class="header-actions">
          <a-space>
            <a-switch
              v-model:checked="autoRefresh"
              checked-children="自动刷新"
              un-checked-children="手动刷新"
              @change="handleAutoRefreshChange"
            />
            <a-button @click="refreshData">
              <template #icon><ReloadOutlined /></template>
              刷新
            </a-button>
            <a-button @click="exportLogs">
              <template #icon><DownloadOutlined /></template>
              导出数据
            </a-button>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 系统状态概览 -->
    <div class="status-overview">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card :bordered="false" class="status-card">
            <div class="status-item">
              <div class="status-icon success">
                <CheckCircleOutlined />
              </div>
              <div class="status-content">
                <div class="status-title">系统状态</div>
                <div class="status-value">正常运行</div>
                <div class="status-time">运行时间: {{ systemUptime }}</div>
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card :bordered="false" class="status-card">
            <div class="status-item">
              <div class="status-icon warning">
                <ExclamationCircleOutlined />
              </div>
              <div class="status-content">
                <div class="status-title">告警数量</div>
                <div class="status-value">{{ alertCount }}</div>
                <div class="status-time">最近1小时</div>
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card :bordered="false" class="status-card">
            <div class="status-item">
              <div class="status-icon info">
                <DatabaseOutlined />
              </div>
              <div class="status-content">
                <div class="status-title">数据库</div>
                <div class="status-value">{{ dbStatus }}</div>
                <div class="status-time">响应时间: {{ dbResponseTime }}ms</div>
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card :bordered="false" class="status-card">
            <div class="status-item">
              <div class="status-icon success">
                <CloudOutlined />
              </div>
              <div class="status-content">
                <div class="status-title">API服务</div>
                <div class="status-value">{{ apiStatus }}</div>
                <div class="status-time">QPS: {{ apiQps }}</div>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 实时监控图表 -->
    <div class="charts-section">
      <a-row :gutter="[16, 16]">
        <!-- CPU使用率 -->
        <a-col :xs="24" :lg="12">
          <a-card title="CPU使用率" :bordered="false">
            <template #extra>
              <a-tag :color="getCpuStatusColor()">{{ getCpuStatusText() }}</a-tag>
            </template>
            <div ref="cpuChart" class="chart-container"></div>
          </a-card>
        </a-col>
        
        <!-- 内存使用率 -->
        <a-col :xs="24" :lg="12">
          <a-card title="内存使用率" :bordered="false">
            <template #extra>
              <a-tag :color="getMemoryStatusColor()">{{ getMemoryStatusText() }}</a-tag>
            </template>
            <div ref="memoryChart" class="chart-container"></div>
          </a-card>
        </a-col>
        
        <!-- 网络流量 -->
        <a-col :xs="24" :lg="12">
          <a-card title="网络流量" :bordered="false">
            <div ref="networkChart" class="chart-container"></div>
          </a-card>
        </a-col>
        
        <!-- API请求统计 -->
        <a-col :xs="24" :lg="12">
          <a-card title="API请求统计" :bordered="false">
            <div ref="apiChart" class="chart-container"></div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 服务状态列表 -->
    <div class="services-section">
      <a-card title="服务状态" :bordered="false">
        <a-table
          :columns="serviceColumns"
          :data-source="services"
          :pagination="false"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-badge
                :status="getServiceStatusBadge(record.status)"
                :text="getServiceStatusText(record.status)"
              />
            </template>
            <template v-else-if="column.key === 'health'">
              <a-progress
                :percent="record.health"
                :status="getHealthStatus(record.health)"
                size="small"
              />
            </template>
            <template v-else-if="column.key === 'lastCheck'">
              {{ formatDateTime(record.lastCheck) }}
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="checkService(record)">
                  检查
                </a-button>
                <a-button type="link" size="small" @click="viewLogs(record)">
                  日志
                </a-button>
                <a-dropdown>
                  <a-button type="link" size="small">
                    更多 <DownOutlined />
                  </a-button>
                  <template #overlay>
                    <a-menu @click="({ key }) => handleServiceAction(key, record)">
                      <a-menu-item key="restart">
                        重启服务
                      </a-menu-item>
                      <a-menu-item key="config">
                        配置管理
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="disable" :disabled="record.status === 'stopped'">
                        停止服务
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 系统日志 -->
    <div class="logs-section">
      <a-card title="系统日志" :bordered="false">
        <template #extra>
          <a-space>
            <a-select
              v-model:value="logLevel"
              style="width: 120px"
              @change="filterLogs"
            >
              <a-select-option value="all">全部</a-select-option>
              <a-select-option value="error">错误</a-select-option>
              <a-select-option value="warn">警告</a-select-option>
              <a-select-option value="info">信息</a-select-option>
            </a-select>
            <a-button size="small" @click="clearLogs">
              清空日志
            </a-button>
          </a-space>
        </template>
        <div class="logs-container">
          <div
            v-for="log in filteredLogs"
            :key="log.id"
            :class="['log-item', `log-${log.level}`]"
          >
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <span class="log-level">{{ log.level.toUpperCase() }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 服务日志弹窗 -->
    <a-modal
      v-model:open="showLogsModal"
      :title="`${selectedService?.name} - 服务日志`"
      width="800px"
      :footer="null"
    >
      <div class="service-logs">
        <div
          v-for="log in serviceLogs"
          :key="log.id"
          :class="['log-item', `log-${log.level}`]"
        >
          <span class="log-time">{{ formatDateTime(log.timestamp) }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  ReloadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  CloudOutlined,
  DownOutlined,
} from '@ant-design/icons-vue';
import { formatDateTime } from '@vben/utils';
import * as echarts from 'echarts';

// 接口定义
interface Service {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'stopped' | 'error';
  health: number;
  port?: number;
  lastCheck: string;
  description: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  service?: string;
}

// 响应式数据
const autoRefresh = ref(true);
const refreshInterval = ref<NodeJS.Timeout>();
const systemUptime = ref('72小时15分钟');
const alertCount = ref(3);
const dbStatus = ref('正常');
const dbResponseTime = ref(12);
const apiStatus = ref('正常');
const apiQps = ref(156);
const logLevel = ref('all');
const showLogsModal = ref(false);
const selectedService = ref<Service | null>(null);

// 图表引用
const cpuChart = ref();
const memoryChart = ref();
const networkChart = ref();
const apiChart = ref();

// 监控数据
const cpuUsage = ref(45);
const memoryUsage = ref(68);

// 服务列表
const services = ref<Service[]>([
  {
    id: 'api-server',
    name: 'API服务器',
    type: 'Node.js',
    status: 'running',
    health: 98,
    port: 10018,
    lastCheck: new Date().toISOString(),
    description: 'Guardian主API服务',
  },
  {
    id: 'database',
    name: '数据库服务',
    type: 'MySQL',
    status: 'running',
    health: 95,
    port: 3306,
    lastCheck: new Date().toISOString(),
    description: 'MySQL数据库服务',
  },
  {
    id: 'mqtt-broker',
    name: 'MQTT代理',
    type: 'MQTT',
    status: 'running',
    health: 92,
    port: 1883,
    lastCheck: new Date().toISOString(),
    description: 'MQTT消息代理服务',
  },
  {
    id: 'redis',
    name: 'Redis缓存',
    type: 'Redis',
    status: 'running',
    health: 99,
    port: 6379,
    lastCheck: new Date().toISOString(),
    description: 'Redis缓存服务',
  },
]);

// 系统日志
const systemLogs = ref<LogEntry[]>([
  {
    id: '1',
    timestamp: new Date().toISOString(),
    level: 'info',
    message: '系统启动完成，所有服务正常运行',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    level: 'warn',
    message: 'CPU使用率较高，当前45%',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    level: 'error',
    message: '设备连接超时，设备ID: DEV001',
  },
]);

const serviceLogs = ref<LogEntry[]>([]);

// 计算属性
const filteredLogs = computed(() => {
  if (logLevel.value === 'all') {
    return systemLogs.value;
  }
  return systemLogs.value.filter(log => log.level === logLevel.value);
});

// 表格列配置
const serviceColumns = [
  {
    title: '服务名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '健康度',
    key: 'health',
    width: 120,
  },
  {
    title: '端口',
    dataIndex: 'port',
    key: 'port',
    width: 80,
  },
  {
    title: '最后检查',
    key: 'lastCheck',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right',
  },
];

// 方法
const refreshData = async () => {
  try {
    // 模拟数据刷新
    cpuUsage.value = Math.floor(Math.random() * 30) + 30;
    memoryUsage.value = Math.floor(Math.random() * 20) + 60;
    
    // 更新图表
    updateCharts();
    
    message.success('数据刷新成功');
  } catch (error) {
    message.error('数据刷新失败');
  }
};

const handleAutoRefreshChange = (checked: boolean) => {
  if (checked) {
    refreshInterval.value = setInterval(refreshData, 5000);
  } else {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
    }
  }
};

const exportLogs = () => {
  message.info('日志导出功能开发中...');
};

const getCpuStatusColor = () => {
  return cpuUsage.value > 80 ? 'red' : cpuUsage.value > 60 ? 'orange' : 'green';
};

const getCpuStatusText = () => {
  return cpuUsage.value > 80 ? '高负载' : cpuUsage.value > 60 ? '中等负载' : '正常';
};

const getMemoryStatusColor = () => {
  return memoryUsage.value > 85 ? 'red' : memoryUsage.value > 70 ? 'orange' : 'green';
};

const getMemoryStatusText = () => {
  return memoryUsage.value > 85 ? '内存不足' : memoryUsage.value > 70 ? '内存紧张' : '正常';
};

const getServiceStatusBadge = (status: string) => {
  const statusMap: Record<string, string> = {
    running: 'success',
    stopped: 'default',
    error: 'error',
  };
  return statusMap[status] || 'default';
};

const getServiceStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    error: '错误',
  };
  return textMap[status] || status;
};

const getHealthStatus = (health: number) => {
  return health < 60 ? 'exception' : health < 80 ? 'active' : 'success';
};

const checkService = (service: Service) => {
  message.loading('检查服务状态中...', 1);
  setTimeout(() => {
    message.success(`${service.name} 服务状态正常`);
  }, 1000);
};

const viewLogs = (service: Service) => {
  selectedService.value = service;
  // 模拟加载服务日志
  serviceLogs.value = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `${service.name} 服务启动成功`,
      service: service.id,
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: 'info',
      message: '处理客户端连接请求',
      service: service.id,
    },
  ];
  showLogsModal.value = true;
};

const handleServiceAction = (action: string, service: Service) => {
  switch (action) {
    case 'restart':
      Modal.confirm({
        title: '重启服务',
        content: `确定要重启 ${service.name} 服务吗？`,
        onOk: () => {
          message.success(`${service.name} 服务重启成功`);
        },
      });
      break;
    case 'config':
      message.info('配置管理功能开发中...');
      break;
    case 'disable':
      Modal.confirm({
        title: '停止服务',
        content: `确定要停止 ${service.name} 服务吗？`,
        onOk: () => {
          service.status = 'stopped';
          message.success(`${service.name} 服务已停止`);
        },
      });
      break;
  }
};

const filterLogs = () => {
  // 日志过滤逻辑已在计算属性中实现
};

const clearLogs = () => {
  Modal.confirm({
    title: '清空日志',
    content: '确定要清空所有系统日志吗？此操作不可恢复。',
    onOk: () => {
      systemLogs.value = [];
      message.success('日志已清空');
    },
  });
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString();
};

// 初始化图表
const initCharts = () => {
  nextTick(() => {
    // CPU使用率图表
    if (cpuChart.value) {
      const chart1 = echarts.init(cpuChart.value);
      chart1.setOption({
        tooltip: {
          trigger: 'axis',
        },
        xAxis: {
          type: 'category',
          data: Array.from({ length: 20 }, (_, i) => `${i + 1}分钟前`),
        },
        yAxis: {
          type: 'value',
          max: 100,
          axisLabel: {
            formatter: '{value}%',
          },
        },
        series: [
          {
            name: 'CPU使用率',
            type: 'line',
            smooth: true,
            data: Array.from({ length: 20 }, () => Math.floor(Math.random() * 30) + 30),
            itemStyle: { color: '#1890ff' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                  { offset: 1, color: 'rgba(24, 144, 255, 0.1)' },
                ],
              },
            },
          },
        ],
      });
    }

    // 内存使用率图表
    if (memoryChart.value) {
      const chart2 = echarts.init(memoryChart.value);
      chart2.setOption({
        tooltip: {
          trigger: 'axis',
        },
        xAxis: {
          type: 'category',
          data: Array.from({ length: 20 }, (_, i) => `${i + 1}分钟前`),
        },
        yAxis: {
          type: 'value',
          max: 100,
          axisLabel: {
            formatter: '{value}%',
          },
        },
        series: [
          {
            name: '内存使用率',
            type: 'line',
            smooth: true,
            data: Array.from({ length: 20 }, () => Math.floor(Math.random() * 20) + 60),
            itemStyle: { color: '#52c41a' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
                  { offset: 1, color: 'rgba(82, 196, 26, 0.1)' },
                ],
              },
            },
          },
        ],
      });
    }

    // 网络流量图表
    if (networkChart.value) {
      const chart3 = echarts.init(networkChart.value);
      chart3.setOption({
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['入站流量', '出站流量'],
        },
        xAxis: {
          type: 'category',
          data: Array.from({ length: 20 }, (_, i) => `${i + 1}分钟前`),
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value} KB/s',
          },
        },
        series: [
          {
            name: '入站流量',
            type: 'line',
            smooth: true,
            data: Array.from({ length: 20 }, () => Math.floor(Math.random() * 100) + 50),
            itemStyle: { color: '#722ed1' },
          },
          {
            name: '出站流量',
            type: 'line',
            smooth: true,
            data: Array.from({ length: 20 }, () => Math.floor(Math.random() * 80) + 30),
            itemStyle: { color: '#fa8c16' },
          },
        ],
      });
    }

    // API请求统计图表
    if (apiChart.value) {
      const chart4 = echarts.init(apiChart.value);
      chart4.setOption({
        tooltip: {
          trigger: 'axis',
        },
        xAxis: {
          type: 'category',
          data: Array.from({ length: 20 }, (_, i) => `${i + 1}分钟前`),
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value} req/min',
          },
        },
        series: [
          {
            name: 'API请求数',
            type: 'bar',
            data: Array.from({ length: 20 }, () => Math.floor(Math.random() * 200) + 100),
            itemStyle: { color: '#13c2c2' },
          },
        ],
      });
    }
  });
};

const updateCharts = () => {
  // 更新图表数据的逻辑
  initCharts();
};

// 生命周期
onMounted(() => {
  initCharts();
  if (autoRefresh.value) {
    refreshInterval.value = setInterval(refreshData, 5000);
  }
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<style scoped>
.guardian-monitor {
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

.status-overview {
  margin-bottom: 24px;
}

.status-card {
  height: 100%;
}

.status-item {
  display: flex;
  align-items: center;
}

.status-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
}

.status-icon.success {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-icon.warning {
  background-color: #fff7e6;
  color: #fa8c16;
}

.status-icon.info {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-content {
  flex: 1;
}

.status-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.status-value {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.status-time {
  font-size: 12px;
  color: #999;
}

.charts-section {
  margin-bottom: 24px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.services-section {
  margin-bottom: 24px;
}

.logs-section {
  margin-bottom: 24px;
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
}

.log-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e8e8e8;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  width: 100px;
  color: #666;
  margin-right: 12px;
}

.log-level {
  width: 60px;
  margin-right: 12px;
  font-weight: 600;
}

.log-message {
  flex: 1;
}

.log-error .log-level {
  color: #f5222d;
}

.log-warn .log-level {
  color: #fa8c16;
}

.log-info .log-level {
  color: #1890ff;
}

.log-debug .log-level {
  color: #666;
}

.service-logs {
  max-height: 500px;
  overflow-y: auto;
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .guardian-monitor {
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
  
  .status-item {
    flex-direction: column;
    text-align: center;
  }
  
  .status-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }
}
</style>