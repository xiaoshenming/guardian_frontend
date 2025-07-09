<script lang="ts" setup>
import type { AlertApi } from '#/api/core/alert';
import type { CircleApi } from '#/api/core/circle';
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, ref, reactive, computed, h } from 'vue';
import {
  Button,
  Card,
  Table,
  Modal,
  Space,
  Popconfirm,
  Tag,
  message,
  Tooltip,
  Empty,
  Spin,
  Switch,
  Select,
  Badge,
  Statistic,
  Row,
  Col
} from 'ant-design-vue';
import {
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  WarningOutlined,
  FireOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  getAlertsApi,
  getAlertStatsApi,
  getCircleAlertsApi,
  updateAlertStatusApi,
  deleteAlertApi
} from '#/api/core/alert';
import { getCircleListApi } from '#/api/core/circle';

const userStore = useUserStore();

// 响应式数据
const state = reactive({
  alerts: [] as AlertApi.AlertInfo[],
  circles: [] as CircleApi.CircleInfo[],
  stats: {
    total: 0,
    pending: 0,
    acknowledged: 0,
    ignored: 0,
    today: 0
  } as AlertApi.AlertStats,
  loading: false,
  refreshing: false,
  selectedRowKeys: [] as number[],
  safeGuardEnabled: true, // 安全守护开关，默认开启
  selectedCircleId: null as number | string | null, // 当前选中的圈子ID
  statusFilter: 'all' as string, // 状态筛选
  pagination: {
    current: 1,
    pageSize: 20,
    total: 0
  }
});

// 模态框状态
const modalState = reactive({
  visible: false,
  currentAlert: null as AlertApi.AlertInfo | null
});

// 计算属性
const isAdmin = computed(() => {
  return userStore.userInfo?.role === 2;
});

const currentUserId = computed(() => {
  return Number(userStore.userInfo?.id) || 0;
});

// 计算可删除的项目数量
const canDeleteCount = computed(() => {
  return isAdmin.value && !state.safeGuardEnabled ? state.selectedRowKeys.length : 0;
});

// 告警级别标签
const getAlertLevelTag = (level: number) => {
  const levelMap: Record<number, { color: string; text: string; icon: any }> = {
    1: { color: 'blue', text: '低', icon: h(InfoCircleOutlined) },
    2: { color: 'orange', text: '中', icon: h(WarningOutlined) },
    3: { color: 'red', text: '高', icon: h(ExclamationCircleOutlined) },
    4: { color: 'purple', text: '紧急', icon: h(FireOutlined) }
  };
  return levelMap[level] || { color: 'default', text: '未知', icon: h(InfoCircleOutlined) };
};

// 告警状态标签
const getAlertStatusTag = (status: number) => {
  const statusMap: Record<number, { color: string; text: string; icon: any }> = {
    1: { color: 'red', text: '待处理', icon: h(ClockCircleOutlined) },
    2: { color: 'green', text: '已处理', icon: h(CheckCircleOutlined) },
    3: { color: 'gray', text: '已忽略', icon: h(StopOutlined) }
  };
  return statusMap[status] || { color: 'default', text: '未知', icon: h(InfoCircleOutlined) };
};

