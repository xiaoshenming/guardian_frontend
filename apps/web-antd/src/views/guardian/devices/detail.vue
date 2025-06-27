<template>
  <div class="device-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <a-button @click="$router.back()" class="back-btn">
            <template #icon><ArrowLeftOutlined /></template>
            返回
          </a-button>
          <div class="device-title">
            <h1>{{ device?.name || '设备详情' }}</h1>
            <div class="device-meta">
              <a-tag :color="getStatusColor(device?.status)">
                <template #icon>
                  <component :is="getStatusIcon(device?.status)" />
                </template>
                {{ getStatusText(device?.status) }}
              </a-tag>
              <span class="device-sn">{{ device?.sn }}</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <a-space>
            <a-button @click="refreshDevice">
              <template #icon><ReloadOutlined /></template>
              刷新
            </a-button>
            <a-button type="primary" @click="configDevice">
              <template #icon><SettingOutlined /></template>
              配置
            </a-button>
            <a-dropdown>
              <a-button>
                更多 <DownOutlined />
              </a-button>
              <template #overlay>
                <a-menu @click="handleDeviceAction">
                  <a-menu-item key="reboot">
                    <ReloadOutlined />
                    重启设备
                  </a-menu-item>
                  <a-menu-item key="update">
                    <UploadOutlined />
                    更新固件
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="unbind" danger>
                    <DisconnectOutlined />
                    解绑设备
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 设备概览 -->
    <div class="device-overview">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :lg="8">
          <a-card title="设备信息" :bordered="false">
            <div class="device-info">
              <div class="device-avatar">
                <a-avatar :style="getDeviceAvatarStyle(device?.type)" :size="80" shape="square">
                  <component :is="getDeviceIcon(device?.type)" style="font-size: 32px" />
                </a-avatar>
              </div>
              <div class="device-details">
                <div class="detail-item">
                  <span class="label">设备名称：</span>
                  <span class="value">{{ device?.name }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">设备型号：</span>
                  <span class="value">{{ device?.model }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">序列号：</span>
                  <span class="value">{{ device?.sn }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">固件版本：</span>
                  <span class="value">{{ device?.firmwareVersion }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">绑定时间：</span>
                  <span class="value">{{ formatTime(device?.createdAt) }}</span>
                </div>
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="8">
          <a-card title="实时状态" :bordered="false">
            <div class="status-grid">
              <div class="status-item">
                <div class="status-icon battery">
                  <BatteryChargeOutlined />
                </div>
                <div class="status-content">
                  <div class="status-label">电池电量</div>
                  <div class="status-value">{{ device?.batteryLevel }}%</div>
                  <a-progress
                    :percent="device?.batteryLevel"
                    :status="getBatteryStatus(device?.batteryLevel)"
                    size="small"
                    :show-info="false"
                  />
                </div>
              </div>
              <div class="status-item">
                <div class="status-icon signal">
                  <SignalFilled />
                </div>
                <div class="status-content">
                  <div class="status-label">信号强度</div>
                  <div class="status-value">{{ device?.signalStrength }}%</div>
                  <a-progress
                    :percent="device?.signalStrength"
                    size="small"
                    :show-info="false"
                    stroke-color="#52c41a"
                  />
                </div>
              </div>
              <div class="status-item">
                <div class="status-icon location">
                  <EnvironmentOutlined />
                </div>
                <div class="status-content">
                  <div class="status-label">位置信息</div>
                  <div class="status-value">{{ device?.location || '未知' }}</div>
                  <div class="status-time">{{ formatTime(device?.lastLocationUpdate) }}</div>
                </div>
              </div>
              <div class="status-item">
                <div class="status-icon heartbeat">
                  <HeartOutlined />
                </div>
                <div class="status-content">
                  <div class="status-label">最后心跳</div>
                  <div class="status-value">{{ getHeartbeatStatus(device?.lastHeartbeat) }}</div>
                  <div class="status-time">{{ formatTime(device?.lastHeartbeat) }}</div>
                </div>
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="8">
          <a-card title="关联信息" :bordered="false">
            <div class="relation-info">
              <div class="relation-item">
                <div class="relation-label">所属守护圈</div>
                <div class="relation-value">
                  <a-tag v-if="device?.circleName" color="blue" @click="goToCircle">
                    {{ device.circleName }}
                  </a-tag>
                  <span v-else class="text-gray-500">未分配</span>
                </div>
              </div>
              <div class="relation-item">
                <div class="relation-label">绑定用户</div>
                <div class="relation-value">
                  <div v-if="device?.boundUserName" class="user-info">
                    <a-avatar :src="device.boundUserAvatar" size="small">
                      {{ device.boundUserName?.charAt(0)?.toUpperCase() }}
                    </a-avatar>
                    <span class="user-name">{{ device.boundUserName }}</span>
                  </div>
                  <span v-else class="text-gray-500">未绑定</span>
                </div>
              </div>
              <div class="relation-item">
                <div class="relation-label">紧急联系人</div>
                <div class="relation-value">
                  <div v-if="device?.config?.emergencyContacts?.length" class="contacts-list">
                    <a-tag
                      v-for="contact in device.config.emergencyContacts"
                      :key="contact"
                      color="orange"
                    >
                      {{ getContactName(contact) }}
                    </a-tag>
                  </div>
                  <span v-else class="text-gray-500">未设置</span>
                </div>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 详细信息标签页 -->
    <div class="device-tabs">
      <a-card :bordered="false">
        <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
          <!-- 实时数据 -->
          <a-tab-pane key="realtime" tab="实时数据">
            <div class="realtime-data">
              <a-row :gutter="[16, 16]">
                <a-col :xs="24" :lg="12">
                  <a-card title="传感器数据" size="small">
                    <div class="sensor-data">
                      <div class="sensor-item">
                        <span class="sensor-label">心率：</span>
                        <span class="sensor-value">{{ realtimeData.heartRate || '--' }} bpm</span>
                      </div>
                      <div class="sensor-item">
                        <span class="sensor-label">血氧：</span>
                        <span class="sensor-value">{{ realtimeData.bloodOxygen || '--' }}%</span>
                      </div>
                      <div class="sensor-item">
                        <span class="sensor-label">体温：</span>
                        <span class="sensor-value">{{ realtimeData.temperature || '--' }}°C</span>
                      </div>
                      <div class="sensor-item">
                        <span class="sensor-label">步数：</span>
                        <span class="sensor-value">{{ realtimeData.steps || '--' }} 步</span>
                      </div>
                      <div class="sensor-item">
                        <span class="sensor-label">加速度：</span>
                        <span class="sensor-value">
                          X: {{ realtimeData.accelerometer?.x || '--' }}<br>
                          Y: {{ realtimeData.accelerometer?.y || '--' }}<br>
                          Z: {{ realtimeData.accelerometer?.z || '--' }}
                        </span>
                      </div>
                    </div>
                  </a-card>
                </a-col>
                <a-col :xs="24" :lg="12">
                  <a-card title="环境数据" size="small">
                    <div class="env-data">
                      <div class="env-item">
                        <span class="env-label">环境温度：</span>
                        <span class="env-value">{{ realtimeData.ambientTemp || '--' }}°C</span>
                      </div>
                      <div class="env-item">
                        <span class="env-label">湿度：</span>
                        <span class="env-value">{{ realtimeData.humidity || '--' }}%</span>
                      </div>
                      <div class="env-item">
                        <span class="env-label">气压：</span>
                        <span class="env-value">{{ realtimeData.pressure || '--' }} hPa</span>
                      </div>
                      <div class="env-item">
                        <span class="env-label">光照强度：</span>
                        <span class="env-value">{{ realtimeData.lightIntensity || '--' }} lux</span>
                      </div>
                    </div>
                  </a-card>
                </a-col>
              </a-row>
              <div class="data-chart" style="margin-top: 16px;">
                <a-card title="数据趋势" size="small">
                  <div ref="chartRef" style="height: 300px;"></div>
                </a-card>
              </div>
            </div>
          </a-tab-pane>

          <!-- 事件记录 -->
          <a-tab-pane key="events" tab="事件记录">
            <div class="events-section">
              <div class="events-filter">
                <a-row :gutter="[16, 16]">
                  <a-col :xs="24" :sm="8">
                    <a-select
                      v-model:value="eventTypeFilter"
                      placeholder="事件类型"
                      style="width: 100%"
                      allow-clear
                    >
                      <a-select-option value="fall">跌倒检测</a-select-option>
                      <a-select-option value="sos">SOS求救</a-select-option>
                      <a-select-option value="low_battery">低电量</a-select-option>
                      <a-select-option value="offline">设备离线</a-select-option>
                      <a-select-option value="fence">电子围栏</a-select-option>
                    </a-select>
                  </a-col>
                  <a-col :xs="24" :sm="8">
                    <a-range-picker
                      v-model:value="eventDateRange"
                      style="width: 100%"
                      :placeholder="['开始日期', '结束日期']"
                    />
                  </a-col>
                  <a-col :xs="24" :sm="8">
                    <a-space>
                      <a-button @click="resetEventFilter">重置</a-button>
                      <a-button type="primary" @click="fetchDeviceEvents">查询</a-button>
                    </a-space>
                  </a-col>
                </a-row>
              </div>
              <a-table
                :columns="eventColumns"
                :data-source="deviceEvents"
                :loading="eventsLoading"
                :pagination="eventPagination"
                row-key="id"
                @change="handleEventTableChange"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'type'">
                    <a-tag :color="getEventTypeColor(record.type)">
                      <template #icon>
                        <component :is="getEventTypeIcon(record.type)" />
                      </template>
                      {{ getEventTypeText(record.type) }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'severity'">
                    <a-tag :color="getSeverityColor(record.severity)">
                      {{ getSeverityText(record.severity) }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <a-button type="link" size="small" @click="viewEventDetail(record)">
                      查看详情
                    </a-button>
                  </template>
                </template>
              </a-table>
            </div>
          </a-tab-pane>

          <!-- 设备日志 -->
          <a-tab-pane key="logs" tab="设备日志">
            <div class="logs-section">
              <div class="logs-filter">
                <a-row :gutter="[16, 16]">
                  <a-col :xs="24" :sm="8">
                    <a-select
                      v-model:value="logLevelFilter"
                      placeholder="日志级别"
                      style="width: 100%"
                      allow-clear
                    >
                      <a-select-option value="debug">DEBUG</a-select-option>
                      <a-select-option value="info">INFO</a-select-option>
                      <a-select-option value="warn">WARN</a-select-option>
                      <a-select-option value="error">ERROR</a-select-option>
                    </a-select>
                  </a-col>
                  <a-col :xs="24" :sm="8">
                    <a-range-picker
                      v-model:value="logDateRange"
                      style="width: 100%"
                      :placeholder="['开始日期', '结束日期']"
                    />
                  </a-col>
                  <a-col :xs="24" :sm="8">
                    <a-space>
                      <a-button @click="resetLogFilter">重置</a-button>
                      <a-button type="primary" @click="fetchDeviceLogs">查询</a-button>
                      <a-button @click="downloadLogs">
                        <template #icon><DownloadOutlined /></template>
                        下载
                      </a-button>
                    </a-space>
                  </a-col>
                </a-row>
              </div>
              <div class="logs-content">
                <a-card size="small">
                  <div class="log-viewer">
                    <div
                      v-for="log in deviceLogs"
                      :key="log.id"
                      :class="['log-line', `log-${log.level}`]"
                    >
                      <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                      <span class="log-level">[{{ log.level.toUpperCase() }}]</span>
                      <span class="log-message">{{ log.message }}</span>
                    </div>
                    <div v-if="!deviceLogs.length" class="log-empty">
                      <a-empty description="暂无日志数据" />
                    </div>
                  </div>
                </a-card>
              </div>
            </div>
          </a-tab-pane>

          <!-- 设备配置 -->
          <a-tab-pane key="config" tab="设备配置">
            <div class="config-section">
              <a-form
                ref="configFormRef"
                :model="configForm"
                layout="vertical"
              >
                <a-row :gutter="[24, 16]">
                  <a-col :xs="24" :lg="12">
                    <a-card title="基础配置" size="small">
                      <a-form-item label="心跳间隔（秒）">
                        <a-input-number
                          v-model:value="configForm.heartbeatInterval"
                          :min="10"
                          :max="300"
                          style="width: 100%"
                        />
                      </a-form-item>
                      <a-form-item label="数据上报间隔（秒）">
                        <a-input-number
                          v-model:value="configForm.reportInterval"
                          :min="5"
                          :max="60"
                          style="width: 100%"
                        />
                      </a-form-item>
                      <a-form-item label="跌倒检测灵敏度">
                        <a-select v-model:value="configForm.fallSensitivity" style="width: 100%">
                          <a-select-option value="low">低</a-select-option>
                          <a-select-option value="medium">中</a-select-option>
                          <a-select-option value="high">高</a-select-option>
                        </a-select>
                      </a-form-item>
                      <a-form-item label="手势识别">
                        <a-switch v-model:checked="configForm.gestureEnabled" />
                      </a-form-item>
                    </a-card>
                  </a-col>
                  <a-col :xs="24" :lg="12">
                    <a-card title="告警配置" size="small">
                      <a-form-item label="紧急联系人">
                        <a-select
                          v-model:value="configForm.emergencyContacts"
                          mode="multiple"
                          placeholder="选择紧急联系人"
                          style="width: 100%"
                        >
                          <a-select-option
                            v-for="user in circleMembers"
                            :key="user.id"
                            :value="user.id"
                          >
                            {{ user.username }} ({{ user.email }})
                          </a-select-option>
                        </a-select>
                      </a-form-item>
                      <a-form-item label="低电量阈值（%）">
                        <a-input-number
                          v-model:value="configForm.lowBatteryThreshold"
                          :min="5"
                          :max="30"
                          style="width: 100%"
                        />
                      </a-form-item>
                      <a-form-item label="离线超时（分钟）">
                        <a-input-number
                          v-model:value="configForm.offlineTimeout"
                          :min="1"
                          :max="60"
                          style="width: 100%"
                        />
                      </a-form-item>
                    </a-card>
                  </a-col>
                </a-row>
                <div class="config-actions">
                  <a-space>
                    <a-button @click="resetConfig">重置</a-button>
                    <a-button type="primary" :loading="configLoading" @click="saveConfig">
                      保存配置
                    </a-button>
                  </a-space>
                </div>
              </a-form>
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import * as echarts from 'echarts';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  SettingOutlined,
  DownOutlined,
  UploadOutlined,
  DisconnectOutlined,
  BatteryChargeOutlined,
  SignalFilled,
  EnvironmentOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  MobileOutlined,
  DownloadOutlined,
  FallOutlined,
  AlertOutlined,
  WifiOutlined,
} from '@ant-design/icons-vue';
import {
  getDeviceDetail,
  updateDeviceConfig,
  rebootDevice,
  unbindDevice,
  getDeviceEvents,
  getDeviceLogs,
  getCircleMembers,
  type Device,
  type DeviceEvent,
  type CircleMember,
  type UpdateDeviceConfigParams,
} from '#/api/guardian';

const route = useRoute();
const router = useRouter();

// 响应式数据
const device = ref<Device>();
const loading = ref(false);
const activeTab = ref('realtime');
const chartRef = ref();
let chartInstance: echarts.ECharts | null = null;

// 实时数据
const realtimeData = ref({
  heartRate: 72,
  bloodOxygen: 98,
  temperature: 36.5,
  steps: 8520,
  accelerometer: { x: 0.1, y: 0.2, z: 9.8 },
  ambientTemp: 25,
  humidity: 60,
  pressure: 1013,
  lightIntensity: 300,
});

// 事件记录
const deviceEvents = ref<DeviceEvent[]>([]);
const eventsLoading = ref(false);
const eventTypeFilter = ref<string>();
const eventDateRange = ref();
const eventPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 设备日志
const deviceLogs = ref<any[]>([]);
const logsLoading = ref(false);
const logLevelFilter = ref<string>();
const logDateRange = ref();

// 设备配置
const configLoading = ref(false);
const configFormRef = ref();
const circleMembers = ref<CircleMember[]>([]);
const configForm = reactive<UpdateDeviceConfigParams>({
  heartbeatInterval: 60,
  reportInterval: 30,
  fallSensitivity: 'medium',
  gestureEnabled: true,
  emergencyContacts: [],
  lowBatteryThreshold: 20,
  offlineTimeout: 5,
});

// 事件表格列
const eventColumns = [
  {
    title: '事件类型',
    key: 'type',
    width: 120,
  },
  {
    title: '严重程度',
    key: 'severity',
    width: 100,
  },
  {
    title: '事件描述',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: '发生时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 180,
    customRender: ({ text }: any) => formatTime(text),
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
  },
];

// 获取设备详情
const fetchDeviceDetail = async () => {
  const deviceId = route.params.id as string;
  if (!deviceId) return;

  loading.value = true;
  try {
    const response = await getDeviceDetail(deviceId);
    device.value = response.data;
    
    // 加载配置
    if (device.value.config) {
      Object.assign(configForm, device.value.config);
    }
    
    // 加载守护圈成员
    if (device.value.circleId) {
      await fetchCircleMembers(device.value.circleId);
    }
  } catch (error) {
    console.error('获取设备详情失败:', error);
    message.error('获取设备详情失败');
  } finally {
    loading.value = false;
  }
};

// 获取守护圈成员
const fetchCircleMembers = async (circleId: string) => {
  try {
    const response = await getCircleMembers(circleId);
    circleMembers.value = response.data;
  } catch (error) {
    console.error('获取守护圈成员失败:', error);
  }
};

// 获取设备事件
const fetchDeviceEvents = async () => {
  const deviceId = route.params.id as string;
  if (!deviceId) return;

  eventsLoading.value = true;
  try {
    const params = {
      deviceId,
      page: eventPagination.current,
      pageSize: eventPagination.pageSize,
      type: eventTypeFilter.value,
      startDate: eventDateRange.value?.[0]?.format('YYYY-MM-DD'),
      endDate: eventDateRange.value?.[1]?.format('YYYY-MM-DD'),
    };
    const response = await getDeviceEvents(params);
    deviceEvents.value = response.data.list;
    eventPagination.total = response.data.total;
  } catch (error) {
    console.error('获取设备事件失败:', error);
    message.error('获取设备事件失败');
  } finally {
    eventsLoading.value = false;
  }
};

// 获取设备日志
const fetchDeviceLogs = async () => {
  const deviceId = route.params.id as string;
  if (!deviceId) return;

  logsLoading.value = true;
  try {
    const params = {
      deviceId,
      level: logLevelFilter.value,
      startDate: logDateRange.value?.[0]?.format('YYYY-MM-DD'),
      endDate: logDateRange.value?.[1]?.format('YYYY-MM-DD'),
    };
    const response = await getDeviceLogs(params);
    deviceLogs.value = response.data;
  } catch (error) {
    console.error('获取设备日志失败:', error);
    message.error('获取设备日志失败');
  } finally {
    logsLoading.value = false;
  }
};

// 刷新设备
const refreshDevice = () => {
  fetchDeviceDetail();
  if (activeTab.value === 'events') {
    fetchDeviceEvents();
  } else if (activeTab.value === 'logs') {
    fetchDeviceLogs();
  }
};

// 配置设备
const configDevice = () => {
  activeTab.value = 'config';
};

// 设备操作
const handleDeviceAction = async ({ key }: { key: string }) => {
  const deviceId = route.params.id as string;
  
  switch (key) {
    case 'reboot':
      Modal.confirm({
        title: '确认重启设备？',
        content: '重启设备可能会导致短暂的服务中断',
        onOk: async () => {
          try {
            await rebootDevice(deviceId);
            message.success('设备重启指令已发送');
          } catch (error) {
            message.error('设备重启失败');
          }
        },
      });
      break;
    case 'update':
      message.info('固件更新功能开发中');
      break;
    case 'unbind':
      Modal.confirm({
        title: '确认解绑设备？',
        content: '解绑后设备将无法继续提供服务',
        onOk: async () => {
          try {
            await unbindDevice(deviceId);
            message.success('解绑设备成功');
            router.push('/guardian/devices');
          } catch (error) {
            message.error('解绑设备失败');
          }
        },
      });
      break;
  }
};

// 标签页切换
const handleTabChange = (key: string) => {
  activeTab.value = key;
  
  if (key === 'events') {
    fetchDeviceEvents();
  } else if (key === 'logs') {
    fetchDeviceLogs();
  } else if (key === 'realtime') {
    nextTick(() => {
      initChart();
    });
  }
};

// 事件表格变化
const handleEventTableChange = (pag: any) => {
  eventPagination.current = pag.current;
  eventPagination.pageSize = pag.pageSize;
  fetchDeviceEvents();
};

// 重置事件筛选
const resetEventFilter = () => {
  eventTypeFilter.value = undefined;
  eventDateRange.value = undefined;
  eventPagination.current = 1;
  fetchDeviceEvents();
};

// 重置日志筛选
const resetLogFilter = () => {
  logLevelFilter.value = undefined;
  logDateRange.value = undefined;
  fetchDeviceLogs();
};

// 下载日志
const downloadLogs = () => {
  message.info('日志下载功能开发中');
};

// 查看事件详情
const viewEventDetail = (event: DeviceEvent) => {
  router.push(`/guardian/events/${event.id}`);
};

// 保存配置
const saveConfig = async () => {
  const deviceId = route.params.id as string;
  
  configLoading.value = true;
  try {
    await updateDeviceConfig(deviceId, configForm);
    message.success('保存设备配置成功');
    fetchDeviceDetail();
  } catch (error) {
    console.error('保存设备配置失败:', error);
    message.error('保存设备配置失败');
  } finally {
    configLoading.value = false;
  }
};

// 重置配置
const resetConfig = () => {
  if (device.value?.config) {
    Object.assign(configForm, device.value.config);
  }
};

// 跳转到守护圈
const goToCircle = () => {
  if (device.value?.circleId) {
    router.push(`/guardian/circles/${device.value.circleId}`);
  }
};

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  
  chartInstance = echarts.init(chartRef.value);
  
  const option = {
    title: {
      text: '传感器数据趋势',
      left: 'center',
      textStyle: {
        fontSize: 14,
      },
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['心率', '血氧', '体温'],
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    },
    yAxis: [
      {
        type: 'value',
        name: '心率/血氧',
        position: 'left',
      },
      {
        type: 'value',
        name: '体温',
        position: 'right',
      },
    ],
    series: [
      {
        name: '心率',
        type: 'line',
        data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 20) + 60),
        smooth: true,
      },
      {
        name: '血氧',
        type: 'line',
        data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 5) + 95),
        smooth: true,
      },
      {
        name: '体温',
        type: 'line',
        yAxisIndex: 1,
        data: Array.from({ length: 24 }, () => (Math.random() * 2 + 35.5).toFixed(1)),
        smooth: true,
      },
    ],
  };
  
  chartInstance.setOption(option);
};

