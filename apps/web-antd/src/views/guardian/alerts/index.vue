<template>
  <div class="guardian-alerts">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>告警管理</h1>
          <p>实时监控告警信息，快速响应紧急情况</p>
        </div>
        <div class="header-actions">
          <a-space>
            <a-badge :count="unreadCount" :offset="[10, 0]">
              <a-button @click="refreshAlerts">
                <template #icon><ReloadOutlined /></template>
                刷新
              </a-button>
            </a-badge>
            <a-button @click="markAllRead" :disabled="!unreadCount">
              <template #icon><CheckOutlined /></template>
              全部标记已读
            </a-button>
            <a-button @click="showSettings = true">
              <template #icon><SettingOutlined /></template>
              告警设置
            </a-button>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 告警统计 -->
    <div class="stats-section">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="6">
          <a-card :bordered="false" class="stat-card critical">
            <a-statistic
              title="紧急告警"
              :value="alertStats.critical"
              :value-style="{ color: '#f5222d' }"
            >
              <template #prefix><AlertOutlined /></template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="6">
          <a-card :bordered="false" class="stat-card high">
            <a-statistic
              title="高级告警"
              :value="alertStats.high"
              :value-style="{ color: '#ff7a45' }"
            >
              <template #prefix><WarningOutlined /></template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="6">
          <a-card :bordered="false" class="stat-card medium">
            <a-statistic
              title="中级告警"
              :value="alertStats.medium"
              :value-style="{ color: '#faad14' }"
            >
              <template #prefix><ExclamationCircleOutlined /></template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="6">
          <a-card :bordered="false" class="stat-card low">
            <a-statistic
              title="低级告警"
              :value="alertStats.low"
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix><InfoCircleOutlined /></template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 实时告警流 -->
    <div class="realtime-section" v-if="realtimeAlerts.length">
      <a-card :bordered="false" class="realtime-card">
        <template #title>
          <div class="realtime-title">
            <span class="title-text">
              <BellOutlined class="bell-icon" />
              实时告警
            </span>
            <a-tag color="red" class="live-tag">
              <span class="live-dot"></span>
              LIVE
            </a-tag>
          </div>
        </template>
        <div class="realtime-alerts">
          <div
            v-for="alert in realtimeAlerts"
            :key="alert.id"
            :class="['realtime-alert', `severity-${alert.severity}`]"
            @click="viewAlert(alert)"
          >
            <div class="alert-icon">
              <component :is="getAlertIcon(alert.type)" />
            </div>
            <div class="alert-content">
              <div class="alert-title">{{ getAlertTypeText(alert.type) }}</div>
              <div class="alert-description">{{ alert.description }}</div>
              <div class="alert-meta">
                <span class="device-name">
                  <MobileOutlined />
                  {{ alert.deviceName }}
                </span>
                <span class="alert-time">{{ getTimeAgo(alert.timestamp) }}</span>
              </div>
            </div>
            <div class="alert-actions">
              <a-button
                type="primary"
                size="small"
                :danger="alert.severity === 'critical'"
                @click.stop="quickConfirm(alert)"
              >
                确认
              </a-button>
            </div>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <a-card :bordered="false">
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :sm="12" :md="6">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索告警内容或设备"
              allow-clear
              @search="handleSearch"
            />
          </a-col>
          <a-col :xs="24" :sm="12" :md="4">
            <a-select
              v-model:value="typeFilter"
              placeholder="告警类型"
              style="width: 100%"
              allow-clear
            >
              <a-select-option value="fall">跌倒告警</a-select-option>
              <a-select-option value="sos">SOS告警</a-select-option>
              <a-select-option value="low_battery">低电量</a-select-option>
              <a-select-option value="offline">设备离线</a-select-option>
              <a-select-option value="fence">围栏告警</a-select-option>
              <a-select-option value="health">健康告警</a-select-option>
            </a-select>
          </a-col>
          <a-col :xs="24" :sm="12" :md="4">
            <a-select
              v-model:value="severityFilter"
              placeholder="严重程度"
              style="width: 100%"
              allow-clear
            >
              <a-select-option value="critical">紧急</a-select-option>
              <a-select-option value="high">高</a-select-option>
              <a-select-option value="medium">中</a-select-option>
              <a-select-option value="low">低</a-select-option>
            </a-select>
          </a-col>
          <a-col :xs="24" :sm="12" :md="4">
            <a-select
              v-model:value="statusFilter"
              placeholder="处理状态"
              style="width: 100%"
              allow-clear
            >
              <a-select-option value="pending">待处理</a-select-option>
              <a-select-option value="confirmed">已确认</a-select-option>
              <a-select-option value="resolved">已解决</a-select-option>
              <a-select-option value="ignored">已忽略</a-select-option>
            </a-select>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-range-picker
              v-model:value="dateRange"
              style="width: 100%"
              :placeholder="['开始日期', '结束日期']"
            />
          </a-col>
        </a-row>
        <div class="search-actions" style="margin-top: 16px;">
          <a-space>
            <a-button @click="handleReset">重置</a-button>
            <a-button type="primary" @click="fetchAlerts">搜索</a-button>
          </a-space>
        </div>
      </a-card>
    </div>

    <!-- 告警列表 -->
    <div class="alerts-section">
      <a-card :bordered="false">
        <div class="table-header">
          <div class="table-title">
            <h3>告警列表</h3>
            <span class="alert-count">共 {{ pagination.total }} 条告警</span>
          </div>
          <div class="table-actions">
            <a-space>
              <a-button
                :disabled="!selectedRowKeys.length"
                @click="batchConfirm"
              >
                批量确认
              </a-button>
              <a-button
                :disabled="!selectedRowKeys.length"
                @click="batchIgnore"
              >
                批量忽略
              </a-button>
            </a-space>
          </div>
        </div>
        
        <a-table
          :columns="alertColumns"
          :data-source="alerts"
          :loading="loading"
          :pagination="pagination"
          :row-selection="rowSelection"
          :row-class-name="getRowClassName"
          row-key="id"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'alert'">
              <div class="alert-info">
                <div class="alert-indicator">
                  <div :class="['severity-dot', `severity-${record.severity}`]"></div>
                  <div class="alert-icon">
                    <component :is="getAlertIcon(record.type)" />
                  </div>
                </div>
                <div class="alert-details">
                  <div class="alert-title">
                    {{ getAlertTypeText(record.type) }}
                    <a-tag v-if="!record.isRead" color="red" size="small">NEW</a-tag>
                  </div>
                  <div class="alert-description">{{ record.description }}</div>
                  <div class="alert-device">
                    <MobileOutlined />
                    {{ record.deviceName }}
                    <span class="device-sn">({{ record.deviceSn }})</span>
                  </div>
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'severity'">
              <a-tag :color="getSeverityColor(record.severity)">
                <template #icon>
                  <component :is="getSeverityIcon(record.severity)" />
                </template>
                {{ getSeverityText(record.severity) }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ getStatusText(record.status) }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'location'">
              <div class="location-info">
                <EnvironmentOutlined />
                <span>{{ record.location || '未知位置' }}</span>
              </div>
            </template>
            <template v-else-if="column.key === 'circle'">
              <a-tag v-if="record.circleName" color="blue" @click="goToCircle(record.circleId)">
                {{ record.circleName }}
              </a-tag>
              <span v-else class="text-gray-500">-</span>
            </template>
            <template v-else-if="column.key === 'timestamp'">
              <div class="time-info">
                <div class="time-value">{{ formatTime(record.timestamp) }}</div>
                <div class="time-ago">{{ getTimeAgo(record.timestamp) }}</div>
              </div>
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button type="link" size="small" @click="viewAlert(record)">
                  查看
                </a-button>
                <a-dropdown v-if="record.status === 'pending'">
                  <a-button type="link" size="small">
                    处理 <DownOutlined />
                  </a-button>
                  <template #overlay>
                    <a-menu @click="({ key }) => handleAlertAction(key, record)">
                      <a-menu-item key="confirm">
                        <CheckCircleOutlined />
                        确认告警
                      </a-menu-item>
                      <a-menu-item key="resolve">
                        <CheckOutlined />
                        标记解决
                      </a-menu-item>
                      <a-menu-item key="ignore">
                        <MinusCircleOutlined />
                        忽略告警
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="notify">
                        <BellOutlined />
                        发送通知
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
                <span v-else class="text-gray-500">已处理</span>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 告警详情弹窗 -->
    <a-modal
      v-model:open="showAlertModal"
      :title="`告警详情 - ${currentAlert?.type ? getAlertTypeText(currentAlert.type) : ''}`"
      width="900px"
      :footer="null"
    >
      <div v-if="currentAlert" class="alert-detail">
        <a-row :gutter="[24, 16]">
          <a-col :span="16">
            <a-descriptions :column="1" bordered>
              <a-descriptions-item label="告警类型">
                <a-tag :color="getAlertTypeColor(currentAlert.type)">
                  <template #icon>
                    <component :is="getAlertIcon(currentAlert.type)" />
                  </template>
                  {{ getAlertTypeText(currentAlert.type) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="严重程度">
                <a-tag :color="getSeverityColor(currentAlert.severity)">
                  <template #icon>
                    <component :is="getSeverityIcon(currentAlert.severity)" />
                  </template>
                  {{ getSeverityText(currentAlert.severity) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="设备信息">
                <div class="device-info">
                  <MobileOutlined />
                  {{ currentAlert.deviceName }}
                  <span class="device-sn">({{ currentAlert.deviceSn }})</span>
                </div>
              </a-descriptions-item>
              <a-descriptions-item label="守护圈">
                <a-tag v-if="currentAlert.circleName" color="blue">
                  {{ currentAlert.circleName }}
                </a-tag>
                <span v-else>-</span>
              </a-descriptions-item>
              <a-descriptions-item label="发生时间">
                {{ formatTime(currentAlert.timestamp) }}
              </a-descriptions-item>
              <a-descriptions-item label="位置信息">
                <div class="location-detail">
                  <EnvironmentOutlined />
                  {{ currentAlert.location || '未知位置' }}
                </div>
              </a-descriptions-item>
              <a-descriptions-item label="告警描述">
                {{ currentAlert.description }}
              </a-descriptions-item>
              <a-descriptions-item label="详细数据" v-if="currentAlert.data">
                <pre class="alert-data">{{ JSON.stringify(currentAlert.data, null, 2) }}</pre>
              </a-descriptions-item>
            </a-descriptions>
          </a-col>
          <a-col :span="8">
            <a-card title="处理记录" size="small">
              <a-timeline>
                <a-timeline-item
                  v-for="record in currentAlert.processRecords"
                  :key="record.id"
                  :color="getProcessColor(record.action)"
                >
                  <template #dot>
                    <component :is="getProcessIcon(record.action)" />
                  </template>
                  <div class="process-record">
                    <div class="process-action">{{ getProcessText(record.action) }}</div>
                    <div class="process-user">{{ record.userName }}</div>
                    <div class="process-time">{{ formatTime(record.timestamp) }}</div>
                    <div v-if="record.remark" class="process-remark">{{ record.remark }}</div>
                  </div>
                </a-timeline-item>
                <a-timeline-item color="blue">
                  <template #dot>
                    <AlertOutlined />
                  </template>
                  <div class="process-record">
                    <div class="process-action">告警触发</div>
                    <div class="process-time">{{ formatTime(currentAlert.timestamp) }}</div>
                  </div>
                </a-timeline-item>
              </a-timeline>
            </a-card>
          </a-col>
        </a-row>
        
        <div class="alert-actions" style="margin-top: 24px; text-align: center;">
          <a-space v-if="currentAlert.status === 'pending'">
            <a-button type="primary" @click="confirmAlert(currentAlert)">
              <CheckCircleOutlined />
              确认告警
            </a-button>
            <a-button @click="resolveAlert(currentAlert)">
              <CheckOutlined />
              标记解决
            </a-button>
            <a-button @click="ignoreAlert(currentAlert)">
              <MinusCircleOutlined />
              忽略告警
            </a-button>
            <a-button @click="notifyContacts(currentAlert)">
              <BellOutlined />
              发送通知
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>

    <!-- 告警设置弹窗 -->
    <a-modal
      v-model:open="showSettings"
      title="告警设置"
      width="600px"
      :confirm-loading="settingsLoading"
      @ok="saveSettings"
    >
      <a-form
        ref="settingsFormRef"
        :model="settingsForm"
        layout="vertical"
      >
        <a-form-item label="告警通知方式">
          <a-checkbox-group v-model:value="settingsForm.notificationMethods">
            <a-checkbox value="email">邮件通知</a-checkbox>
            <a-checkbox value="sms">短信通知</a-checkbox>
            <a-checkbox value="push">推送通知</a-checkbox>
            <a-checkbox value="call">电话通知</a-checkbox>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item label="告警级别设置">
          <div class="severity-settings">
            <div v-for="severity in ['critical', 'high', 'medium', 'low']" :key="severity" class="severity-item">
              <span class="severity-label">{{ getSeverityText(severity) }}告警：</span>
              <a-switch v-model:checked="settingsForm.severityEnabled[severity]" />
            </div>
          </div>
        </a-form-item>
        <a-form-item label="免打扰时间">
          <a-time-range-picker
            v-model:value="settingsForm.quietHours"
            format="HH:mm"
            :placeholder="['开始时间', '结束时间']"
          />
        </a-form-item>
        <a-form-item label="告警频率限制">
          <a-input-number
            v-model:value="settingsForm.rateLimit"
            :min="1"
            :max="60"
            addon-after="分钟"
            placeholder="同类型告警间隔时间"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 批量处理弹窗 -->
    <a-modal
      v-model:open="showBatchModal"
      title="批量处理告警"
      :confirm-loading="batchLoading"
      @ok="handleBatchProcess"
    >
      <div class="batch-process">
        <p>您选择了 <strong>{{ selectedRowKeys.length }}</strong> 个告警，请选择处理方式：</p>
        <a-radio-group v-model:value="batchAction">
          <a-radio value="confirm">确认告警</a-radio>
          <a-radio value="resolve">标记解决</a-radio>
          <a-radio value="ignore">忽略告警</a-radio>
        </a-radio-group>
        <div style="margin-top: 16px;">
          <a-textarea
            v-model:value="batchRemark"
            placeholder="处理备注（可选）"
            :rows="3"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import {
  ReloadOutlined,
  CheckOutlined,
  SettingOutlined,
  AlertOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  BellOutlined,
  MobileOutlined,
  EnvironmentOutlined,
  DownOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
  FallOutlined,
  BatteryChargeOutlined,
  WifiOutlined,
  HeartOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons-vue';
import {
  getAlertList,
  confirmAlert as confirmAlertApi,
  resolveAlert as resolveAlertApi,
  ignoreAlert as ignoreAlertApi,
  batchProcessAlerts,
  getAlertStats,
  markAllAlertsRead,
  type Alert,
} from '#/api/guardian';

const router = useRouter();

// 响应式数据
const alerts = ref<Alert[]>([]);
const realtimeAlerts = ref<Alert[]>([]);
const loading = ref(false);
const searchKeyword = ref('');
const typeFilter = ref<string>();
const severityFilter = ref<string>();
const statusFilter = ref<string>();
const dateRange = ref();

// 告警统计
const alertStats = ref({
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
});

// 未读数量
const unreadCount = computed(() => {
  return alerts.value.filter(alert => !alert.isRead).length;
});

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) => 
    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
});

// 表格选择
const selectedRowKeys = ref<string[]>([]);
const rowSelection = {
  selectedRowKeys,
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys;
  },
};

// 告警详情
const showAlertModal = ref(false);
const currentAlert = ref<Alert>();

// 告警设置
const showSettings = ref(false);
const settingsLoading = ref(false);
const settingsFormRef = ref();
const settingsForm = reactive({
  notificationMethods: ['email', 'push'],
  severityEnabled: {
    critical: true,
    high: true,
    medium: true,
    low: false,
  },
  quietHours: [],
  rateLimit: 5,
});

// 批量处理
const showBatchModal = ref(false);
const batchLoading = ref(false);
const batchAction = ref('confirm');
const batchRemark = ref('');

// WebSocket 连接
let websocket: WebSocket | null = null;

// 表格列定义
const alertColumns = [
  {
    title: '告警信息',
    key: 'alert',
    width: 350,
  },
  {
    title: '严重程度',
    key: 'severity',
    width: 100,
  },
  {
    title: '处理状态',
    key: 'status',
    width: 100,
  },
  {
    title: '位置',
    key: 'location',
    width: 150,
  },
  {
    title: '守护圈',
    key: 'circle',
    width: 120,
  },
  {
    title: '发生时间',
    key: 'timestamp',
    width: 180,
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right',
  },
];

// 获取告警列表
const fetchAlerts = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value,
      type: typeFilter.value,
      severity: severityFilter.value,
      status: statusFilter.value,
      startDate: dateRange.value?.[0]?.format('YYYY-MM-DD'),
      endDate: dateRange.value?.[1]?.format('YYYY-MM-DD'),
    };
    const response = await getAlertList(params);
    alerts.value = response.data.list;
    pagination.total = response.data.total;
  } catch (error) {
    console.error('获取告警列表失败:', error);
    message.error('获取告警列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取告警统计
const fetchAlertStats = async () => {
  try {
    const response = await getAlertStats();
    alertStats.value = response.data;
  } catch (error) {
    console.error('获取告警统计失败:', error);
  }
};

// 初始化 WebSocket
const initWebSocket = () => {
  const wsUrl = `ws://localhost:3000/ws/alerts`;
  websocket = new WebSocket(wsUrl);
  
  websocket.onopen = () => {
    console.log('告警 WebSocket 连接已建立');
  };
  
  websocket.onmessage = (event) => {
    try {
      const alert = JSON.parse(event.data);
      // 添加到实时告警列表
      realtimeAlerts.value.unshift(alert);
      // 保持最多显示 5 条实时告警
      if (realtimeAlerts.value.length > 5) {
        realtimeAlerts.value.pop();
      }
      // 刷新统计数据
      fetchAlertStats();
      // 播放提示音
      playAlertSound(alert.severity);
    } catch (error) {
      console.error('解析 WebSocket 消息失败:', error);
    }
  };
  
  websocket.onclose = () => {
    console.log('告警 WebSocket 连接已关闭');
    // 5秒后重连
    setTimeout(initWebSocket, 5000);
  };
  
  websocket.onerror = (error) => {
    console.error('告警 WebSocket 连接错误:', error);
  };
};

// 播放告警提示音
const playAlertSound = (severity: string) => {
  if (severity === 'critical') {
    // 播放紧急告警音
    const audio = new Audio('/sounds/critical-alert.mp3');
    audio.play().catch(() => {});
  } else if (severity === 'high') {
    // 播放高级告警音
    const audio = new Audio('/sounds/high-alert.mp3');
    audio.play().catch(() => {});
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchAlerts();
};

// 重置
const handleReset = () => {
  searchKeyword.value = '';
  typeFilter.value = undefined;
  severityFilter.value = undefined;
  statusFilter.value = undefined;
  dateRange.value = undefined;
  pagination.current = 1;
  fetchAlerts();
};

// 刷新告警
const refreshAlerts = () => {
  fetchAlerts();
  fetchAlertStats();
};

// 全部已读
const markAllRead = async () => {
  try {
    await markAllAlertsRead();
    message.success('已标记全部告警为已读');
    fetchAlerts();
  } catch (error) {
    console.error('标记已读失败:', error);
    message.error('标记已读失败');
  }
};

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchAlerts();
};

// 获取行样式
const getRowClassName = (record: Alert) => {
  const classes = [];
  if (!record.isRead) classes.push('unread-row');
  if (record.severity === 'critical') classes.push('critical-row');
  return classes.join(' ');
};

// 查看告警
const viewAlert = (alert: Alert) => {
  currentAlert.value = alert;
  showAlertModal.value = true;
  // 标记为已读
  if (!alert.isRead) {
    alert.isRead = true;
  }
};

// 快速确认
const quickConfirm = async (alert: Alert) => {
  await confirmAlert(alert);
  // 从实时告警列表中移除
  const index = realtimeAlerts.value.findIndex(a => a.id === alert.id);
  if (index > -1) {
    realtimeAlerts.value.splice(index, 1);
  }
};

// 告警操作
const handleAlertAction = async (action: string, alert: Alert) => {
  switch (action) {
    case 'confirm':
      await confirmAlert(alert);
      break;
    case 'resolve':
      await resolveAlert(alert);
      break;
    case 'ignore':
      await ignoreAlert(alert);
      break;
    case 'notify':
      await notifyContacts(alert);
      break;
  }
};

// 确认告警
const confirmAlert = async (alert: Alert) => {
  try {
    await confirmAlertApi(alert.id);
    message.success('告警已确认');
    fetchAlerts();
    fetchAlertStats();
    showAlertModal.value = false;
  } catch (error) {
    console.error('确认告警失败:', error);
    message.error('确认告警失败');
  }
};

// 解决告警
const resolveAlert = async (alert: Alert) => {
  try {
    await resolveAlertApi(alert.id);
    message.success('告警已解决');
    fetchAlerts();
    fetchAlertStats();
    showAlertModal.value = false;
  } catch (error) {
    console.error('解决告警失败:', error);
    message.error('解决告警失败');
  }
};

// 忽略告警
const ignoreAlert = async (alert: Alert) => {
  try {
    await ignoreAlertApi(alert.id);
    message.success('告警已忽略');
    fetchAlerts();
    fetchAlertStats();
    showAlertModal.value = false;
  } catch (error) {
    console.error('忽略告警失败:', error);
    message.error('忽略告警失败');
  }
};

// 通知联系人
const notifyContacts = async (alert: Alert) => {
  message.info('通知功能开发中');
};

// 批量确认
const batchConfirm = () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请选择要确认的告警');
    return;
  }
  batchAction.value = 'confirm';
  showBatchModal.value = true;
};

