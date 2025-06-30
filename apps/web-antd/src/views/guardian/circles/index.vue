<script lang="ts" setup>
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
  Switch
} from 'ant-design-vue';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UsergroupAddOutlined,
  CrownOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  getCircleListApi,
  createCircleApi,
  updateCircleApi,
  deleteCircleApi
} from '#/api/core/circle';

const userStore = useUserStore();

// 响应式数据
const state = reactive({
  circles: [] as CircleApi.CircleInfo[],
  loading: false,
  refreshing: false,
  selectedRowKeys: [] as number[],
  safeGuardEnabled: true // 安全守护开关，默认开启
});

// 模态框状态
const modalState = reactive({
  visible: false,
  confirmLoading: false,
  mode: 'create' as 'create' | 'edit' | 'view',
  title: '创建守护圈',
  currentCircle: null as CircleApi.CircleInfo | null
});

// 表单数据
const formState = reactive({
  circle_name: '',
  description: ''
});

// 表单引用
const formRef = ref();

// 表单验证规则
const formRules = {
  circle_name: [
    { required: true, message: '请输入守护圈名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度应在2-50个字符之间', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
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
    const circle = state.circles.find(c => c.id === id);
    if (!circle) return false;
    
    const isOwner = circle.creator_uid === currentUserId.value;
    return isOwner || (isAdmin.value && !state.safeGuardEnabled);
  }).length;
});

