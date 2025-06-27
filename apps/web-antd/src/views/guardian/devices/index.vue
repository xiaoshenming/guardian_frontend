<template>
  <div class="guardian-devices">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>设备管理</h1>
          <p>管理您的智能设备，实时监控设备状态</p>
        </div>
        <div class="header-actions">
          <a-space>
            <a-button @click="refreshDevices">
              <template #icon><ReloadOutlined /></template>
              刷新
            </a-button>
            <a-button type="primary" @click="showBindModal = true">
              <template #icon><PlusOutlined /></template>
              绑定设备
            </a-button>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 设备统计 -->
    <div class="stats-section">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="8">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="设备总数"
              :value="deviceStats.total"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix><MobileOutlined /></template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="8">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="在线设备"
              :value="deviceStats.online"
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix><WifiOutlined /></template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="8">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="离线设备"
              :value="deviceStats.offline"
              :value-style="{ color: '#ff4d4f' }"
            >
              <template #prefix><DisconnectOutlined /></template>
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
              placeholder="搜索设备名称或序列号"
              allow-clear
              @search="handleSearch"
            />
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-select
              v-model:value="statusFilter"
              placeholder="设备状态"
              style="width: 100%"
              allow-clear
            >
              <a-select-option value="online">在线</a-select-option>
              <a-select-option value="offline">离线</a-select-option>
              <a-select-option value="fault">故障</a-select-option>
            </a-select>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-select
              v-model:value="circleFilter"
              placeholder="所属守护圈"
              style="width: 100%"
              allow-clear
            >
              <a-select-option
                v-for="circle in circles"
                :key="circle.id"
                :value="circle.id"
              >
                {{ circle.name }}
              </a-select-option>
            </a-select>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-space>
              <a-button @click="handleReset">重置</a-button>
            <a-button type="primary" @click="fetchDevices">搜索</a-button>
            </a-space>
          </a-col>
        </a-row>
      </a-card>
    </div>

    <!-- 设备列表 -->
    <div class="devices-section">
      <a-card :bordered="false">
        <a-table
          :columns="deviceColumns"
          :data-source="devices"
          :loading="loading"
          :pagination="pagination"
          row-key="id"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'device'">
              <div class="device-info">
                <div class="device-avatar">
                  <a-avatar :style="getDeviceAvatarStyle(record.type)" shape="square">
                    <component :is="getDeviceIcon(record.type)" />
                  </a-avatar>
                </div>
                <div class="device-details">
                  <div class="device-name">{{ record.name }}</div>
                  <div class="device-sn">{{ record.sn }}</div>
                  <div class="device-model">{{ record.model }}</div>
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'status'">
              <div class="status-info">
                <a-tag :color="getStatusColor(record.status)">
                  <template #icon>
                    <component :is="getStatusIcon(record.status)" />
                  </template>
                  {{ getStatusText(record.status) }}
                </a-tag>
                <div class="status-time">{{ formatTime(record.lastHeartbeat) }}</div>
              </div>
            </template>
            <template v-else-if="column.key === 'battery'">
              <div class="battery-info">
                <a-progress
                  :percent="record.batteryLevel"
                  :status="getBatteryStatus(record.batteryLevel)"
                  size="small"
                  :show-info="false"
                />
                <span class="battery-text">{{ record.batteryLevel }}%</span>
              </div>
            </template>
            <template v-else-if="column.key === 'signal'">
              <div class="signal-info">
                <a-progress
                  :percent="record.signalStrength"
                  size="small"
                  :show-info="false"
                  stroke-color="#52c41a"
                />
                <span class="signal-text">{{ record.signalStrength }}%</span>
              </div>
            </template>
            <template v-else-if="column.key === 'circle'">
              <a-tag v-if="record.circleName" color="blue">
                {{ record.circleName }}
              </a-tag>
              <span v-else class="text-gray-500">未分配</span>
            </template>
            <template v-else-if="column.key === 'boundUser'">
              <div v-if="record.boundUserName" class="user-info">
                <a-avatar :src="record.boundUserAvatar" size="small">
                  {{ record.boundUserName?.charAt(0)?.toUpperCase() }}
                </a-avatar>
                <span class="user-name">{{ record.boundUserName }}</span>
              </div>
              <span v-else class="text-gray-500">未绑定</span>
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button type="link" size="small" @click="viewDevice(record)">
                  查看
                </a-button>
                <a-button type="link" size="small" @click="configDevice(record)">
                  配置
                </a-button>
                <a-dropdown>
                  <a-button type="link" size="small">
                    更多 <DownOutlined />
                  </a-button>
                  <template #overlay>
                    <a-menu @click="({ key }) => handleDeviceAction(key, record)">
                      <a-menu-item key="reboot">
                        <ReloadOutlined />
                        重启设备
                      </a-menu-item>
                      <a-menu-item key="update">
                        <UploadOutlined />
                        更新固件
                      </a-menu-item>
                      <a-menu-item key="logs">
                        <FileTextOutlined />
                        查看日志
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
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 绑定设备弹窗 -->
    <a-modal
      v-model:open="showBindModal"
      title="绑定设备"
      :confirm-loading="bindLoading"
      width="600px"
      @ok="handleBind"
    >
      <a-form
        ref="bindFormRef"
        :model="bindForm"
        :rules="bindRules"
        layout="vertical"
      >
        <a-form-item label="设备序列号" name="sn">
          <a-input
            v-model:value="bindForm.sn"
            placeholder="请输入设备序列号"
            allow-clear
          >
            <template #suffix>
              <a-button type="link" size="small" @click="scanQRCode">
                <QrcodeOutlined />
                扫码
              </a-button>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="设备名称" name="name">
          <a-input v-model:value="bindForm.name" placeholder="请输入设备名称" />
        </a-form-item>
        <a-form-item label="所属守护圈" name="circleId">
          <a-select
            v-model:value="bindForm.circleId"
            placeholder="请选择守护圈"
            allow-clear
          >
            <a-select-option
              v-for="circle in circles"
              :key="circle.id"
              :value="circle.id"
            >
              {{ circle.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="绑定用户" name="boundUserId">
          <a-select
            v-model:value="bindForm.boundUserId"
            placeholder="请选择绑定用户（可选）"
            allow-clear
          >
            <a-select-option
              v-for="user in circleMembers"
              :key="user.id"
              :value="user.id"
            >
              {{ user.username }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 设备配置弹窗 -->
    <a-modal
      v-model:open="showConfigModal"
      :title="`配置设备 - ${currentDevice?.name}`"
      :confirm-loading="configLoading"
      width="800px"
      @ok="handleUpdateConfig"
    >
      <a-form
        ref="configFormRef"
        :model="configForm"
        layout="vertical"
      >
        <a-row :gutter="[16, 16]">
          <a-col :span="12">
            <a-form-item label="心跳间隔（秒）">
              <a-input-number
                v-model:value="configForm.heartbeatInterval"
                :min="10"
                :max="300"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="数据上报间隔（秒）">
              <a-input-number
                v-model:value="configForm.reportInterval"
                :min="5"
                :max="60"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="跌倒检测灵敏度">
              <a-select v-model:value="configForm.fallSensitivity" style="width: 100%">
                <a-select-option value="low">低</a-select-option>
                <a-select-option value="medium">中</a-select-option>
                <a-select-option value="high">高</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="手势识别">
              <a-switch v-model:checked="configForm.gestureEnabled" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
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
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import {
  PlusOutlined,
  ReloadOutlined,
  MobileOutlined,
  WifiOutlined,
  DisconnectOutlined,
  DownOutlined,
  UploadOutlined,
  FileTextOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  BatteryChargeOutlined,
  SignalFilled,
} from '@ant-design/icons-vue';
import {
  getDeviceList,
  bindDevice,
  updateDeviceConfig,
  rebootDevice,
  unbindDevice,
  getCircleList,
  getCircleMembers,
  type Device,
  type Circle,
  type CircleMember,
  type BindDeviceParams,
  type UpdateDeviceConfigParams,
} from '#/api/guardian';

const router = useRouter();

// 响应式数据
const devices = ref<Device[]>([]);
const circles = ref<Circle[]>([]);
const circleMembers = ref<CircleMember[]>([]);
const loading = ref(false);
const searchKeyword = ref('');
const statusFilter = ref<string>();
const circleFilter = ref<string>();

// 设备统计
const deviceStats = computed(() => {
  const total = devices.value.length;
  const online = devices.value.filter(d => d.status === 'online').length;
  const offline = devices.value.filter(d => d.status === 'offline').length;
  return { total, online, offline };
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

// 绑定设备
const showBindModal = ref(false);
const bindLoading = ref(false);
const bindFormRef = ref();
const bindForm = reactive<BindDeviceParams>({
  sn: '',
  name: '',
  circleId: '',
  boundUserId: '',
});

const bindRules = {
  sn: [{ required: true, message: '请输入设备序列号' }],
  name: [{ required: true, message: '请输入设备名称' }],
};

// 设备配置
const showConfigModal = ref(false);
const configLoading = ref(false);
const configFormRef = ref();
const currentDevice = ref<Device>();
const configForm = reactive<UpdateDeviceConfigParams>({
  heartbeatInterval: 60,
  reportInterval: 30,
  fallSensitivity: 'medium',
  gestureEnabled: true,
  emergencyContacts: [],
});

// 表格列定义
const deviceColumns = [
  {
    title: '设备信息',
    key: 'device',
    width: 250,
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
  },
  {
    title: '电量',
    key: 'battery',
    width: 100,
  },
  {
    title: '信号',
    key: 'signal',
    width: 100,
  },
  {
    title: '守护圈',
    key: 'circle',
    width: 120,
  },
  {
    title: '绑定用户',
    key: 'boundUser',
    width: 150,
  },
  {
    title: '固件版本',
    dataIndex: 'firmwareVersion',
    key: 'firmwareVersion',
    width: 120,
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
  },
];

// 获取设备列表
const fetchDevices = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value,
      status: statusFilter.value,
      circleId: circleFilter.value,
    };
    const response = await getDeviceList(params);
    devices.value = response.data.list;
    pagination.total = response.data.total;
  } catch (error) {
    console.error('获取设备列表失败:', error);
    message.error('获取设备列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取守护圈列表
const fetchCircles = async () => {
  try {
    const response = await getCircleList({ page: 1, pageSize: 100 });
    circles.value = response.data.list;
  } catch (error) {
    console.error('获取守护圈列表失败:', error);
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

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchDevices();
};

// 重置
const handleReset = () => {
  searchKeyword.value = '';
  statusFilter.value = undefined;
  circleFilter.value = undefined;
  pagination.current = 1;
  fetchDevices();
};

// 刷新设备
const refreshDevices = () => {
  fetchDevices();
};

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchDevices();
};

// 绑定设备
const handleBind = async () => {
  try {
    await bindFormRef.value.validate();
    bindLoading.value = true;
    
    await bindDevice(bindForm);
    message.success('绑定设备成功');
    showBindModal.value = false;
    
    // 重置表单
    Object.assign(bindForm, {
      sn: '',
      name: '',
      circleId: '',
      boundUserId: '',
    });
    
    // 刷新列表
    fetchDevices();
  } catch (error) {
    console.error('绑定设备失败:', error);
    message.error('绑定设备失败');
  } finally {
    bindLoading.value = false;
  }
};

// 扫描二维码
const scanQRCode = () => {
  // 这里可以实现二维码扫描功能
  message.info('二维码扫描功能开发中');
};

// 查看设备
const viewDevice = (device: Device) => {
  router.push(`/guardian/devices/${device.id}`);
};

// 配置设备
const configDevice = async (device: Device) => {
  currentDevice.value = device;
  
  // 加载设备配置
  Object.assign(configForm, {
    heartbeatInterval: device.config?.heartbeatInterval || 60,
    reportInterval: device.config?.reportInterval || 30,
    fallSensitivity: device.config?.fallSensitivity || 'medium',
    gestureEnabled: device.config?.gestureEnabled ?? true,
    emergencyContacts: device.config?.emergencyContacts || [],
  });
  
  // 加载守护圈成员
  if (device.circleId) {
    await fetchCircleMembers(device.circleId);
  }
  
  showConfigModal.value = true;
};

// 更新设备配置
const handleUpdateConfig = async () => {
  if (!currentDevice.value) return;
  
  configLoading.value = true;
  try {
    await updateDeviceConfig(currentDevice.value.id, configForm);
    message.success('更新设备配置成功');
    showConfigModal.value = false;
    fetchDevices();
  } catch (error) {
    console.error('更新设备配置失败:', error);
    message.error('更新设备配置失败');
  } finally {
    configLoading.value = false;
  }
};

// 设备操作
const handleDeviceAction = async (action: string, device: Device) => {
  switch (action) {
    case 'reboot':
      Modal.confirm({
        title: '确认重启设备？',
        content: '重启设备可能会导致短暂的服务中断',
        onOk: async () => {
          try {
            await rebootDevice(device.id);
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
    case 'logs':
      router.push(`/guardian/devices/${device.id}?tab=logs`);
      break;
    case 'unbind':
      Modal.confirm({
        title: '确认解绑设备？',
        content: '解绑后设备将无法继续提供服务',
        onOk: async () => {
          try {
            await unbindDevice(device.id);
            message.success('解绑设备成功');
            fetchDevices();
          } catch (error) {
            message.error('解绑设备失败');
          }
        },
      });
      break;
  }
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

const formatTime = (time: string) => {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
};

// 生命周期
onMounted(async () => {
  await Promise.all([
    fetchDevices(),
    fetchCircles(),
  ]);
});
</script>

<style scoped lang="less">
.guardian-devices {
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

  .devices-section {
    .device-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .device-avatar {
        flex-shrink: 0;
      }

      .device-details {
        .device-name {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .device-sn {
          font-size: 12px;
          color: #8c8c8c;
          margin-bottom: 2px;
        }

        .device-model {
          font-size: 12px;
          color: #8c8c8c;
        }
      }
    }

    .status-info {
      .status-time {
        font-size: 12px;
        color: #8c8c8c;
        margin-top: 4px;
      }
    }

    .battery-info,
    .signal-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .battery-text,
      .signal-text {
        font-size: 12px;
        color: #8c8c8c;
        min-width: 30px;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .user-name {
        font-size: 12px;
      }
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