// 批量忽略
const batchIgnore = () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请选择要忽略的告警');
    return;
  }
  batchAction.value = 'ignore';
  showBatchModal.value = true;
};

// 执行批量处理
const handleBatchProcess = async () => {
  batchLoading.value = true;
  try {
    await batchProcessAlerts({
      alertIds: selectedRowKeys.value,
      action: batchAction.value,
      remark: batchRemark.value,
    });
    message.success(`批量${getActionText(batchAction.value)}成功`);
    showBatchModal.value = false;
    selectedRowKeys.value = [];
    batchRemark.value = '';
    fetchAlerts();
    fetchAlertStats();
  } catch (error) {
    console.error('批量处理失败:', error);
    message.error('批量处理失败');
  } finally {
    batchLoading.value = false;
  }
};

// 保存设置
const saveSettings = async () => {
  settingsLoading.value = true;
  try {
    // 这里应该调用保存设置的 API
    message.success('告警设置已保存');
    showSettings.value = false;
  } catch (error) {
    console.error('保存设置失败:', error);
    message.error('保存设置失败');
  } finally {
    settingsLoading.value = false;
  }
};

// 跳转到守护圈
const goToCircle = (circleId: string) => {
  router.push(`/guardian/circles/${circleId}`);
};

// 工具函数
const getAlertIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    fall: FallOutlined,
    sos: AlertOutlined,
    low_battery: BatteryChargeOutlined,
    offline: WifiOutlined,
    fence: EnvironmentOutlined,
    health: HeartOutlined,
  };
  return iconMap[type] || AlertOutlined;
};

const getAlertTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    fall: 'red',
    sos: 'red',
    low_battery: 'orange',
    offline: 'red',
    fence: 'blue',
    health: 'orange',
  };
  return colorMap[type] || 'blue';
};

const getAlertTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    fall: '跌倒告警',
    sos: 'SOS告警',
    low_battery: '低电量告警',
    offline: '设备离线',
    fence: '围栏告警',
    health: '健康告警',
  };
  return textMap[type] || type;
};

const getSeverityColor = (severity: string) => {
  const colorMap: Record<string, string> = {
    low: 'green',
    medium: 'orange',
    high: 'red',
    critical: 'red',
  };
  return colorMap[severity] || 'blue';
};

const getSeverityIcon = (severity: string) => {
  const iconMap: Record<string, any> = {
    low: InfoCircleOutlined,
    medium: ExclamationCircleOutlined,
    high: WarningOutlined,
    critical: AlertOutlined,
  };
  return iconMap[severity] || InfoCircleOutlined;
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

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: 'orange',
    confirmed: 'blue',
    resolved: 'green',
    ignored: 'gray',
  };
  return colorMap[status] || 'blue';
};

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待处理',
    confirmed: '已确认',
    resolved: '已解决',
    ignored: '已忽略',
  };
  return textMap[status] || status;
};