// 表格列定义
const columns = computed<TableColumnsType>(() => {
  const baseColumns: TableColumnsType = [
    {
      title: '圈子名称',
      dataIndex: 'circle_name',
      key: 'circle_name',
      width: 200,
      ellipsis: true
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      customRender: ({ text }) => text || '暂无描述'
    },
    {
      title: '创建者',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 120,
      customRender: ({ record }) => {
        const isOwner = record.creator_uid === currentUserId.value;
        return h('div', { class: 'flex items-center space-x-2' }, [
          h('span', record.creator_name || '未知用户'),
          isOwner ? h(Tag, { color: 'blue' }, '我的') : null
        ]);
      }
    },
    {
      title: '邮箱',
      dataIndex: 'creator_email',
      key: 'creator_email',
      width: 160,
      ellipsis: true
    },
    {
      title: '成员数',
      dataIndex: 'member_count',
      key: 'member_count',
      width: 80,
      align: 'center',
      customRender: ({ text }) => text || 0
    },
    {
      title: '设备数',
      dataIndex: 'device_count',
      key: 'device_count',
      width: 80,
      align: 'center',
      customRender: ({ text }) => text || 0
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      width: 160,
      customRender: ({ text }) => {
        return new Date(text).toLocaleString('zh-CN');
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      customRender: ({ record }) => {
        const isOwner = record.creator_uid === currentUserId.value;
        
        // 权限逻辑：
        // 1. 普通用户：只能操作自己创建的圈子
        // 2. 管理员：关闭安全守护后可以操作所有圈子，开启时只能操作自己的
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
          }),
          h(Tooltip, { title: '成员管理' }, {
            default: () => h(Button, {
              type: 'text',
              size: 'small',
              icon: h(UsergroupAddOutlined),
              onClick: () => handleMemberManage(record)
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
            : '删除';
            
          buttons.push(
            h(Popconfirm, {
              title: '确定要删除这个守护圈吗？',
              description: '删除后将无法恢复，所有相关数据都将被清除。',
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
    state.loading = true;
    const result = await getCircleListApi();

    // 处理响应数据
    let circles: CircleApi.CircleInfo[] = [];
    if (result?.data) {
      circles = Array.isArray(result.data) ? result.data : result;
    } else if (Array.isArray(result)) {
      circles = result;
    }

    state.circles = circles;

    if (import.meta.env.DEV) {
      console.log('✅ 守护圈列表获取成功:', circles);
      console.log('🔍 当前用户信息:', {
        userInfo: userStore.userInfo,
        currentUserId: currentUserId.value,
        isAdmin: isAdmin.value,
        safeGuardEnabled: state.safeGuardEnabled
      });
      
      // 检查每个圈子的权限
      circles.forEach(circle => {
        const isOwner = circle.creator_uid === currentUserId.value;
        const canEdit = isOwner || (isAdmin.value && !state.safeGuardEnabled);
        console.log(`圈子 "${circle.circle_name}" 权限:`, {
          creator_uid: circle.creator_uid,
          isOwner,
          canEdit
        });
      });
    }
  } catch (error) {
    console.error('获取守护圈列表失败:', error);
    message.error('获取守护圈列表失败，请稍后重试');
    state.circles = [];
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
    message.success('数据刷新成功');
  } catch (error) {
    message.error('数据刷新失败');
  } finally {
    state.refreshing = false;
  }
};

// 打开创建模态框
const handleCreate = () => {
  modalState.mode = 'create';
  modalState.title = '创建守护圈';
  modalState.currentCircle = null;
  modalState.visible = true;

  // 重置表单
  formState.circle_name = '';
  formState.description = '';

  // 清除表单验证
  formRef.value?.clearValidate();
};

// 查看详情
const handleView = (record: CircleApi.CircleInfo) => {
  modalState.mode = 'view';
  modalState.title = '查看守护圈';
  modalState.currentCircle = record;
  modalState.visible = true;

  // 填充表单数据
  formState.circle_name = record.circle_name;
  formState.description = record.description || '';
};

// 编辑守护圈
const handleEdit = (record: CircleApi.CircleInfo) => {
  modalState.mode = 'edit';
  modalState.title = '编辑守护圈';
  modalState.currentCircle = record;
  modalState.visible = true;

  // 填充表单数据
  formState.circle_name = record.circle_name;
  formState.description = record.description || '';

  // 清除表单验证
  formRef.value?.clearValidate();
};

// 成员管理
const handleMemberManage = (record: CircleApi.CircleInfo) => {
  message.info(`成员管理功能开发中... 圈子: ${record.circle_name}`);
  // TODO: 跳转到成员管理页面或打开成员管理模态框
};

// 删除守护圈
const handleDelete = async (id: number) => {
  try {
    await deleteCircleApi(id);
    message.success('守护圈删除成功');
    await fetchCircles(); // 刷新列表
  } catch (error) {
    console.error('删除守护圈失败:', error);
    message.error('删除守护圈失败，请稍后重试');
  }
};

// 安全守护开关处理
const handleSafeGuardChange = (checked: boolean) => {
  const status = checked ? '开启' : '关闭';
  message.info(`安全守护已${status}`);
  
  if (!checked) {
    message.warning('安全守护已关闭，您现在可以操作所有守护圈，请谨慎操作！', 3);
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (state.selectedRowKeys.length === 0) {
    message.warning('请选择要删除的守护圈');
    return;
  }

  // 检查权限：只能删除有权限的圈子
  const canDeleteIds = state.selectedRowKeys.filter(id => {
    const circle = state.circles.find(c => c.id === id);
    if (!circle) return false;
    
    const isOwner = circle.creator_uid === currentUserId.value;
    return isOwner || (isAdmin.value && !state.safeGuardEnabled);
  });
  
  if (canDeleteIds.length === 0) {
    message.warning('没有可删除的守护圈，请检查操作权限');
    return;
  }
  
  if (canDeleteIds.length < state.selectedRowKeys.length) {
    const diff = state.selectedRowKeys.length - canDeleteIds.length;
    message.warning(`有 ${diff} 个守护圈无权限删除，将只删除有权限的 ${canDeleteIds.length} 个`);
  }

  Modal.confirm({
    title: '批量删除确认',
    content: `确定要删除选中的 ${canDeleteIds.length} 个守护圈吗？`,
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        // 并行删除
        await Promise.all(
          canDeleteIds.map(id => CircleApi.deleteCircleApi(id))
        );
        message.success(`成功删除 ${canDeleteIds.length} 个守护圈`);
        state.selectedRowKeys = [];
        await fetchCircles();
      } catch (error) {
        console.error('批量删除失败:', error);
        message.error('批量删除失败，请稍后重试');
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
      circle_name: formState.circle_name.trim(),
      description: formState.description.trim()
    };

    if (modalState.mode === 'create') {
      await createCircleApi(formData);
      message.success('守护圈创建成功');
    } else if (modalState.mode === 'edit' && modalState.currentCircle) {
      await updateCircleApi(modalState.currentCircle.id, formData);
      message.success('守护圈更新成功');
    }

    modalState.visible = false;
    await fetchCircles(); // 刷新列表
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
  onSelectAll: (selected: boolean, selectedRows: CircleApi.CircleInfo[], changeRows: CircleApi.CircleInfo[]) => {
    console.log('全选状态:', selected, '选中行:', selectedRows, '变化行:', changeRows);
  },
  getCheckboxProps: (record: CircleApi.CircleInfo) => {
    const isOwner = record.creator_uid === currentUserId.value;
    const canDelete = isOwner || (isAdmin.value && !state.safeGuardEnabled);
    
    return {
      disabled: !canDelete,
      name: record.circle_name
    };
  }
}));

// 组件挂载时获取数据
onMounted(() => {
  fetchCircles();
});
</script>

<template>
  <Page
    description="管理您的守护圈，创建、编辑和删除守护圈信息"
    title="守护圈管理"
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
              创建守护圈
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
              批量删除 ({{ canDeleteCount }}/{{ state.selectedRowKeys.length }})
            </Button>
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
                共 {{ state.circles.length }} 个守护圈
              </div>
              <div v-if="isAdmin && !state.safeGuardEnabled" class="text-xs text-orange-600 mt-1">
                ⚠️ 安全守护已关闭，可操作所有圈子
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
            :data-source="state.circles"
            :row-key="record => record.id"
            :row-selection="isAdmin ? rowSelection : undefined"
            :pagination="{
              total: state.circles.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }"
            :scroll="{ x: 1000 }"
            size="middle"
          >
            <template #emptyText>
              <Empty
                description="暂无守护圈数据"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              >
                <Button type="primary" @click="handleCreate">
                  创建第一个守护圈
                </Button>
              </Empty>
            </template>
          </Table>
        </Spin>
      </Card>
    </div>

    <!-- 创建/编辑模态框 -->
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
            {{ modalState.mode === 'create' ? '创建' : '更新' }}
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
        <Form.Item label="守护圈名称" name="circle_name">
          <Input
            v-model:value="formState.circle_name"
            placeholder="请输入守护圈名称"
            :disabled="modalState.mode === 'view'"
            :maxlength="50"
            show-count
          />
        </Form.Item>

        <Form.Item label="描述信息" name="description">
          <Input.TextArea
            v-model:value="formState.description"
            placeholder="请输入守护圈描述（可选）"
            :disabled="modalState.mode === 'view'"
            :rows="4"
            :maxlength="200"
            show-count
          />
        </Form.Item>

        <!-- 查看模式下显示额外信息 -->
        <template v-if="modalState.mode === 'view' && modalState.currentCircle">
          <Form.Item label="圈子ID">
            <Input :value="modalState.currentCircle.id" disabled />
          </Form.Item>

          <Form.Item label="邀请码" v-if="modalState.currentCircle.circle_code">
            <Input :value="modalState.currentCircle.circle_code" disabled>
              <template #suffix>
                <Tooltip title="复制邀请码">
                  <Button
                    type="text"
                    size="small"
                    @click="() => {
                      navigator.clipboard.writeText(modalState.currentCircle.circle_code);
                      message.success('邀请码已复制到剪贴板');
                    }"
                  >
                    复制
                  </Button>
                </Tooltip>
              </template>
            </Input>
          </Form.Item>

          <Form.Item label="创建时间">
            <Input
              :value="new Date(modalState.currentCircle.create_time).toLocaleString('zh-CN')"
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
</style>
