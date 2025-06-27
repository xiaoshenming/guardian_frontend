<template>
  <div class="circle-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <a-page-header
        :title="circle?.name || '守护圈详情'"
        :sub-title="circle?.description"
        @back="() => $router.go(-1)"
      >
        <template #extra>
          <a-space>
            <a-button v-if="canManage" @click="showInviteModal = true">
              <template #icon><UserAddOutlined /></template>
              邀请成员
            </a-button>
            <a-button v-if="canManage" @click="activeTab = 'settings'">
              <template #icon><SettingOutlined /></template>
              设置
            </a-button>
            <a-dropdown v-if="canOperate">
              <a-button>
                <template #icon><MoreOutlined /></template>
              </a-button>
              <template #overlay>
                <a-menu @click="handleMenuClick">
                  <a-menu-item v-if="!isOwner" key="leave">
                    <ExitToAppOutlined />
                    退出守护圈
                  </a-menu-item>
                  <a-menu-item v-if="isOwner" key="dissolve" danger>
                    <DeleteOutlined />
                    解散守护圈
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </template>
      </a-page-header>
    </div>

    <!-- 守护圈信息卡片 -->
    <div class="circle-info-section">
      <a-card :bordered="false" class="info-card">
        <a-row :gutter="[24, 24]">
          <a-col :xs="24" :sm="12" :md="6">
            <a-statistic title="成员数量" :value="circle?.memberCount || 0" suffix="人">
              <template #prefix><TeamOutlined /></template>
            </a-statistic>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-statistic title="设备数量" :value="circle?.deviceCount || 0" suffix="台">
              <template #prefix><MobileOutlined /></template>
            </a-statistic>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-statistic title="今日事件" :value="todayEvents" suffix="条">
              <template #prefix><ActivityOutlined /></template>
            </a-statistic>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-statistic title="待处理告警" :value="pendingAlerts" suffix="条">
              <template #prefix><AlertOutlined /></template>
            </a-statistic>
          </a-col>
        </a-row>
      </a-card>
    </div>

    <!-- 标签页内容 -->
    <div class="content-section">
      <a-card :bordered="false">
        <a-tabs v-model:activeKey="activeTab" type="card">
          <!-- 概览 -->
          <a-tab-pane key="overview" tab="概览">
            <div class="overview-content">
              <a-row :gutter="[16, 16]">
                <!-- 最近事件 -->
                <a-col :xs="24" :lg="12">
                  <a-card title="最近事件" size="small">
                    <template #extra>
                      <a-button type="link" size="small" @click="activeTab = 'events'">
                        查看全部
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
                              <a-avatar :style="getEventAvatarStyle(item.type)" size="small">
                                <component :is="getEventIcon(item.type)" />
                              </a-avatar>
                            </template>
                            <template #title>
                              <span>{{ getEventTypeName(item.type) }}</span>
                            </template>
                            <template #description>
                              <div>
                                <div>{{ item.deviceName }}</div>
                                <div class="text-xs text-gray-500">{{ formatTime(item.createdAt) }}</div>
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
                  <a-card title="设备状态" size="small">
                    <template #extra>
                      <a-button type="link" size="small" @click="activeTab = 'devices'">
                        查看全部
                      </a-button>
                    </template>
                    <div class="device-status-list">
                      <div
                        v-for="device in recentDevices"
                        :key="device.id"
                        class="device-item"
                      >
                        <div class="device-info">
                          <div class="device-name">{{ device.name }}</div>
                          <div class="device-user">{{ device.boundUserName }}</div>
                        </div>
                        <div class="device-status">
                          <a-tag :color="getDeviceStatusColor(device.status)">
                            {{ getDeviceStatusText(device.status) }}
                          </a-tag>
                        </div>
                      </div>
                    </div>
                  </a-card>
                </a-col>
              </a-row>
            </div>
          </a-tab-pane>

          <!-- 成员管理 -->
          <a-tab-pane key="members" tab="成员管理">
            <div class="members-content">
              <div class="members-header">
                <div class="header-info">
                  <h3>成员列表 ({{ members.length }})</h3>
                </div>
                <div class="header-actions">
                  <a-button v-if="canManage" type="primary" @click="showInviteModal = true">
                    <template #icon><UserAddOutlined /></template>
                    邀请成员
                  </a-button>
                </div>
              </div>

              <a-table
                :columns="memberColumns"
                :data-source="members"
                :loading="membersLoading"
                :pagination="false"
                row-key="id"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'avatar'">
                    <a-avatar :src="record.avatar" :size="40">
                      {{ record.username?.charAt(0)?.toUpperCase() }}
                    </a-avatar>
                  </template>
                  <template v-else-if="column.key === 'role'">
                    <a-tag :color="getRoleColor(record.role)">
                      {{ getRoleText(record.role) }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'status'">
                    <a-tag :color="record.status === 'active' ? 'green' : 'red'">
                      {{ record.status === 'active' ? '正常' : '禁用' }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'joinedAt'">
                    {{ formatDate(record.joinedAt) }}
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <a-space v-if="canManageMembers && record.role !== 'owner'">
                      <a-button type="link" size="small" @click="editMember(record)">
                        编辑
                      </a-button>
                      <a-button type="link" size="small" danger @click="removeMember(record)">
                        移除
                      </a-button>
                    </a-space>
                  </template>
                </template>
              </a-table>
            </div>
          </a-tab-pane>

          <!-- 设备管理 -->
          <a-tab-pane key="devices" tab="设备管理">
            <div class="devices-content">
              <div class="devices-header">
                <div class="header-info">
                  <h3>设备列表 ({{ devices.length }})</h3>
                </div>
                <div class="header-actions">
                  <a-button type="primary" @click="bindDevice">
                    <template #icon><PlusOutlined /></template>
                    绑定设备
                  </a-button>
                </div>
              </div>

              <a-table
                :columns="deviceColumns"
                :data-source="devices"
                :loading="devicesLoading"
                :pagination="false"
                row-key="id"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'status'">
                    <a-tag :color="getDeviceStatusColor(record.status)">
                      {{ getDeviceStatusText(record.status) }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'batteryLevel'">
                    <a-progress
                      :percent="record.batteryLevel"
                      :status="record.batteryLevel < 20 ? 'exception' : 'normal'"
                      size="small"
                    />
                  </template>
                  <template v-else-if="column.key === 'lastHeartbeat'">
                    {{ formatTime(record.lastHeartbeat) }}
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <a-space>
                      <a-button type="link" size="small" @click="viewDevice(record)">
                        查看
                      </a-button>
                      <a-button v-if="canManage" type="link" size="small" @click="configDevice(record)">
                        配置
                      </a-button>
                    </a-space>
                  </template>
                </template>
              </a-table>
            </div>
          </a-tab-pane>

          <!-- 事件记录 -->
          <a-tab-pane key="events" tab="事件记录">
            <div class="events-content">
              <!-- 事件筛选 -->
              <div class="events-filter">
                <a-row :gutter="[16, 16]">
                  <a-col :xs="24" :sm="8">
                    <a-select
                      v-model:value="eventTypeFilter"
                      placeholder="事件类型"
                      style="width: 100%"
                      allow-clear
                    >
                      <a-select-option value="fall_detection">跌倒检测</a-select-option>
                      <a-select-option value="gesture_wave">挥手手势</a-select-option>
                      <a-select-option value="emergency">紧急求助</a-select-option>
                    </a-select>
                  </a-col>
                  <a-col :xs="24" :sm="8">
                    <a-range-picker v-model:value="dateRange" style="width: 100%" />
                  </a-col>
                  <a-col :xs="24" :sm="8">
                    <a-space>
                      <a-button @click="resetEventFilter">重置</a-button>
                      <a-button type="primary" @click="fetchEvents">查询</a-button>
                    </a-space>
                  </a-col>
                </a-row>
              </div>

              <!-- 事件列表 -->
              <a-table
                :columns="eventColumns"
                :data-source="events"
                :loading="eventsLoading"
                :pagination="eventPagination"
                row-key="id"
                @change="handleEventTableChange"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'type'">
                    <a-tag :color="getEventTypeColor(record.type)">
                      {{ $t(`guardian.event.types.${record.type}`) }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'level'">
                    <a-tag :color="getEventLevelColor(record.level)">
                      {{ record.level }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'createdAt'">
                    {{ formatTime(record.createdAt) }}
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <a-button type="link" size="small" @click="viewEvent(record)">
                      查看详情
                    </a-button>
                  </template>
                </template>
              </a-table>
            </div>
          </a-tab-pane>

          <!-- 设置 -->
          <a-tab-pane v-if="canManage" key="settings" tab="设置">
            <div class="settings-content">
              <a-form
                :model="settingsForm"
                :rules="settingsRules"
                layout="vertical"
                @finish="handleUpdateSettings"
              >
                <a-form-item label="守护圈名称" name="name">
                  <a-input v-model:value="settingsForm.name" />
                </a-form-item>
                <a-form-item label="描述" name="description">
                  <a-textarea v-model:value="settingsForm.description" :rows="3" />
                </a-form-item>
                <a-form-item label="最大成员数" name="maxMembers">
                  <a-input-number
                    v-model:value="settingsForm.maxMembers"
                    :min="circle?.memberCount || 1"
                    :max="100"
                    style="width: 200px"
                  />
                </a-form-item>
                <a-form-item>
                  <a-space>
                    <a-button type="primary" html-type="submit" :loading="updateLoading">
                      保存设置
                    </a-button>
                    <a-button @click="resetSettings">重置</a-button>
                  </a-space>
                </a-form-item>
              </a-form>

              <a-divider />

              <div class="danger-zone">
                <h4>危险操作</h4>
                <a-space direction="vertical" style="width: 100%">
                  <a-button danger @click="confirmDissolve">
                    解散守护圈
                  </a-button>
                </a-space>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </div>

    <!-- 邀请成员弹窗 -->
    <a-modal
      v-model:open="showInviteModal"
      title="邀请成员"
      :confirm-loading="inviteLoading"
      @ok="handleInvite"
    >
      <div class="invite-content">
        <div class="invite-code-section">
          <h4>邀请码</h4>
          <div class="invite-code">
            <a-input :value="circle?.inviteCode" readonly>
              <template #suffix>
                <a-button type="link" size="small" @click="copyInviteCode">
                  复制
                </a-button>
              </template>
            </a-input>
          </div>
          <p class="invite-tip">分享此邀请码给您的朋友，他们可以通过此码加入守护圈</p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import {
  UserAddOutlined,
  SettingOutlined,
  MoreOutlined,
  ExitToAppOutlined,
  DeleteOutlined,
  TeamOutlined,
  MobileOutlined,
  ActivityOutlined,
  AlertOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BellOutlined,
} from '@ant-design/icons-vue';
import {
  getCircleDetail,
  getCircleMembers,
  getCircleDevices,
  getCircleEvents,
  updateCircle,
  leaveCircle,
  deleteCircle,
  type Circle,
  type CircleMember,
  type Device,
  type Event,
} from '#/api/guardian';

const route = useRoute();
const router = useRouter();

// 响应式数据
const circle = ref<Circle>();
const members = ref<CircleMember[]>([]);
const devices = ref<Device[]>([]);
const events = ref<Event[]>([]);
const recentEvents = ref<Event[]>([]);
const recentDevices = ref<Device[]>([]);

const activeTab = ref(route.query.tab as string || 'overview');
const loading = ref(false);
const membersLoading = ref(false);
const devicesLoading = ref(false);
const eventsLoading = ref(false);
const updateLoading = ref(false);
const inviteLoading = ref(false);

// 统计数据
const todayEvents = ref(0);
const pendingAlerts = ref(0);

// 邀请成员
const showInviteModal = ref(false);

// 事件筛选
const eventTypeFilter = ref<string>();
const dateRange = ref();
const eventPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 设置表单
const settingsForm = reactive({
  name: '',
  description: '',
  maxMembers: 10,
});

const settingsRules = {
  name: [{ required: true, message: '请输入守护圈名称' }],
  maxMembers: [{ required: true, message: '请设置最大成员数' }],
};

// 权限计算
const currentUserId = ref('current-user-id'); // 应该从用户状态获取
const isOwner = computed(() => circle.value?.ownerId === currentUserId.value);
const canManage = computed(() => {
  const member = members.value.find(m => m.userId === currentUserId.value);
  return member && ['owner', 'admin'].includes(member.role);
});
const canManageMembers = computed(() => isOwner.value);
const canOperate = computed(() => {
  const member = members.value.find(m => m.userId === currentUserId.value);
  return !!member;
});

// 表格列定义
const memberColumns = [
  { title: '头像', key: 'avatar', width: 80 },
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '角色', key: 'role', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '加入时间', key: 'joinedAt', width: 120 },
  { title: '操作', key: 'actions', width: 120 },
];

const deviceColumns = [
  { title: '设备名称', dataIndex: 'name', key: 'name' },
  { title: '设备型号', dataIndex: 'model', key: 'model' },
  { title: '绑定用户', dataIndex: 'boundUserName', key: 'boundUserName' },
  { title: '状态', key: 'status', width: 100 },
  { title: '电量', key: 'batteryLevel', width: 120 },
  { title: '最后心跳', key: 'lastHeartbeat', width: 150 },
  { title: '操作', key: 'actions', width: 120 },
];

const eventColumns = [
  { title: '事件类型', key: 'type', width: 120 },
  { title: '设备', dataIndex: 'deviceName', key: 'deviceName' },
  { title: '级别', key: 'level', width: 80 },
  { title: '内容', dataIndex: 'content', key: 'content' },
  { title: '时间', key: 'createdAt', width: 150 },
  { title: '操作', key: 'actions', width: 100 },
];

// 获取守护圈详情
const fetchCircleDetail = async () => {
  const circleId = route.params.id as string;
  if (!circleId) return;

  loading.value = true;
  try {
    const response = await getCircleDetail(circleId);
    circle.value = response.data;
    
    // 初始化设置表单
    Object.assign(settingsForm, {
      name: circle.value.name,
      description: circle.value.description,
      maxMembers: circle.value.maxMembers,
    });
  } catch (error) {
    console.error('获取守护圈详情失败:', error);
    message.error('获取守护圈详情失败');
  } finally {
    loading.value = false;
  }
};

// 获取成员列表
const fetchMembers = async () => {
  const circleId = route.params.id as string;
  if (!circleId) return;

  membersLoading.value = true;
  try {
    const response = await getCircleMembers(circleId);
    members.value = response.data;
  } catch (error) {
    console.error('获取成员列表失败:', error);
  } finally {
    membersLoading.value = false;
  }
};

// 获取设备列表
const fetchDevices = async () => {
  const circleId = route.params.id as string;
  if (!circleId) return;

  devicesLoading.value = true;
  try {
    const response = await getCircleDevices(circleId);
    devices.value = response.data;
    recentDevices.value = response.data.slice(0, 5);
  } catch (error) {
    console.error('获取设备列表失败:', error);
  } finally {
    devicesLoading.value = false;
  }
};

// 获取事件列表
const fetchEvents = async () => {
  const circleId = route.params.id as string;
  if (!circleId) return;

  eventsLoading.value = true;
  try {
    const params = {
      circleId,
      page: eventPagination.current,
      pageSize: eventPagination.pageSize,
      type: eventTypeFilter.value,
      startDate: dateRange.value?.[0]?.format('YYYY-MM-DD'),
      endDate: dateRange.value?.[1]?.format('YYYY-MM-DD'),
    };
    const response = await getCircleEvents(params);
    events.value = response.data.list;
    eventPagination.total = response.data.total;
    
    if (eventPagination.current === 1) {
      recentEvents.value = response.data.list.slice(0, 5);
    }
  } catch (error) {
    console.error('获取事件列表失败:', error);
  } finally {
    eventsLoading.value = false;
  }
};

// 更新设置
const handleUpdateSettings = async () => {
  const circleId = route.params.id as string;
  if (!circleId) return;

  updateLoading.value = true;
  try {
    await updateCircle(circleId, settingsForm);
    message.success('更新设置成功');
    await fetchCircleDetail();
  } catch (error) {
    console.error('更新设置失败:', error);
    message.error('更新设置失败');
  } finally {
    updateLoading.value = false;
  }
};

// 重置设置
const resetSettings = () => {
  if (circle.value) {
    Object.assign(settingsForm, {
      name: circle.value.name,
      description: circle.value.description,
      maxMembers: circle.value.maxMembers,
    });
  }
};

// 菜单点击处理
const handleMenuClick = ({ key }: { key: string }) => {
  switch (key) {
    case 'leave':
      confirmLeave();
      break;
    case 'dissolve':
      confirmDissolve();
      break;
  }
};

// 确认退出
const confirmLeave = () => {
  Modal.confirm({
    title: '确认退出守护圈？',
    content: '退出后将无法查看守护圈信息，需要重新加入',
    onOk: async () => {
      try {
        await leaveCircle(route.params.id as string);
        message.success('退出守护圈成功');
        router.push('/guardian/circles');
      } catch (error) {
        message.error('退出守护圈失败');
      }
    },
  });
};

// 确认解散
const confirmDissolve = () => {
  Modal.confirm({
    title: '确认解散守护圈？',
    content: '解散后所有数据将被删除，此操作不可恢复',
    onOk: async () => {
      try {
        await deleteCircle(route.params.id as string);
        message.success('解散守护圈成功');
        router.push('/guardian/circles');
      } catch (error) {
        message.error('解散守护圈失败');
      }
    },
  });
};

// 复制邀请码
const copyInviteCode = async () => {
  if (circle.value?.inviteCode) {
    try {
      await navigator.clipboard.writeText(circle.value.inviteCode);
      message.success('邀请码已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  }
};

// 工具函数
const getEventIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    fall_detection: ExclamationCircleOutlined,
    gesture_wave: CheckCircleOutlined,
    emergency: AlertOutlined,
  };
  return iconMap[type] || ClockCircleOutlined;
};

const getEventAvatarStyle = (type: string) => {
  const colorMap: Record<string, string> = {
    fall_detection: '#ff4d4f',
    gesture_wave: '#52c41a',
    emergency: '#ff4d4f',
  };
  return { backgroundColor: colorMap[type] || '#1890ff' };
};

const getDeviceStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    online: 'green',
    offline: 'red',
    fault: 'orange',
  };
  return colorMap[status] || 'blue';
};

const getDeviceStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    online: '在线',
    offline: '离线',
    fault: '故障',
  };
  return textMap[status] || status;
};

const getRoleColor = (role: string) => {
  const colorMap: Record<string, string> = {
    owner: 'red',
    admin: 'orange',
    member: 'blue',
  };
  return colorMap[role] || 'blue';
};

const getRoleText = (role: string) => {
  const textMap: Record<string, string> = {
    owner: '圈主',
    admin: '管理员',
    member: '成员',
  };
  return textMap[role] || role;
};

const getEventTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    fall_detection: 'red',
    gesture_wave: 'green',
    emergency: 'red',
  };
  return colorMap[type] || 'blue';
};

const getEventLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    general: 'blue',
    important: 'orange',
    urgent: 'red',
  };
  return colorMap[level] || 'blue';
};

const getEventTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    fall_detection: '跌倒检测',
    gesture_wave: '手势挥动',
    emergency: '紧急求助',
    heart_rate_abnormal: '心率异常',
    location_out_of_bounds: '位置越界',
    device_offline: '设备离线',
    low_battery: '电量不足'
  };
  return typeMap[type] || type;
};

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN');
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

// 事件处理
const handleEventTableChange = (pagination: any) => {
  eventPagination.current = pagination.current;
  eventPagination.pageSize = pagination.pageSize;
  fetchEvents();
};

const resetEventFilter = () => {
  eventTypeFilter.value = undefined;
  dateRange.value = undefined;
  eventPagination.current = 1;
  fetchEvents();
};

// 其他操作
const handleInvite = () => {
  showInviteModal.value = false;
};

const editMember = (member: CircleMember) => {
  console.log('编辑成员:', member);
};

const removeMember = (member: CircleMember) => {
  console.log('移除成员:', member);
};

const bindDevice = () => {
  router.push('/guardian/devices?action=bind');
};

const viewDevice = (device: Device) => {
  router.push(`/guardian/devices/${device.id}`);
};

const configDevice = (device: Device) => {
  router.push(`/guardian/devices/${device.id}?tab=config`);
};