const getProcessColor = (action: string) => {
  const colorMap: Record<string, string> = {
    confirm: 'blue',
    resolve: 'green',
    ignore: 'gray',
  };
  return colorMap[action] || 'blue';
};

const getProcessIcon = (action: string) => {
  const iconMap: Record<string, any> = {
    confirm: CheckCircleOutlined,
    resolve: CheckOutlined,
    ignore: MinusCircleOutlined,
  };
  return iconMap[action] || CheckCircleOutlined;
};

const getProcessText = (action: string) => {
  const textMap: Record<string, string> = {
    confirm: '确认告警',
    resolve: '标记解决',
    ignore: '忽略告警',
  };
  return textMap[action] || action;
};

const getActionText = (action: string) => {
  const textMap: Record<string, string> = {
    confirm: '确认',
    resolve: '解决',
    ignore: '忽略',
  };
  return textMap[action] || action;
};

const formatTime = (time: string) => {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
};

const getTimeAgo = (time: string) => {
  if (!time) return '';
  const diff = Date.now() - new Date(time).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
};

// 生命周期
onMounted(async () => {
  await Promise.all([
    fetchAlerts(),
    fetchAlertStats(),
  ]);
  
  // 初始化 WebSocket
  initWebSocket();
});

onUnmounted(() => {
  if (websocket) {
    websocket.close();
  }
});
</script>