// 表格列定义
const columns = computed<TableColumnsType>(() => {
  const baseColumns: TableColumnsType = [
    {
      title: '告警时间',
      dataIndex: 'alert_time',
      key: 'alert_time',
      width: 180,
      sorter: (a: AlertApi.AlertInfo, b: AlertApi.AlertInfo) => 
        new Date(a.alert_time).getTime() - new Date(b.alert_time).getTime(),
      customRender: ({ text }) => {
        return h('div', { class: 'flex items-center space-x-2' }, [
          h(ClockCircleOutlined, { class: 'text-gray-400' }),
          h('span', new Date(text).toLocaleString('zh-CN'))
        ]);
      }
    },
    {
      title: '设备名称',
      dataIndex: 'device_name',
      key: 'device_name',
      width: 150,
      ellipsis: true,
      customRender: ({ text }) => text || '未知设备'
    },
    {
      title: '告警类型',
      dataIndex: 'alert_type',
      key: 'alert_type',
      width: 120,
      filters: [
        { text: '设备离线', value: 'device_offline' },
        { text: '传感器异常', value: 'sensor_error' },
        { text: '电量不足', value: 'low_battery' },
        { text: '网络异常', value: 'network_error' },
        { text: '其他', value: 'other' }
      ],
      onFilter: (value: string, record: AlertApi.AlertInfo) => record.alert_type === value,
      customRender: ({ text }) => {
        const typeMap: Record<string, string> = {
          'device_offline': '设备离线',
          'sensor_error': '传感器异常',
          'low_battery': '电量不足',
          'network_error': '网络异常',
          'other': '其他'
        };
        return typeMap[text] || text;
      }
    },
    {
      title: '告警级别',
      dataIndex: 'alert_level',
      key: 'alert_level',
      width: 100,
      align: 'center',
      filters: [
        { text: '低', value: 1 },
        { text: '中', value: 2 },
        { text: '高', value: 3 },
        { text: '紧急', value: 4 }
      ],
      onFilter: (value: number, record: AlertApi.AlertInfo) => record.alert_level === value,
      customRender: ({ text }) => {
        const levelInfo = getAlertLevelTag(text);
        return h(Badge, {
          status: text >= 3 ? 'error' : text >= 2 ? 'warning' : 'processing',
          text: h('span', { class: 'flex items-center space-x-1' }, [
            levelInfo.icon,
            h('span', levelInfo.text)
          ])
        });
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      filters: [
        { text: '待处理', value: 1 },
        { text: '已处理', value: 2 },
        { text: '已忽略', value: 3 }
      ],
      onFilter: (value: number, record: AlertApi.AlertInfo) => record.status === value,
      customRender: ({ text }) => {
        const statusInfo = getAlertStatusTag(text);
        return h(Tag, { color: statusInfo.color }, [
          statusInfo.icon,
          h('span', { class: 'ml-1' }, statusInfo.text)
        ]);
      }
    },
    {
      title: '所属圈子',
      dataIndex: 'circle_name',
      key: 'circle_name',
      width: 150,
      ellipsis: true,
      customRender: ({ record }) => {
        const circle = state.circles.find(c => c.id === record.circle_id);
        return circle?.circle_name || '未知圈子';
      }
    },
    {
      title: '告警消息',
      dataIndex: 'alert_message',
      key: 'alert_message',
      width: 200,
      ellipsis: true
    },
    {
      title: '处理人',
      dataIndex: 'handler_name',
      key: 'handler_name',
      width: 120,
      customRender: ({ text, record }) => {
        if (record.status === 1) return '待处理';
        return text || '未知';
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      customRender: ({ record }) => {
        const buttons = [
          h(Tooltip, { title: '查看详情' }, {
            default: () => h(Button, {
              type: 'text',
              size: 'small',
              icon: h(EyeOutlined),
              onClick: () => handleView(record)
            })
          })
        ];
        
        // 状态操作按钮
        if (record.status === 1) {
          buttons.push(
            h(Tooltip, { title: '标记为已处理' }, {
              default: () => h(Button, {
                type: 'text',
                size: 'small',
                icon: h(CheckCircleOutlined),
                onClick: () => handleUpdateStatus(record.id, 2)
              })
            }),
            h(Tooltip, { title: '忽略此告警' }, {
              default: () => h(Button, {
                type: 'text',
                size: 'small',
                icon: h(StopOutlined),
                onClick: () => handleUpdateStatus(record.id, 3)
              })
            })
          );
        }
        
        // 只有管理员可以删除告警
        if (isAdmin.value) {
          const deleteTooltip = state.safeGuardEnabled 
            ? '请关闭安全守护后操作' 
            : '删除告警记录';
            
          buttons.push(
            h(Popconfirm, {
              title: '确定要删除这条告警记录吗？',
              description: '删除后无法恢复，请谨慎操作。',
              onConfirm: () => handleDelete(record.id),
              okText: '确定',
              cancelText: '取消',
              okType: 'danger',
              disabled: state.safeGuardEnabled
            }, {
              default: () => h(Tooltip, { title: deleteTooltip }, {
                default: () => h(Button, {
                  type: 'text',
                  size: 'small',
                  danger: true,
                  disabled: state.safeGuardEnabled,
                  icon: h(DeleteOutlined)
                })
              })
            })
          );
        }
        
        return h(Space, { size: 'small' }, buttons);
      }
    }
  ];

  return baseColumns;
});

// 获取守护圈列表
const fetchCircles = async () => {
  try {
    const result = await getCircleListApi();
    let circles: CircleApi.CircleInfo[] = [];
    if (result?.data) {
      circles = Array.isArray(result.data) ? result.data : result;
    } else if (Array.isArray(result)) {
      circles = result;
    }
    state.circles = circles;
  } catch (error) {
    console.error('获取守护圈列表失败:', error);
    message.error('获取守护圈列表失败');
    state.circles = [];
  }
};

// 获取告警统计
const fetchStats = async () => {
  try {
    const result = await getAlertStatsApi();
    if (result?.data) {
      state.stats = result.data;
    }
  } catch (error) {
    console.error('获取告警统计失败:', error);
  }
};

// 获取告警列表
const fetchAlerts = async (page: number = state.pagination.current, pageSize: number = state.pagination.pageSize) => {
  try {
    state.loading = true;
    
    let result;
    const statusParam = getStatusParam(state.statusFilter);
    
    if (state.selectedCircleId === 'all' || !state.selectedCircleId) {
      // 获取所有告警
      result = await getAlertsApi({
        status: statusParam === 'all' ? undefined : statusParam,
        page,
        limit: pageSize,
        circleId: state.selectedCircleId === 'all' ? undefined : state.selectedCircleId
      });
    } else {
      // 获取特定圈子的告警
      result = await getCircleAlertsApi(state.selectedCircleId, {
        status: statusParam === 'all' ? undefined : statusParam,
        page,
        limit: pageSize
      });
    }
    
    const responseData = result?.data || result;
    if (responseData) {
      state.alerts = responseData.alerts || [];
      state.pagination.total = responseData.total || 0;
      state.pagination.current = responseData.page || page;
      state.pagination.pageSize = responseData.limit || pageSize;
    } else {
      state.alerts = [];
      state.pagination.total = 0;
    }

    if (import.meta.env.DEV) {
      console.log('✅ 告警列表获取成功:', state.alerts);
    }
  } catch (error) {
    console.error('获取告警列表失败:', error);
    message.error('获取告警列表失败，请稍后重试');
    state.alerts = [];
    state.pagination.total = 0;
  } finally {
    state.loading = false;
  }
};

// 刷新数据
const refreshData = async () => {
  if (state.refreshing) return;

  try {
    state.refreshing = true;
    await Promise.all([
      fetchCircles(),
      fetchStats(),
      fetchAlerts()
    ]);
    message.success('数据刷新成功');
  } catch (error) {
    message.error('数据刷新失败');
  } finally {
    state.refreshing = false;
  }
};

// 圈子选择变化
const handleCircleChange = async (circleId: number | string | null) => {
  state.selectedCircleId = circleId;
  state.pagination.current = 1; // 重置到第一页
  await fetchAlerts(1);
};

// 状态筛选变化
const handleStatusFilterChange = async (status: string) => {
  state.statusFilter = status;
  state.pagination.current = 1; // 重置到第一页
  await fetchAlerts(1);
};

// 状态筛选映射
const getStatusParam = (filter: string) => {
  const statusMap: Record<string, string> = {
    'all': 'all',
    'pending': 'pending',
    'acknowledged': 'acknowledged', 
    'ignored': 'all' // 后端暂时没有ignored状态，使用all
  };
  return statusMap[filter] || 'all';
};

// 分页变化
const handleTableChange = async (pagination: any) => {
  await fetchAlerts(pagination.current, pagination.pageSize);
};

// 查看详情
const handleView = (record: AlertApi.AlertInfo) => {
  modalState.currentAlert = record;
  modalState.visible = true;
};

// 更新告警状态
const handleUpdateStatus = async (alertId: number, status: number) => {
  try {
    await updateAlertStatusApi(alertId, { status });
    const statusText = status === 2 ? '已处理' : '已忽略';
    message.success(`告警状态已更新为${statusText}`);
    await fetchAlerts(); // 刷新列表
    await fetchStats(); // 刷新统计
  } catch (error) {
    console.error('更新告警状态失败:', error);
    message.error('更新告警状态失败，请稍后重试');
  }
};

// 删除告警记录
const handleDelete = async (id: number) => {
  try {
    await deleteAlertApi(id);
    message.success('告警记录删除成功');
    await fetchAlerts(); // 刷新列表
    await fetchStats(); // 刷新统计
  } catch (error) {
    console.error('删除告警记录失败:', error);
    message.error('删除告警记录失败，请稍后重试');
  }
};

// 安全守护开关处理
const handleSafeGuardChange = (checked: boolean) => {
  const status = checked ? '开启' : '关闭';
  message.info(`安全守护已${status}`);
  
  if (!checked) {
    message.warning('安全守护已关闭，您现在可以删除告警记录，请谨慎操作！', 3);
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (state.selectedRowKeys.length === 0) {
    message.warning('请选择要删除的告警记录');
    return;
  }

  if (!isAdmin.value || state.safeGuardEnabled) {
    message.warning('没有删除权限，请检查管理员权限和安全守护设置');
    return;
  }

  Modal.confirm({
    title: '批量删除确认',
    content: `确定要删除选中的 ${state.selectedRowKeys.length} 条告警记录吗？`,
    icon: h(ExclamationCircleOutlined),
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        // 并行删除
        await Promise.all(
          state.selectedRowKeys.map(id => deleteAlertApi(id))
        );
        message.success(`成功删除 ${state.selectedRowKeys.length} 条告警记录`);
        state.selectedRowKeys = [];
        await fetchAlerts();
        await fetchStats();
      } catch (error) {
        console.error('批量删除失败:', error);
        message.error('批量删除失败，请稍后重试');
      }
    }
  });
};

// 表格行选择
const rowSelection = computed(() => ({
  selectedRowKeys: state.selectedRowKeys,
  onChange: (selectedRowKeys: number[]) => {
    state.selectedRowKeys = selectedRowKeys;
  },
  getCheckboxProps: (record: AlertApi.AlertInfo) => {
    const canDelete = isAdmin.value && !state.safeGuardEnabled;
    
    return {
      disabled: !canDelete,
      name: `alert_${record.id}`
    };
  }
}));

// 组件挂载时获取数据
onMounted(async () => {
  await Promise.all([
    fetchCircles(),
    fetchStats()
  ]);
});
</script>

<template>
  <Page
    description="查看和管理系统告警信息，及时处理设备异常和安全事件"
    title="告警管理"
  >
    <div class="p-5">
      <!-- 统计卡片 -->
      <Row :gutter="16" class="mb-5">
        <Col :span="6">
          <Card>
            <Statistic
              title="总告警数"
              :value="state.stats.total"
              :value-style="{ color: '#1890ff' }"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="待处理"
              :value="state.stats.pending"
              :value-style="{ color: '#f5222d' }"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="已处理"
              :value="state.stats.acknowledged"
              :value-style="{ color: '#52c41a' }"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="今日新增"
              :value="state.stats.today"
              :value-style="{ color: '#fa8c16' }"
            />
          </Card>
        </Col>
      </Row>

      <!-- 操作栏 -->
      <Card class="mb-5">
        <div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div class="flex flex-wrap items-center gap-3">
            <Button
              :loading="state.refreshing"
              @click="refreshData"
            >
              <template #icon><ReloadOutlined /></template>
              刷新
            </Button>

            <Button
              v-if="isAdmin && state.selectedRowKeys.length > 0"
              danger
              :disabled="canDeleteCount === 0"
              @click="handleBatchDelete"
            >
              <template #icon><DeleteOutlined /></template>
              批量删除 ({{ canDeleteCount }}/{{ state.selectedRowKeys.length }})
            </Button>

            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium">选择圈子：</span>
              <Select
                v-model:value="state.selectedCircleId"
                placeholder="请选择守护圈"
                style="width: 200px"
                allow-clear
                @change="handleCircleChange"
              >
                <Select.Option value="all">全部圈子</Select.Option>
                <Select.Option
                  v-for="circle in state.circles"
                  :key="circle.id"
                  :value="circle.id"
                >
                  {{ circle.circle_name }}
                </Select.Option>
              </Select>
            </div>

            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium">状态筛选：</span>
              <Select
                v-model:value="state.statusFilter"
                style="width: 120px"
                @change="handleStatusFilterChange"
              >
                <Select.Option value="all">全部</Select.Option>
                <Select.Option value="pending">待处理</Select.Option>
                <Select.Option value="acknowledged">已处理</Select.Option>
              </Select>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <div v-if="isAdmin" class="flex items-center space-x-3">
              <Tag color="gold">
                <SettingOutlined class="mr-1" />
                管理员模式
              </Tag>
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium">安全守护：</span>
                <Switch 
                  v-model:checked="state.safeGuardEnabled"
                  size="small"
                  :checked-children="'开启'"
                  :un-checked-children="'关闭'"
                  @change="handleSafeGuardChange"
                />
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-500">
                共 {{ state.pagination.total }} 条告警记录
                <span v-if="state.selectedCircleId === 'all'">
                  (全部圈子)
                </span>
                <span v-else-if="state.selectedCircleId">
                  ({{ state.circles.find(c => c.id === state.selectedCircleId)?.circle_name }})
                </span>
              </div>
              <div v-if="isAdmin && !state.safeGuardEnabled" class="text-xs text-orange-600 mt-1">
                ⚠️ 安全守护已关闭，可删除告警记录
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- 数据表格 -->
      <Card>
        <Spin :spinning="state.loading">
          <Table
            :columns="columns"
            :data-source="state.alerts"
            :row-key="record => record.id"
            :row-selection="isAdmin ? rowSelection : undefined"
            :pagination="{
              current: state.pagination.current,
              pageSize: state.pagination.pageSize,
              total: state.pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }"
            :scroll="{ x: 1400 }"
            size="middle"
            @change="handleTableChange"
          >
            <template #emptyText>
              <Empty
                :description="state.selectedCircleId ? '该圈子暂无告警记录' : '请先选择守护圈'"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
            </template>
          </Table>
        </Spin>
      </Card>
    </div>

    <!-- 告警详情模态框 -->
    <Modal
      v-model:open="modalState.visible"
      title="告警详情"
      :footer="null"
      width="700px"
    >
      <div v-if="modalState.currentAlert" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">告警ID</label>
            <div class="text-sm text-gray-900">{{ modalState.currentAlert.id }}</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">设备名称</label>
            <div class="text-sm text-gray-900">{{ modalState.currentAlert.device_name || '未知设备' }}</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">告警类型</label>
            <div class="text-sm text-gray-900">{{ modalState.currentAlert.alert_type }}</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">告警级别</label>
            <Tag :color="getAlertLevelTag(modalState.currentAlert.alert_level).color">
              {{ getAlertLevelTag(modalState.currentAlert.alert_level).text }}
            </Tag>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">告警状态</label>
            <Tag :color="getAlertStatusTag(modalState.currentAlert.status).color">
              {{ getAlertStatusTag(modalState.currentAlert.status).text }}
            </Tag>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">告警时间</label>
            <div class="text-sm text-gray-900">
              {{ new Date(modalState.currentAlert.alert_time).toLocaleString('zh-CN') }}
            </div>
          </div>
          <div v-if="modalState.currentAlert.handled_time">
            <label class="block text-sm font-medium text-gray-700 mb-1">处理时间</label>
            <div class="text-sm text-gray-900">
              {{ new Date(modalState.currentAlert.handled_time).toLocaleString('zh-CN') }}
            </div>
          </div>
          <div v-if="modalState.currentAlert.handler_name">
            <label class="block text-sm font-medium text-gray-700 mb-1">处理人</label>
            <div class="text-sm text-gray-900">{{ modalState.currentAlert.handler_name }}</div>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">告警消息</label>
          <div class="bg-gray-50 p-3 rounded border">
            <div class="text-sm text-gray-800">{{ modalState.currentAlert.alert_message }}</div>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">告警数据</label>
          <div class="bg-gray-50 p-3 rounded border">
            <pre class="text-xs text-gray-800 whitespace-pre-wrap">{{ 
              (() => {
                try {
                  return JSON.stringify(JSON.parse(modalState.currentAlert.alert_data), null, 2);
                } catch {
                  return modalState.currentAlert.alert_data;
                }
              })()
            }}</pre>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div v-if="modalState.currentAlert.status === 1" class="flex justify-end space-x-2 pt-4 border-t">
          <Button 
            type="primary" 
            @click="handleUpdateStatus(modalState.currentAlert.id, 2); modalState.visible = false"
          >
            <template #icon><CheckCircleOutlined /></template>
            标记为已处理
          </Button>
          <Button 
            @click="handleUpdateStatus(modalState.currentAlert.id, 3); modalState.visible = false"
          >
            <template #icon><StopOutlined /></template>
            忽略此告警
          </Button>
        </div>
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.ant-table-tbody > tr > td {
  padding: 12px 16px;
}

.ant-table-thead > tr > th {
  background-color: #fafafa;
  font-weight: 600;
}

.ant-btn + .ant-btn {
  margin-left: 8px;
}

.ant-tag {
  margin: 0;
}

pre {
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
}

.ant-statistic-title {
  font-size: 14px;
  color: #666;
}

.ant-statistic-content {
  font-size: 24px;
  font-weight: 600;
}
</style>
