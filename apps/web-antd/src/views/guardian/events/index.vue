<script lang="ts" setup>
import type { EventApi } from '#/api/core/event';
import type { CircleApi } from '#/api/core/circle';
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, ref, reactive, computed, h } from 'vue';
import { getEventTypeInfo, getEventTypeFilters } from '#/utils/eventTypeMapping';
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
  Badge
} from 'ant-design-vue';
import {
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  getCircleEventsApi,
  deleteEventApi
} from '#/api/core/event';
import { getCircleListApi } from '#/api/core/circle';

const userStore = useUserStore();

// 响应式数据
const state = reactive({
  events: [] as EventApi.EventInfo[],
  circles: [] as CircleApi.CircleInfo[],
  loading: false,
  refreshing: false,
  selectedRowKeys: [] as number[],
  safeGuardEnabled: true, // 安全守护开关，默认开启
  selectedCircleId: null as number | string | null, // 当前选中的圈子ID
  pagination: {
    current: 1,
    pageSize: 20,
    total: 0
  }
});

// 模态框状态
const modalState = reactive({
  visible: false,
  currentEvent: null as EventApi.EventInfo | null
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

// 事件类型标签
const getEventTypeTag = (eventType: string) => {
  const typeInfo = getEventTypeInfo(eventType);
  return {
    color: typeInfo.color,
    text: typeInfo.text
  };
};

// 表格列定义
const columns = computed<TableColumnsType>(() => {
  const baseColumns: TableColumnsType = [
    {
      title: '事件时间',
      dataIndex: 'event_time',
      key: 'event_time',
      width: 180,
      sorter: (a: EventApi.EventInfo, b: EventApi.EventInfo) => 
        new Date(a.event_time).getTime() - new Date(b.event_time).getTime(),
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
      title: '事件类型',
      dataIndex: 'event_type',
      key: 'event_type',
      width: 120,
      filters: getEventTypeFilters(),
      onFilter: (value: string, record: EventApi.EventInfo) => {
        const typeInfo = getEventTypeInfo(record.event_type);
        return typeInfo.category === value;
      },
      customRender: ({ text }) => {
        const typeInfo = getEventTypeTag(text);
        return h(Tag, { color: typeInfo.color }, { default: () => typeInfo.text });
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
      title: '事件数据',
      dataIndex: 'event_data',
      key: 'event_data',
      width: 200,
      ellipsis: true,
      customRender: ({ text, record }) => {
        try {
          // 如果text是字符串，尝试解析；如果是对象，直接使用
          const data = typeof text === 'string' ? JSON.parse(text) : text;
          const preview = JSON.stringify(data).substring(0, 50);
          return h('code', { class: 'text-xs bg-gray-100 px-2 py-1 rounded' }, 
            preview + (preview.length >= 50 ? '...' : ''));
        } catch {
          // 如果解析失败，直接显示原始内容
          const content = typeof text === 'string' ? text : JSON.stringify(text);
          return h('code', { class: 'text-xs bg-gray-100 px-2 py-1 rounded' }, 
            content?.substring(0, 50) + (content?.length > 50 ? '...' : ''));
        }
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
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
        
        // 只有管理员可以删除事件日志
        if (isAdmin.value) {
          const deleteTooltip = state.safeGuardEnabled 
            ? '请关闭安全守护后操作' 
            : '删除事件日志';
            
          buttons.push(
            h(Popconfirm, {
              title: '确定要删除这条事件日志吗？',
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

// 获取事件列表
const fetchEvents = async (page: number = state.pagination.current, pageSize: number = state.pagination.pageSize) => {
  if (!state.selectedCircleId) {
    state.events = [];
    state.pagination.total = 0;
    return;
  }

  try {
    state.loading = true;
    
    if (state.selectedCircleId === 'all') {
      // 获取所有圈子的事件
      const allEvents: EventApi.EventInfo[] = [];
      let totalCount = 0;
      
      for (const circle of state.circles) {
        try {
          const result = await getCircleEventsApi(circle.id, 1, 1000); // 获取大量数据
          const responseData = result?.data || result;
          if (responseData) {
            const events = responseData.events || [];
            allEvents.push(...events);
            totalCount += responseData.total || 0;
          }
        } catch (error) {
          console.warn(`获取圈子 ${circle.circle_name} 的事件失败:`, error);
        }
      }
      
      // 按时间排序
      allEvents.sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime());
      
      // 手动分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      state.events = allEvents.slice(startIndex, endIndex);
      state.pagination.total = allEvents.length;
      state.pagination.current = page;
      state.pagination.pageSize = pageSize;
    } else {
      // 获取特定圈子的事件
      const result = await getCircleEventsApi(state.selectedCircleId, page, pageSize);
      
      const responseData = result?.data || result;
      if (responseData) {
        state.events = responseData.events || [];
        state.pagination.total = responseData.total || 0;
        state.pagination.current = page;
        state.pagination.pageSize = pageSize;
      } else {
        state.events = [];
        state.pagination.total = 0;
      }
    }

    if (import.meta.env.DEV) {
      console.log('✅ 事件列表获取成功:', state.events);
    }
  } catch (error) {
    console.error('获取事件列表失败:', error);
    message.error('获取事件列表失败，请稍后重试');
    state.events = [];
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
    await fetchCircles();
    await fetchEvents();
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
  await fetchEvents(1);
};

// 分页变化
const handleTableChange = async (pagination: any) => {
  await fetchEvents(pagination.current, pagination.pageSize);
};

// 查看详情
const handleView = (record: EventApi.EventInfo) => {
  modalState.currentEvent = record;
  modalState.visible = true;
};

// 删除事件日志
const handleDelete = async (id: number) => {
  try {
    await deleteEventApi(id);
    message.success('事件日志删除成功');
    await fetchEvents(); // 刷新列表
  } catch (error) {
    console.error('删除事件日志失败:', error);
    message.error('删除事件日志失败，请稍后重试');
  }
};

// 安全守护开关处理
const handleSafeGuardChange = (checked: boolean) => {
  const status = checked ? '开启' : '关闭';
  message.info(`安全守护已${status}`);
  
  if (!checked) {
    message.warning('安全守护已关闭，您现在可以删除事件日志，请谨慎操作！', 3);
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (state.selectedRowKeys.length === 0) {
    message.warning('请选择要删除的事件日志');
    return;
  }

  if (!isAdmin.value || state.safeGuardEnabled) {
    message.warning('没有删除权限，请检查管理员权限和安全守护设置');
    return;
  }

  Modal.confirm({
    title: '批量删除确认',
    content: `确定要删除选中的 ${state.selectedRowKeys.length} 条事件日志吗？`,
    icon: h(ExclamationCircleOutlined),
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        // 并行删除
        await Promise.all(
          state.selectedRowKeys.map(id => deleteEventApi(id))
        );
        message.success(`成功删除 ${state.selectedRowKeys.length} 条事件日志`);
        state.selectedRowKeys = [];
        await fetchEvents();
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
  getCheckboxProps: (record: EventApi.EventInfo) => {
    const canDelete = isAdmin.value && !state.safeGuardEnabled;
    
    return {
      disabled: !canDelete,
      name: `event_${record.id}`
    };
  }
}));

// 组件挂载时获取数据
onMounted(async () => {
  await fetchCircles();
  // 不默认选择圈子，需要用户手动选择
});
</script>

<template>
  <Page
    description="查看和管理系统事件日志，包括设备状态变更、告警信息等"
    title="事件记录"
  >
    <div class="p-5">
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
                 共 {{ state.pagination.total }} 条事件记录
                 <span v-if="state.selectedCircleId === 'all'">
                   (全部圈子)
                 </span>
                 <span v-else-if="state.selectedCircleId">
                   ({{ state.circles.find(c => c.id === state.selectedCircleId)?.circle_name }})
                 </span>
               </div>
              <div v-if="isAdmin && !state.safeGuardEnabled" class="text-xs text-orange-600 mt-1">
                ⚠️ 安全守护已关闭，可删除事件日志
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
            :data-source="state.events"
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
            :scroll="{ x: 1200 }"
            size="middle"
            @change="handleTableChange"
          >
            <template #emptyText>
              <Empty
                :description="state.selectedCircleId ? '该圈子暂无事件记录' : '请先选择守护圈'"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
            </template>
          </Table>
        </Spin>
      </Card>
    </div>

    <!-- 事件详情模态框 -->
    <Modal
      v-model:open="modalState.visible"
      title="事件详情"
      :footer="null"
      width="600px"
    >
      <div v-if="modalState.currentEvent" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">事件ID</label>
            <div class="text-sm text-gray-900">{{ modalState.currentEvent.id }}</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">设备名称</label>
            <div class="text-sm text-gray-900">{{ modalState.currentEvent.device_name || '未知设备' }}</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">事件类型</label>
            <Tag :color="getEventTypeTag(modalState.currentEvent.event_type).color">
              {{ getEventTypeTag(modalState.currentEvent.event_type).text }}
            </Tag>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">事件时间</label>
            <div class="text-sm text-gray-900">
              {{ new Date(modalState.currentEvent.event_time).toLocaleString('zh-CN') }}
            </div>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">事件数据</label>
          <div class="bg-gray-50 p-3 rounded border">
            <pre class="text-xs text-gray-800 whitespace-pre-wrap">{{ 
              (() => {
                try {
                  const data = typeof modalState.currentEvent.event_data === 'string' 
                    ? JSON.parse(modalState.currentEvent.event_data) 
                    : modalState.currentEvent.event_data;
                  return JSON.stringify(data, null, 2);
                } catch {
                  return typeof modalState.currentEvent.event_data === 'string' 
                    ? modalState.currentEvent.event_data 
                    : JSON.stringify(modalState.currentEvent.event_data, null, 2);
                }
              })()
            }}</pre>
          </div>
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
</style>
