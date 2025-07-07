<script lang="ts" setup>
import type { DeviceApi } from '#/api/core/device';
import type { CircleApi } from '#/api/core/circle';
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, ref, reactive, computed, h } from 'vue';
import {
  Button,
  Card,
  Table,
  Modal,
  Form,
  Input,
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
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  ReloadOutlined,
  WifiOutlined,
  DisconnectOutlined,
  MobileOutlined
} from '@ant-design/icons-vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  getCircleDevicesApi,
  getDeviceDetailApi,
  bindDeviceApi,
  updateDeviceApi,
  unbindDeviceApi
} from '#/api/core/device';
import { getCircleListApi } from '#/api/core/circle';

const userStore = useUserStore();

// 响应式数据
const state = reactive({
  devices: [] as DeviceApi.DeviceInfo[],
  circles: [] as CircleApi.CircleInfo[],
  loading: false,
  refreshing: false,
  selectedRowKeys: [] as number[],
  safeGuardEnabled: true, // 安全守护开关，默认开启
  selectedCircleId: null as number | null // 当前选中的圈子ID
});

// 模态框状态
const modalState = reactive({
  visible: false,
  confirmLoading: false,
  mode: 'create' as 'create' | 'edit' | 'view',
  title: '绑定设备',
  currentDevice: null as DeviceApi.DeviceInfo | null
});

// 表单数据
const formState = reactive({
  device_sn: '',
  device_name: '',
  device_model: '',
  circle_id: null as number | null,
  config: '{}'
});

// 表单引用
const formRef = ref();

// 表单验证规则
const formRules = {
  device_sn: [
    { required: true, message: '请输入设备序列号', trigger: 'blur' },
    { min: 6, max: 50, message: '序列号长度应在6-50个字符之间', trigger: 'blur' }
  ],
  device_name: [
    { required: true, message: '请输入设备名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度应在2-50个字符之间', trigger: 'blur' }
  ],
  circle_id: [
    { required: true, message: '请选择守护圈', trigger: 'change' }
  ],
  device_model: [
    { max: 50, message: '设备型号不能超过50个字符', trigger: 'blur' }
  ]
};

// 计算属性
const isAdmin = computed(() => {
  return userStore.userInfo?.role === 2;
});

const currentUserId = computed(() => {
  return Number(userStore.userInfo?.id) || 0;
});

// 计算可删除的项目数量
const canDeleteCount = computed(() => {
  return state.selectedRowKeys.filter(id => {
    const device = state.devices.find(d => d.id === id);
    if (!device) return false;
    
    const isOwner = device.bound_by_uid === currentUserId.value;
    return isOwner || (isAdmin.value && !state.safeGuardEnabled);
  }).length;
});

// 过滤后的设备列表
const filteredDevices = computed(() => {
  if (!state.selectedCircleId) {
    return state.devices;
  }
  return state.devices.filter(device => device.circle_id === state.selectedCircleId);
});

// 设备状态标签
const getDeviceStatusTag = (status: number) => {
  switch (status) {
    case 1:
      return { color: 'green', text: '在线', icon: h(WifiOutlined) };
    case 0:
    default:
      return { color: 'red', text: '离线', icon: h(DisconnectOutlined) };
  }
};