// 工具函数
const getDeviceIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    smartwatch: MobileOutlined,
    pendant: BatteryChargeOutlined,
    bracelet: SignalFilled,
  };
  return iconMap[type] || MobileOutlined;
};

const getDeviceAvatarStyle = (type: string) => {
  const colorMap: Record<string, string> = {
    smartwatch: '#1890ff',
    pendant: '#52c41a',
    bracelet: '#faad14',
  };
  return { backgroundColor: colorMap[type] || '#1890ff' };
};

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    online: 'green',
    offline: 'red',
    fault: 'orange',
  };
  return colorMap[status] || 'blue';
};

const getStatusIcon = (status: string) => {
  const iconMap: Record<string, any> = {
    online: CheckCircleOutlined,
    offline: CloseCircleOutlined,
    fault: ExclamationCircleOutlined,
  };
  return iconMap[status] || CheckCircleOutlined;
};

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    online: '在线',
    offline: '离线',
    fault: '故障',
  };
  return textMap[status] || status;
};

const getBatteryStatus = (level: number) => {
  if (level < 20) return 'exception';
  if (level < 50) return 'normal';
  return 'success';
};

const getHeartbeatStatus = (lastHeartbeat: string) => {
  if (!lastHeartbeat) return '未知';
  const diff = Date.now() - new Date(lastHeartbeat).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 5) return '正常';
  if (minutes < 30) return '延迟';
  return '异常';
};

const getEventTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    fall: 'red',
    sos: 'red',
    low_battery: 'orange',
    offline: 'red',
    fence: 'blue',
  };
  return colorMap[type] || 'blue';
};

const getEventTypeIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    fall: FallOutlined,
    sos: AlertOutlined,
    low_battery: BatteryChargeOutlined,
    offline: WifiOutlined,
    fence: EnvironmentOutlined,
  };
  return iconMap[type] || AlertOutlined;
};

const getEventTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    fall: '跌倒检测',
    sos: 'SOS求救',
    low_battery: '低电量',
    offline: '设备离线',
    fence: '电子围栏',
  };
  return textMap[type] || type;
};

const getSeverityColor = (severity: string) => {
  const colorMap: Record<string, string> = {
    low: 'blue',
    medium: 'orange',
    high: 'red',
    critical: 'red',
  };
  return colorMap[severity] || 'blue';
};

const getSeverityText = (severity: string) => {
  const textMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '紧急',
  };
  return textMap[severity] || severity;
};

const getContactName = (contactId: string) => {
  const contact = circleMembers.value.find(m => m.id === contactId);
  return contact?.username || contactId;
};

const formatTime = (time: string) => {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
};

// 生命周期
onMounted(async () => {
  await fetchDeviceDetail();
  
  // 默认加载实时数据
  nextTick(() => {
    initChart();
  });
});
</script>