const viewEvent = (event: Event) => {
  console.log('查看事件详情:', event);
};

// 监听路由变化
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab) {
      activeTab.value = newTab as string;
    }
  }
);

// 监听标签页变化
watch(activeTab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } });
  
  // 根据标签页加载对应数据
  switch (newTab) {
    case 'members':
      fetchMembers();
      break;
    case 'devices':
      fetchDevices();
      break;
    case 'events':
      fetchEvents();
      break;
  }
});

// 生命周期
onMounted(async () => {
  await fetchCircleDetail();
  await fetchMembers();
  
  // 根据当前标签页加载数据
  switch (activeTab.value) {
    case 'overview':
      await Promise.all([fetchDevices(), fetchEvents()]);
      break;
    case 'members':
      // 已在上面加载
      break;
    case 'devices':
      await fetchDevices();
      break;
    case 'events':
      await fetchEvents();
      break;
  }
});
</script>

<style scoped lang="less">
.circle-detail {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;

  .page-header {
    margin-bottom: 24px;
    
    :deep(.ant-page-header) {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }

  .circle-info-section {
    margin-bottom: 24px;

    .info-card {
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

  .content-section {
    .overview-content {
      .device-status-list {
        .device-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .device-info {
            .device-name {
              font-weight: 500;
              margin-bottom: 4px;
            }

            .device-user {
              font-size: 12px;
              color: #8c8c8c;
            }
          }
        }
      }
    }

    .members-content,
    .devices-content,
    .events-content {
      .members-header,
      .devices-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h3 {
          margin: 0;
        }
      }

      .events-filter {
        margin-bottom: 16px;
        padding: 16px;
        background: #fafafa;
        border-radius: 6px;
      }
    }

    .settings-content {
      max-width: 600px;

      .danger-zone {
        padding: 16px;
        border: 1px solid #ff4d4f;
        border-radius: 6px;
        background: #fff2f0;

        h4 {
          color: #ff4d4f;
          margin-bottom: 12px;
        }
      }
    }
  }

  .invite-content {
    .invite-code-section {
      h4 {
        margin-bottom: 12px;
      }

      .invite-code {
        margin-bottom: 12px;
      }

      .invite-tip {
        color: #8c8c8c;
        font-size: 12px;
        margin: 0;
      }
    }
  }
}

:deep(.ant-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.ant-tabs-card .ant-tabs-tab) {
  border-radius: 6px 6px 0 0;
}

.text-xs {
  font-size: 12px;
}

.text-gray-500 {
  color: #8c8c8c;
}
</style>