// 表格列定义
const columns = computed<TableColumnsType>(() => {
  const baseColumns: TableColumnsType = [
    {
      title: '设备名称',
      dataIndex: 'device_name',
      key: 'device_name',
      width: 180,
      ellipsis: true
    },
    {
      title: '设备序列号',
      dataIndex: 'device_sn',
      key: 'device_sn',
      width: 160,
      ellipsis: true,
      customRender: ({ text }) => h('code', { class: 'text-xs bg-gray-100 px-2 py-1 rounded' }, text)
    },
    {
      title: '设备型号',
      dataIndex: 'device_model',
      key: 'device_model',
      width: 120,
      ellipsis: true,
      customRender: ({ text }) => text || '未知型号'
    },
    {
      title: '状态',
      dataIndex: 'device_status',
      key: 'device_status',
      width: 100,
      align: 'center',
      customRender: ({ text }) => {
        const statusInfo = getDeviceStatusTag(text);
        return h(Badge, {
          status: text === 1 ? 'processing' : 'error',
          text: h('span', { class: 'flex items-center space-x-1' }, [
            statusInfo.icon,
            h('span', statusInfo.text)
          ])
        });
      }
    },
    {
      title: '固件版本',
      dataIndex: 'firmware_version',
      key: 'firmware_version',
      width: 120,
      customRender: ({ text }) => text || '未知'
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
      title: '绑定者',
      dataIndex: 'bound_by_username',
      key: 'bound_by_username',
      width: 120,
      customRender: ({ record }) => {
        const isOwner = record.bound_by_uid === currentUserId.value;
        return h('div', { class: 'flex items-center space-x-2' }, [
          h('span', record.bound_by_username),
          isOwner ? h(Tag, { color: 'blue' }, '我的') : null
        ]);
      }
    },
    {
      title: '最后心跳',
      dataIndex: 'last_heartbeat',
      key: 'last_heartbeat',
      width: 160,
      customRender: ({ text }) => {
        if (!text) return '从未连接';
        return new Date(text).toLocaleString('zh-CN');
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      customRender: ({ record }) => {
        const isOwner = record.bound_by_uid === currentUserId.value;
        
        // 权限逻辑：
        // 1. 普通用户：只能操作自己绑定的设备
        // 2. 管理员：关闭安全守护后可以操作所有设备，开启时只能操作自己的
        const canEdit = isOwner || (isAdmin.value && !state.safeGuardEnabled);
        const canDelete = isOwner || (isAdmin.value && !state.safeGuardEnabled);

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
        
        if (canEdit) {
          buttons.push(
            h(Tooltip, { title: '编辑' }, {
              default: () => h(Button, {
                type: 'text',
                size: 'small',
                icon: h(EditOutlined),
                onClick: () => handleEdit(record)
              })
            })
          );
        }
        
        if (canDelete) {
          const deleteTooltip = isAdmin.value && state.safeGuardEnabled && !isOwner 
            ? '请关闭安全守护后操作' 
            : '解绑设备';
            
          buttons.push(
            h(Popconfirm, {
              title: '确定要解绑这个设备吗？',
              description: '解绑后设备将从圈子中移除，但设备数据会保留。',
              onConfirm: () => handleDelete(record.id),
              okText: '确定',
              cancelText: '取消',
              okType: 'danger'
            }, {
              default: () => h(Tooltip, { title: deleteTooltip }, {
                default: () => h(Button, {
                  type: 'text',
                  size: 'small',
                  danger: true,
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

// 获取设备列表
const fetchDevices = async () => {
  try {
    state.loading = true;
    
    // 如果选择了特定圈子，获取该圈子的设备
    if (state.selectedCircleId) {
      const result = await getCircleDevicesApi(state.selectedCircleId);
      let devices: DeviceApi.DeviceInfo[] = [];
      if (result?.data) {
        devices = Array.isArray(result.data) ? result.data : result;
      } else if (Array.isArray(result)) {
        devices = result;
      }
      // 为设备添加circle_id信息
      devices = devices.map(device => ({
        ...device,
        circle_id: state.selectedCircleId!
      }));
      state.devices = devices;
    } else {
      // 获取所有圈子的设备
      const allDevices: DeviceApi.DeviceInfo[] = [];
      for (const circle of state.circles) {
        try {
          const result = await getCircleDevicesApi(circle.id);
          let devices: DeviceApi.DeviceInfo[] = [];
          if (result?.data) {
            devices = Array.isArray(result.data) ? result.data : result;
          } else if (Array.isArray(result)) {
            devices = result;
          }
          // 为每个设备添加circle_id信息
          devices = devices.map(device => ({
            ...device,
            circle_id: circle.id
          }));
          allDevices.push(...devices);
        } catch (error) {
          console.warn(`获取圈子 ${circle.circle_name} 的设备失败:`, error);
        }
      }
      state.devices = allDevices;
    }

    if (import.meta.env.DEV) {
      console.log('✅ 设备列表获取成功:', state.devices);
      console.log('🔍 当前用户信息:', {
        userInfo: userStore.userInfo,
        currentUserId: currentUserId.value,
        isAdmin: isAdmin.value,
        safeGuardEnabled: state.safeGuardEnabled
      });
    }
  } catch (error) {
    console.error('获取设备列表失败:', error);
    message.error('获取设备列表失败，请稍后重试');
    state.devices = [];
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
    await fetchDevices();
    message.success('数据刷新成功');
  } catch (error) {
    message.error('数据刷新失败');
  } finally {
    state.refreshing = false;
  }
};

// 圈子选择变化
const handleCircleChange = async (circleId: number | null) => {
  state.selectedCircleId = circleId;
  await fetchDevices();
};

// 打开绑定模态框
const handleCreate = () => {
  modalState.mode = 'create';
  modalState.title = '绑定设备';
  modalState.currentDevice = null;
  modalState.visible = true;

  // 重置表单
  formState.device_sn = '';
  formState.device_name = '';
  formState.device_model = '';
  formState.circle_id = state.selectedCircleId;
  formState.config = '{}';

  // 清除表单验证
  formRef.value?.clearValidate();
};

// 查看详情
const handleView = (record: DeviceApi.DeviceInfo) => {
  modalState.mode = 'view';
  modalState.title = '查看设备详情';
  modalState.currentDevice = record;
  modalState.visible = true;

  // 填充表单数据
  formState.device_sn = record.device_sn;
  formState.device_name = record.device_name;
  formState.device_model = record.device_model || '';
  formState.circle_id = record.circle_id;
  formState.config = record.config || '{}';
};

// 编辑设备
const handleEdit = (record: DeviceApi.DeviceInfo) => {
  modalState.mode = 'edit';
  modalState.title = '编辑设备';
  modalState.currentDevice = record;
  modalState.visible = true;

  // 填充表单数据
  formState.device_sn = record.device_sn;
  formState.device_name = record.device_name;
  formState.device_model = record.device_model || '';
  formState.circle_id = record.circle_id;
  formState.config = record.config || '{}';

  // 清除表单验证
  formRef.value?.clearValidate();
};

// 解绑设备
const handleDelete = async (id: number) => {
  try {
    await unbindDeviceApi(id);
    message.success('设备解绑成功');
    await fetchDevices(); // 刷新列表
  } catch (error) {
    console.error('解绑设备失败:', error);
    message.error('解绑设备失败，请稍后重试');
  }
};

// 安全守护开关处理
const handleSafeGuardChange = (checked: boolean) => {
  const status = checked ? '开启' : '关闭';
  message.info(`安全守护已${status}`);
  
  if (!checked) {
    message.warning('安全守护已关闭，您现在可以操作所有设备，请谨慎操作！', 3);
  }
};

// 批量解绑
const handleBatchDelete = async () => {
  if (state.selectedRowKeys.length === 0) {
    message.warning('请选择要解绑的设备');
    return;
  }

  // 检查权限：只能删除有权限的设备
  const canDeleteIds = state.selectedRowKeys.filter(id => {
    const device = state.devices.find(d => d.id === id);
    if (!device) return false;
    
    const isOwner = device.bound_by_uid === currentUserId.value;
    return isOwner || (isAdmin.value && !state.safeGuardEnabled);
  });
  
  if (canDeleteIds.length === 0) {
    message.warning('没有可解绑的设备，请检查操作权限');
    return;
  }
  
  if (canDeleteIds.length < state.selectedRowKeys.length) {
    const diff = state.selectedRowKeys.length - canDeleteIds.length;
    message.warning(`有 ${diff} 个设备无权限解绑，将只解绑有权限的 ${canDeleteIds.length} 个`);
  }

  Modal.confirm({
    title: '批量解绑确认',
    content: `确定要解绑选中的 ${canDeleteIds.length} 个设备吗？`,
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        // 并行解绑
        await Promise.all(
          canDeleteIds.map(id => unbindDeviceApi(id))
        );
        message.success(`成功解绑 ${canDeleteIds.length} 个设备`);
        state.selectedRowKeys = [];
        await fetchDevices();
      } catch (error) {
        console.error('批量解绑失败:', error);
        message.error('批量解绑失败，请稍后重试');
      }
    }
  });
};

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    modalState.confirmLoading = true;

    const formData = {
      device_sn: formState.device_sn.trim(),
      device_name: formState.device_name.trim(),
      device_model: formState.device_model.trim(),
      circle_id: formState.circle_id!,
      config: formState.config.trim()
    };

    if (modalState.mode === 'create') {
      await bindDeviceApi(formData);
      message.success('设备绑定成功');
    } else if (modalState.mode === 'edit' && modalState.currentDevice) {
      await updateDeviceApi(modalState.currentDevice.id, {
        device_name: formData.device_name,
        config: formData.config
      });
      message.success('设备更新成功');
    }

    modalState.visible = false;
    await fetchDevices(); // 刷新列表
  } catch (error) {
    if (error?.errorFields) {
      // 表单验证错误
      return;
    }
    console.error('操作失败:', error);
    message.error('操作失败，请稍后重试');
  } finally {
    modalState.confirmLoading = false;
  }
};

// 取消操作
const handleCancel = () => {
  modalState.visible = false;
  modalState.confirmLoading = false;
};

// 表格行选择
const rowSelection = computed(() => ({
  selectedRowKeys: state.selectedRowKeys,
  onChange: (selectedRowKeys: number[]) => {
    state.selectedRowKeys = selectedRowKeys;
  },
  getCheckboxProps: (record: DeviceApi.DeviceInfo) => {
    const isOwner = record.bound_by_uid === currentUserId.value;
    const canDelete = isOwner || (isAdmin.value && !state.safeGuardEnabled);
    
    return {
      disabled: !canDelete,
      name: record.device_name
    };
  }
}));

// 组件挂载时获取数据
onMounted(async () => {
  await fetchCircles();
  await fetchDevices();
});
</script>

<template>
  <Page
    description="管理您的智能设备，绑定、编辑和解绑设备信息"
    title="设备管理"
  >
    <div class="p-5">
      <!-- 操作栏 -->
      <Card class="mb-5">
        <div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div class="flex flex-wrap items-center gap-3">
            <Button
              type="primary"
              @click="handleCreate"
            >
              <template #icon><PlusOutlined /></template>
              绑定设备
            </Button>

            <Button
              :loading="state.refreshing"
              @click="refreshData"
            >
              <template #icon><ReloadOutlined /></template>
              刷新
            </Button>

            <Button
              v-if="state.selectedRowKeys.length > 0"
              danger
              :disabled="canDeleteCount === 0"
              @click="handleBatchDelete"
            >
              <template #icon><DeleteOutlined /></template>
              批量解绑 ({{ canDeleteCount }}/{{ state.selectedRowKeys.length }})
            </Button>

            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium">筛选圈子：</span>
              <Select
                v-model:value="state.selectedCircleId"
                placeholder="选择守护圈"
                style="width: 200px"
                allow-clear
                @change="handleCircleChange"
              >
                <Select.Option :value="null">全部圈子</Select.Option>
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
                共 {{ filteredDevices.length }} 个设备
                <span v-if="state.selectedCircleId">
                  ({{ state.circles.find(c => c.id === state.selectedCircleId)?.circle_name }})
                </span>
              </div>
              <div v-if="isAdmin && !state.safeGuardEnabled" class="text-xs text-orange-600 mt-1">
                ⚠️ 安全守护已关闭，可操作所有设备
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
            :data-source="filteredDevices"
            :row-key="record => record.id"
            :row-selection="isAdmin ? rowSelection : undefined"
            :pagination="{
              total: filteredDevices.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }"
            :scroll="{ x: 1200 }"
            size="middle"
          >
            <template #emptyText>
              <Empty
                description="暂无设备数据"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              >
                <Button type="primary" @click="handleCreate">
                  绑定第一个设备
                </Button>
              </Empty>
            </template>
          </Table>
        </Spin>
      </Card>
    </div>

    <!-- 绑定/编辑模态框 -->
    <Modal
      v-model:open="modalState.visible"
      :title="modalState.title"
      :confirm-loading="modalState.confirmLoading"
      :mask-closable="false"
      width="600px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <template #footer>
        <div class="flex justify-end space-x-3">
          <Button @click="handleCancel">
            取消
          </Button>
          <Button
            v-if="modalState.mode !== 'view'"
            type="primary"
            :loading="modalState.confirmLoading"
            @click="handleSubmit"
          >
            {{ modalState.mode === 'create' ? '绑定' : '更新' }}
          </Button>
        </div>
      </template>

      <Form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        layout="vertical"
        class="mt-4"
      >
        <Form.Item label="设备序列号" name="device_sn">
          <Input
            v-model:value="formState.device_sn"
            placeholder="请输入设备序列号"
            :disabled="modalState.mode !== 'create'"
            :maxlength="50"
            show-count
          >
            <template #prefix>
              <MobileOutlined class="text-gray-400" />
            </template>
          </Input>
        </Form.Item>

        <Form.Item label="设备名称" name="device_name">
          <Input
            v-model:value="formState.device_name"
            placeholder="请输入设备名称"
            :disabled="modalState.mode === 'view'"
            :maxlength="50"
            show-count
          />
        </Form.Item>

        <Form.Item label="设备型号" name="device_model">
          <Input
            v-model:value="formState.device_model"
            placeholder="请输入设备型号（可选）"
            :disabled="modalState.mode === 'view'"
            :maxlength="50"
            show-count
          />
        </Form.Item>

        <Form.Item label="所属守护圈" name="circle_id">
          <Select
            v-model:value="formState.circle_id"
            placeholder="请选择守护圈"
            :disabled="modalState.mode === 'view'"
          >
            <Select.Option
              v-for="circle in state.circles"
              :key="circle.id"
              :value="circle.id"
            >
              {{ circle.circle_name }}
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="设备配置" name="config">
          <Input.TextArea
            v-model:value="formState.config"
            placeholder="请输入设备配置（JSON格式）"
            :disabled="modalState.mode === 'view'"
            :rows="4"
            :maxlength="1000"
            show-count
          />
        </Form.Item>

        <!-- 查看模式下显示额外信息 -->
        <template v-if="modalState.mode === 'view' && modalState.currentDevice">
          <Form.Item label="设备ID">
            <Input :value="modalState.currentDevice.id" disabled />
          </Form.Item>

          <Form.Item label="设备状态">
            <div class="flex items-center space-x-2">
              <Badge
                :status="modalState.currentDevice.device_status === 1 ? 'processing' : 'error'"
                :text="modalState.currentDevice.device_status === 1 ? '在线' : '离线'"
              />
            </div>
          </Form.Item>

          <Form.Item label="固件版本">
            <Input :value="modalState.currentDevice.firmware_version || '未知'" disabled />
          </Form.Item>

          <Form.Item label="最后心跳">
            <Input
              :value="modalState.currentDevice.last_heartbeat ? new Date(modalState.currentDevice.last_heartbeat).toLocaleString('zh-CN') : '从未连接'"
              disabled
            />
          </Form.Item>

          <Form.Item label="绑定时间">
            <Input
              :value="new Date(modalState.currentDevice.create_time).toLocaleString('zh-CN')"
              disabled
            />
          </Form.Item>
        </template>
      </Form>
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

code {
  font-family: 'Fira Code', 'Consolas', monospace;
}
</style>
