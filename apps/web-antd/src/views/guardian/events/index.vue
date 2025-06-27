<template>
  <div class="guardian-events">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>事件记录</h1>
          <p>监控和管理所有设备事件，及时响应异常情况</p>
        </div>
        <div class="header-actions">
          <a-space>
            <a-button @click="refreshEvents">
              <template #icon><ReloadOutlined /></template>
              刷新
            </a-button>
            <a-button @click="exportEvents">
              <template #icon><DownloadOutlined /></template>
              导出数据
            </a-button>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 事件统计 -->
    <div class="stats-section">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="6">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="今日事件"
              :value="eventStats.today"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix><CalendarOutlined /></template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="6">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="紧急事件"
              :value="eventStats.critical"
              :value-style="{ color: '#f5222d' }"
            >
              <template #prefix><ExclamationCircleOutlined /></template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="6">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="待处理"
              :value="eventStats.pending"
              :value-style="{ color: '#faad14' }"
            >
              <template #prefix><ClockCircleOutlined /></template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="6">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="已处理"
              :value="eventStats.resolved"
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix><CheckCircleOutlined /></template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <a-card :bordered="false">
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :sm="12" :md="6">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索事件描述或设备"
              allow-clear
              @search="handleSearch"
            />
          </a-col>
          <a-col :xs="24" :sm="12" :md="4">
            <a-select
              v-model:value="typeFilter"
              placeholder="事件类型"
              style="width: 100%"
              allow-clear
            >
              <a-select-option value="fall">跌倒检测</a-select-option>
              <a-select-option value="sos">SOS求救</a-select-option>
              <a-select-option value="low_battery">低电量</a-select-option>
              <a-select-option value="offline">设备离线</a-select-option>
              <a-select-option value="fence">电子围栏</a-select-option>
              <a-select-option value="health">健康异常</a-select-option>
            </a-select>
          </a-col>
          <a-col :xs="24" :sm="12" :md="4">
            <a-select
              v-model:value="severityFilter"
              placeholder="严重程度"
              style="width: 100%"
              allow-clear
            >
              <a-select-option value="low">低</a-select-option>
              <a-select-option value="medium">中</a-select-option>
              <a-select-option value="high">高</a-select-option>
              <a-select-option value="critical">紧急</a-select-option>
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
              <a-select-option value="processing">处理中</a-select-option>
              <a-select-option value="resolved">已处理</a-select-option>
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
            <a-button type="primary" @click="fetchEvents">搜索</a-button>
          </a-space>
        </div>
      </a-card>
    </div>

    <!-- 事件列表 -->
    <div class="events-section">
      <a-card :bordered="false">
        <div class="table-header">
          <div class="table-title">
            <h3>事件列表</h3>
            <span class="event-count">共 {{ pagination.total }} 条事件</span>
          </div>
          <div class="table-actions">
            <a-space>
              <a-button
                :disabled="!selectedRowKeys.length"
                @click="batchProcess"
              >
                批量处理
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
          :columns="eventColumns"
          :data-source="events"
          :loading="loading"
          :pagination="pagination"
          :row-selection="rowSelection"
          row-key="id"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'event'">
              <div class="event-info">
                <div class="event-icon">
                  <a-avatar :style="getEventAvatarStyle(record.type, record.severity)" shape="square">
                    <component :is="getEventIcon(record.type)" />
                  </a-avatar>
                </div>
                <div class="event-details">
                  <div class="event-title">{{ getEventTypeText(record.type) }}</div>
                  <div class="event-description">{{ record.description }}</div>
                  <div class="event-device">
                    <MobileOutlined />
                    {{ record.deviceName }}
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
                <a-button type="link" size="small" @click="viewEvent(record)">
                  查看
                </a-button>
                <a-dropdown v-if="record.status === 'pending'">
                  <a-button type="link" size="small">
                    处理 <DownOutlined />
                  </a-button>
                  <template #overlay>
                    <a-menu @click="({ key }) => handleEventAction(key, record)">
                      <a-menu-item key="process">
                        <CheckCircleOutlined />
                        标记处理
                      </a-menu-item>
                      <a-menu-item key="ignore">
                        <MinusCircleOutlined />
                        忽略事件
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

    <!-- 事件详情弹窗 -->
    <a-modal
      v-model:open="showEventModal"
      :title="`事件详情 - ${currentEvent?.type ? getEventTypeText(currentEvent.type) : ''}`"
      width="800px"
      :footer="null"
    >
      <div v-if="currentEvent" class="event-detail">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="事件类型">
            <a-tag :color="getEventTypeColor(currentEvent.type)">
              <template #icon>
                <component :is="getEventIcon(currentEvent.type)" />
              </template>
              {{ getEventTypeText(currentEvent.type) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="严重程度">
            <a-tag :color="getSeverityColor(currentEvent.severity)">
              <template #icon>
                <component :is="getSeverityIcon(currentEvent.severity)" />
              </template>
              {{ getSeverityText(currentEvent.severity) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="设备信息">
            <div class="device-info">
              <MobileOutlined />
              {{ currentEvent.deviceName }}
              <span class="device-sn">({{ currentEvent.deviceSn }})</span>
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="守护圈">
            <a-tag v-if="currentEvent.circleName" color="blue">
              {{ currentEvent.circleName }}
            </a-tag>
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item label="发生时间">
            {{ formatTime(currentEvent.timestamp) }}
          </a-descriptions-item>
          <a-descriptions-item label="位置信息">
            <div class="location-detail">
              <EnvironmentOutlined />
              {{ currentEvent.location || '未知位置' }}
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="处理状态">
            <a-tag :color="getStatusColor(currentEvent.status)">
              {{ getStatusText(currentEvent.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="处理时间" v-if="currentEvent.processedAt">
            {{ formatTime(currentEvent.processedAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="事件描述" :span="2">
            {{ currentEvent.description }}
          </a-descriptions-item>
          <a-descriptions-item label="详细数据" :span="2" v-if="currentEvent.data">
            <pre class="event-data">{{ JSON.stringify(currentEvent.data, null, 2) }}</pre>
          </a-descriptions-item>
        </a-descriptions>
        
        <div class="event-actions" style="margin-top: 24px; text-align: center;">
          <a-space v-if="currentEvent.status === 'pending'">
            <a-button type="primary" @click="processEvent(currentEvent)">
              <CheckCircleOutlined />
              标记处理
            </a-button>
            <a-button @click="ignoreEvent(currentEvent)">
              <MinusCircleOutlined />
              忽略事件
            </a-button>
            <a-button @click="notifyContacts(currentEvent)">
              <BellOutlined />
              发送通知
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>

    <!-- 批量处理弹窗 -->
    <a-modal
      v-model:open="showBatchModal"
      title="批量处理事件"
      :confirm-loading="batchLoading"
      @ok="handleBatchProcess"
    >
      <div class="batch-process">
        <p>您选择了 <strong>{{ selectedRowKeys.length }}</strong> 个事件，请选择处理方式：</p>
        <a-radio-group v-model:value="batchAction">
          <a-radio value="process">标记为已处理</a-radio>
          <a-radio value="ignore">标记为已忽略</a-radio>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import {
  ReloadOutlined,
  DownloadOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DownOutlined,
  MobileOutlined,
  EnvironmentOutlined,
  BellOutlined,
  MinusCircleOutlined,
  FallOutlined,
  AlertOutlined,
  BatteryChargeOutlined,
  WifiOutlined,
  HeartOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue';
import {
  getEventList,
  processEvent as processEventApi,
  ignoreEvent as ignoreEventApi,
  batchProcessEvents,
  getEventStats,
  type DeviceEvent,
} from '#/api/guardian';

const router = useRouter();

// 响应式数据
const events = ref<DeviceEvent[]>([]);
const loading = ref(false);
const searchKeyword = ref('');
const typeFilter = ref<string>();
const severityFilter = ref<string>();
const statusFilter = ref<string>();
const dateRange = ref();

// 事件统计
const eventStats = ref({
  today: 0,
  critical: 0,
  pending: 0,
  resolved: 0,
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

// 事件详情
const showEventModal = ref(false);
const currentEvent = ref<DeviceEvent>();

// 批量处理
const showBatchModal = ref(false);
const batchLoading = ref(false);
const batchAction = ref('process');
const batchRemark = ref('');

// 表格列定义
const eventColumns = [
  {
    title: '事件信息',
    key: 'event',
    width: 300,
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

// 获取事件列表
const fetchEvents = async () => {
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
    const response = await getEventList(params);
    events.value = response.data.list;
    pagination.total = response.data.total;
  } catch (error) {
    console.error('获取事件列表失败:', error);
    message.error('获取事件列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取事件统计
const fetchEventStats = async () => {
  try {
    const response = await getEventStats();
    eventStats.value = response.data;
  } catch (error) {
    console.error('获取事件统计失败:', error);
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchEvents();
};

// 重置
const handleReset = () => {
  searchKeyword.value = '';
  typeFilter.value = undefined;
  severityFilter.value = undefined;
  statusFilter.value = undefined;
  dateRange.value = undefined;
  pagination.current = 1;
  fetchEvents();
};

// 刷新事件
const refreshEvents = () => {
  fetchEvents();
  fetchEventStats();
};

// 导出事件
const exportEvents = () => {
  message.info('导出功能开发中');
};

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchEvents();
};

// 查看事件
const viewEvent = (event: DeviceEvent) => {
  currentEvent.value = event;
  showEventModal.value = true;
};

// 事件操作
const handleEventAction = async (action: string, event: DeviceEvent) => {
  switch (action) {
    case 'process':
      await processEvent(event);
      break;
    case 'ignore':
      await ignoreEvent(event);
      break;
    case 'notify':
      await notifyContacts(event);
      break;
  }
};

// 处理事件
const processEvent = async (event: DeviceEvent) => {
  try {
    await processEventApi(event.id);
    message.success('事件已标记为处理');
    fetchEvents();
    fetchEventStats();
    showEventModal.value = false;
  } catch (error) {
    console.error('处理事件失败:', error);
    message.error('处理事件失败');
  }
};

// 忽略事件
const ignoreEvent = async (event: DeviceEvent) => {
  try {
    await ignoreEventApi(event.id);
    message.success('事件已忽略');
    fetchEvents();
    fetchEventStats();
    showEventModal.value = false;
  } catch (error) {
    console.error('忽略事件失败:', error);
    message.error('忽略事件失败');
  }
};

// 通知联系人
const notifyContacts = async (event: DeviceEvent) => {
  message.info('通知功能开发中');
};

// 批量处理
const batchProcess = () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请选择要处理的事件');
    return;
  }
  showBatchModal.value = true;
};

// 批量忽略
const batchIgnore = () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请选择要忽略的事件');
    return;
  }
  batchAction.value = 'ignore';
  showBatchModal.value = true;
};

// 执行批量处理
const handleBatchProcess = async () => {
  batchLoading.value = true;
  try {
    await batchProcessEvents({
      eventIds: selectedRowKeys.value,
      action: batchAction.value,
      remark: batchRemark.value,
    });
    message.success(`批量${batchAction.value === 'process' ? '处理' : '忽略'}成功`);
    showBatchModal.value = false;
    selectedRowKeys.value = [];
    batchRemark.value = '';
    fetchEvents();
    fetchEventStats();
  } catch (error) {
    console.error('批量处理失败:', error);
    message.error('批量处理失败');
  } finally {
    batchLoading.value = false;
  }
};

// 跳转到守护圈
const goToCircle = (circleId: string) => {
  router.push(`/guardian/circles/${circleId}`);
};

// 工具函数
const getEventIcon = (type: string) => {
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

const getEventAvatarStyle = (type: string, severity: string) => {
  const severityColors: Record<string, string> = {
    low: '#52c41a',
    medium: '#faad14',
    high: '#ff7a45',
    critical: '#f5222d',
  };
  return { backgroundColor: severityColors[severity] || '#1890ff' };
};

const getEventTypeColor = (type: string) => {
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

const getEventTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    fall: '跌倒检测',
    sos: 'SOS求救',
    low_battery: '低电量',
    offline: '设备离线',
    fence: '电子围栏',
    health: '健康异常',
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
    low: CheckCircleOutlined,
    medium: ExclamationCircleOutlined,
    high: WarningOutlined,
    critical: AlertOutlined,
  };
  return iconMap[severity] || CheckCircleOutlined;
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
    processing: 'blue',
    resolved: 'green',
    ignored: 'gray',
  };
  return colorMap[status] || 'blue';
};

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已处理',
    ignored: '已忽略',
  };
  return textMap[status] || status;
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
    fetchEvents(),
    fetchEventStats(),
  ]);
});
</script>

<style scoped lang="less">
.guardian-events {
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
    }
  }

  .search-section {
    margin-bottom: 24px;
  }

  .events-section {
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

        .event-count {
          color: #8c8c8c;
          font-size: 14px;
          margin-left: 8px;
        }
      }
    }

    .event-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .event-icon {
        flex-shrink: 0;
      }

      .event-details {
        .event-title {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .event-description {
          font-size: 12px;
          color: #8c8c8c;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .event-device {
          font-size: 12px;
          color: #1890ff;
          display: flex;
          align-items: center;
          gap: 4px;
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

  .event-detail {
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

    .event-data {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
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
}

.text-gray-500 {
  color: #8c8c8c;
}
</style>