<style scoped lang="less">
.device-detail {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;

  .page-header {
    margin-bottom: 24px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      @media (max-width: 768px) {
        flex-direction: column;
        gap: 16px;
      }
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .back-btn {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .device-title {
        h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: #262626;
        }

        .device-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;

          .device-sn {
            color: #8c8c8c;
            font-size: 14px;
          }
        }
      }
    }
  }

  .device-overview {
    margin-bottom: 24px;

    .device-info {
      display: flex;
      gap: 16px;

      .device-avatar {
        flex-shrink: 0;
      }

      .device-details {
        flex: 1;

        .detail-item {
          display: flex;
          margin-bottom: 8px;

          .label {
            width: 80px;
            color: #8c8c8c;
            font-size: 14px;
          }

          .value {
            color: #262626;
            font-size: 14px;
          }
        }
      }
    }

    .status-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;

      .status-item {
        display: flex;
        align-items: center;
        gap: 12px;

        .status-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: white;

          &.battery {
            background: #52c41a;
          }

          &.signal {
            background: #1890ff;
          }

          &.location {
            background: #faad14;
          }

          &.heartbeat {
            background: #f5222d;
          }
        }

        .status-content {
          flex: 1;

          .status-label {
            font-size: 12px;
            color: #8c8c8c;
            margin-bottom: 4px;
          }

          .status-value {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 4px;
          }

          .status-time {
            font-size: 12px;
            color: #8c8c8c;
          }
        }
      }
    }

    .relation-info {
      .relation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .relation-label {
          color: #8c8c8c;
          font-size: 14px;
        }

        .relation-value {
          .user-info {
            display: flex;
            align-items: center;
            gap: 8px;

            .user-name {
              font-size: 14px;
            }
          }

          .contacts-list {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          }
        }
      }
    }
  }

  .device-tabs {
    .realtime-data {
      .sensor-data,
      .env-data {
        .sensor-item,
        .env-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .sensor-label,
          .env-label {
            color: #8c8c8c;
            font-size: 14px;
          }

          .sensor-value,
          .env-value {
            font-weight: 500;
            font-size: 14px;
          }
        }
      }
    }

    .events-section {
      .events-filter {
        margin-bottom: 16px;
      }
    }

    .logs-section {
      .logs-filter {
        margin-bottom: 16px;
      }

      .log-viewer {
        max-height: 400px;
        overflow-y: auto;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.5;

        .log-line {
          display: flex;
          gap: 8px;
          padding: 4px 0;
          border-bottom: 1px solid #f0f0f0;

          .log-time {
            color: #8c8c8c;
            min-width: 150px;
          }

          .log-level {
            min-width: 60px;
            font-weight: bold;
          }

          .log-message {
            flex: 1;
          }

          &.log-debug {
            .log-level {
              color: #8c8c8c;
            }
          }

          &.log-info {
            .log-level {
              color: #1890ff;
            }
          }

          &.log-warn {
            .log-level {
              color: #faad14;
            }
          }

          &.log-error {
            .log-level {
              color: #f5222d;
            }
          }
        }

        .log-empty {
          text-align: center;
          padding: 40px 0;
        }
      }
    }

    .config-section {
      .config-actions {
        margin-top: 24px;
        text-align: center;
      }
    }
  }
}

:deep(.ant-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.text-gray-500 {
  color: #8c8c8c;
}
</style>