<style scoped lang="less">
.guardian-alerts {
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
        text-align: center;
      }
    }

    .header-title {
      h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #262626;
      }

      p {
        margin: 4px 0 0 0;
        color: #8c8c8c;
        font-size: 14px;
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
        font-size: 20px;
        font-weight: 600;
      }

      &.critical {
        border-left: 4px solid #f5222d;
      }

      &.high {
        border-left: 4px solid #ff7a45;
      }

      &.medium {
        border-left: 4px solid #faad14;
      }

      &.low {
        border-left: 4px solid #52c41a;
      }
    }
  }

  .realtime-section {
    margin-bottom: 24px;

    .realtime-card {
      border: 2px solid #ff4d4f;
      box-shadow: 0 4px 12px rgba(255, 77, 79, 0.15);

      .realtime-title {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .title-text {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ff4d4f;
          font-weight: 600;

          .bell-icon {
            animation: ring 2s infinite;
          }
        }

        .live-tag {
          display: flex;
          align-items: center;
          gap: 4px;

          .live-dot {
            width: 6px;
            height: 6px;
            background: #ff4d4f;
            border-radius: 50%;
            animation: blink 1s infinite;
          }
        }
      }

      .realtime-alerts {
        .realtime-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          margin-bottom: 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            background: #f5f5f5;
          }

          &.severity-critical {
            border-left: 4px solid #f5222d;
            background: rgba(245, 34, 45, 0.05);
          }

          &.severity-high {
            border-left: 4px solid #ff7a45;
            background: rgba(255, 122, 69, 0.05);
          }

          .alert-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ff4d4f;
            color: white;
            font-size: 16px;
          }

          .alert-content {
            flex: 1;

            .alert-title {
              font-weight: 500;
              margin-bottom: 4px;
            }

            .alert-description {
              font-size: 12px;
              color: #8c8c8c;
              margin-bottom: 4px;
            }

            .alert-meta {
              display: flex;
              align-items: center;
              gap: 12px;
              font-size: 12px;
              color: #8c8c8c;

              .device-name {
                display: flex;
                align-items: center;
                gap: 4px;
              }
            }
          }

          .alert-actions {
            flex-shrink: 0;
          }
        }
      }
    }
  }

  .search-section {
    margin-bottom: 24px;
  }

  .alerts-section {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .table-title {
        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .alert-count {
          color: #8c8c8c;
          font-size: 14px;
          margin-left: 8px;
        }
      }
    }

    .alert-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .alert-indicator {
        position: relative;
        flex-shrink: 0;

        .severity-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          z-index: 1;

          &.severity-critical {
            background: #f5222d;
            animation: pulse 2s infinite;
          }

          &.severity-high {
            background: #ff7a45;
          }

          &.severity-medium {
            background: #faad14;
          }

          &.severity-low {
            background: #52c41a;
          }
        }

        .alert-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ff4d4f;
          color: white;
          font-size: 14px;
        }
      }

      .alert-details {
        .alert-title {
          font-weight: 500;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alert-description {
          font-size: 12px;
          color: #8c8c8c;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .alert-device {
          font-size: 12px;
          color: #1890ff;
          display: flex;
          align-items: center;
          gap: 4px;

          .device-sn {
            color: #8c8c8c;
          }
        }
      }
    }

    .location-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #8c8c8c;
    }

    .time-info {
      .time-value {
        font-size: 14px;
        margin-bottom: 4px;
      }

      .time-ago {
        font-size: 12px;
        color: #8c8c8c;
      }
    }
  }

  .alert-detail {
    .device-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .device-sn {
        color: #8c8c8c;
        font-size: 12px;
      }
    }

    .location-detail {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .alert-data {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
    }

    .process-record {
      .process-action {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .process-user {
        font-size: 12px;
        color: #1890ff;
        margin-bottom: 2px;
      }

      .process-time {
        font-size: 12px;
        color: #8c8c8c;
        margin-bottom: 4px;
      }

      .process-remark {
        font-size: 12px;
        color: #666;
        font-style: italic;
      }
    }
  }

  .severity-settings {
    .severity-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .severity-label {
        font-size: 14px;
      }
    }
  }

  .batch-process {
    p {
      margin-bottom: 16px;
    }
  }
}

:deep(.ant-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.ant-table) {
  .ant-table-thead > tr > th {
    background: #fafafa;
    font-weight: 600;
  }

  .unread-row {
    background: rgba(24, 144, 255, 0.05);
    
    &:hover {
      background: rgba(24, 144, 255, 0.1) !important;
    }
  }

  .critical-row {
    background: rgba(245, 34, 45, 0.05);
    
    &:hover {
      background: rgba(245, 34, 45, 0.1) !important;
    }
  }
}

.text-gray-500 {
  color: #8c8c8c;
}

// 动画
@keyframes ring {
  0%, 20%, 50%, 80%, 100% {
    transform: rotate(0deg);
  }
  10% {
    transform: rotate(-10deg);
  }
  30% {
    transform: rotate(10deg);
  }
  60% {
    transform: rotate(-5deg);
  }
  90% {
    transform: rotate(5deg);
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>