<template>
  <div class="guardian-users">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>用户管理</h1>
          <p>管理系统用户，分配角色权限</p>
        </div>
        <div class="header-actions">
          <a-space>
            <a-button @click="refreshUsers">
              <template #icon><ReloadOutlined /></template>
              刷新
            </a-button>
            <a-button type="primary" @click="showCreateModal = true">
              <template #icon><PlusOutlined /></template>
              添加用户
            </a-button>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 用户统计 -->
    <div class="stats-section">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="6">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="总用户数"
              :value="userStats.total"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix><UserOutlined /></template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="6">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="管理员"
              :value="userStats.admin"
              :value-style="{ color: '#722ed1' }"
            >
              <template #prefix><CrownOutlined /></template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="6">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="普通用户"
              :value="userStats.user"
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix><TeamOutlined /></template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="6">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              title="今日活跃"
              :value="userStats.active"
              :value-style="{ color: '#fa8c16' }"
            >
              <template #prefix><FireOutlined /></template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <a-card :bordered="false">
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :sm="12" :md="8">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索用户"
              allow-clear
              @search="handleSearch"
            />
          </a-col>
          <a-col :xs="24" :sm="12" :md="4">
            <a-select
              v-model:value="roleFilter"
              placeholder="选择角色"
              style="width: 100%"
              allow-clear
            >
              <a-select-option value="admin">管理员</a-select-option>
              <a-select-option value="user">普通用户</a-select-option>
              <a-select-option value="guardian">守护者</a-select-option>
            </a-select>
          </a-col>
          <a-col :xs="24" :sm="12" :md="4">
            <a-select
              v-model:value="statusFilter"
              placeholder="用户状态"
              style="width: 100%"
              allow-clear
            >
              <a-select-option value="active">活跃</a-select-option>
              <a-select-option value="inactive">非活跃</a-select-option>
            </a-select>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8">
            <a-space>
              <a-button type="primary" @click="fetchUsers">搜索</a-button>
              <a-button @click="handleReset">重置</a-button>
            </a-space>
          </a-col>
        </a-row>
      </a-card>
    </div>

    <!-- 用户列表 -->
    <div class="table-section">
      <a-card :bordered="false">
        <a-table
          :columns="columns"
          :data-source="users"
          :loading="loading"
          :pagination="pagination"
          :scroll="{ x: 1200 }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'avatar'">
              <a-avatar :src="record.avatar" :size="40">
                <template #icon><UserOutlined /></template>
              </a-avatar>
            </template>
            
            <template v-else-if="column.key === 'role'">
              <a-tag :color="getRoleColor(record.role)">
                {{ getRoleText(record.role) }}
              </a-tag>
            </template>
            
            <template v-else-if="column.key === 'status'">
              <a-badge
                :status="record.status === 'active' ? 'success' : 'default'"
                :text="record.status === 'active' ? '活跃' : '非活跃'"
              />
            </template>
            
            <template v-else-if="column.key === 'lastLogin'">
              <span v-if="record.lastLogin">
                {{ formatDateTime(record.lastLogin) }}
              </span>
              <span v-else class="text-gray-400">从未登录</span>
            </template>
            
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="viewUser(record)">
                  查看
                </a-button>
                <a-button type="link" size="small" @click="editUser(record)">
                  编辑
                </a-button>
                <a-dropdown>
                  <a-button type="link" size="small">
                    更多 <DownOutlined />
                  </a-button>
                  <template #overlay>
                    <a-menu @click="({ key }) => handleUserAction(key, record)">
                      <a-menu-item key="resetPassword">
                        重置密码
                      </a-menu-item>
                      <a-menu-item key="changeRole">
                        修改角色
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="disable" :disabled="record.id === currentUserId">
                        {{ record.status === 'active' ? '禁用' : '启用' }}
                      </a-menu-item>
                      <a-menu-item key="delete" danger :disabled="record.id === currentUserId">
                        删除
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

    <!-- 创建用户弹窗 -->
    <a-modal
      v-model:open="showCreateModal"
      title="添加用户"
      :confirm-loading="createLoading"
      @ok="handleCreateUser"
    >
      <a-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        layout="vertical"
      >
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="createForm.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="createForm.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="真实姓名" name="realName">
          <a-input v-model:value="createForm.realName" placeholder="请输入真实姓名" />
        </a-form-item>
        <a-form-item label="角色" name="role">
          <a-select v-model:value="createForm.role" placeholder="请选择角色">
            <a-select-option value="admin">管理员</a-select-option>
            <a-select-option value="user">普通用户</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="初始密码" name="password">
          <a-input-password v-model:value="createForm.password" placeholder="请输入初始密码" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑用户弹窗 -->
    <a-modal
      v-model:open="showEditModal"
      title="编辑用户"
      :confirm-loading="editLoading"
      @ok="handleEditUser"
    >
      <a-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        layout="vertical"
      >
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="editForm.username" disabled />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="editForm.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="真实姓名" name="realName">
          <a-input v-model:value="editForm.realName" placeholder="请输入真实姓名" />
        </a-form-item>
        <a-form-item label="角色" name="role">
          <a-select v-model:value="editForm.role" placeholder="请选择角色">
            <a-select-option value="admin">管理员</a-select-option>
            <a-select-option value="user">普通用户</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 用户详情弹窗 -->
    <a-modal
      v-model:open="showDetailModal"
      title="用户详情"
      :footer="null"
      width="600px"
    >
      <div v-if="selectedUser" class="user-detail">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="头像" :span="2">
            <a-avatar :src="selectedUser.avatar" :size="60">
              <template #icon><UserOutlined /></template>
            </a-avatar>
          </a-descriptions-item>
          <a-descriptions-item label="用户名">
            {{ selectedUser.username }}
          </a-descriptions-item>
          <a-descriptions-item label="真实姓名">
            {{ selectedUser.realName || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="邮箱">
            {{ selectedUser.email || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="角色">
            <a-tag :color="getRoleColor(selectedUser.role)">
              {{ getRoleText(selectedUser.role) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-badge
              :status="selectedUser.status === 'active' ? 'success' : 'default'"
              :text="selectedUser.status === 'active' ? '活跃' : '非活跃'"
            />
          </a-descriptions-item>
          <a-descriptions-item label="注册时间">
            {{ formatDateTime(selectedUser.createdAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="最后登录">
            {{ selectedUser.lastLogin ? formatDateTime(selectedUser.lastLogin) : '从未登录' }}
          </a-descriptions-item>
          <a-descriptions-item label="守护圈数量">
            {{ selectedUser.circleCount || 0 }} 个
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  ReloadOutlined,
  PlusOutlined,
  UserOutlined,
  CrownOutlined,
  TeamOutlined,
  FireOutlined,
  DownOutlined,
} from '@ant-design/icons-vue';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

// 用户数据接口
interface User {
  id: number;
  username: string;
  email?: string;
  realName?: string;
  avatar?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
  circleCount?: number;
}

// 响应式数据
const loading = ref(false);
const users = ref<User[]>([]);
const searchKeyword = ref('');
const roleFilter = ref<string>();
const statusFilter = ref<string>();

// 统计数据
const userStats = reactive({
  total: 0,
  admin: 0,
  user: 0,
  active: 0,
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

// 弹窗状态
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDetailModal = ref(false);
const createLoading = ref(false);
const editLoading = ref(false);

// 表单数据
const createForm = reactive({
  username: '',
  email: '',
  realName: '',
  role: 'user' as 'admin' | 'user',
  password: '',
});

const editForm = reactive({
  id: 0,
  username: '',
  email: '',
  realName: '',
  role: 'user' as 'admin' | 'user',
});

const selectedUser = ref<User | null>(null);

// 表单引用
const createFormRef = ref();
const editFormRef = ref();

// 当前用户ID
const userStore = useUserStore();
const currentUserId = computed(() => userStore.userInfo?.id);

// 表单验证规则
const createRules = {
  username: [{ required: true, message: '请输入用户名' }],
  email: [{ type: 'email', message: '请输入正确的邮箱格式' }],
  role: [{ required: true, message: '请选择角色' }],
  password: [{ required: true, message: '请输入初始密码', min: 6 }],
};

const editRules = {
  email: [{ type: 'email', message: '请输入正确的邮箱格式' }],
  role: [{ required: true, message: '请选择角色' }],
};

// 表格列配置
const columns = [
  {
    title: '头像',
    key: 'avatar',
    width: 80,
  },
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
    sorter: true,
  },
  {
    title: '真实姓名',
    dataIndex: 'realName',
    key: 'realName',
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: '角色',
    key: 'role',
    width: 100,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '最后登录',
    key: 'lastLogin',
    width: 180,
  },
  {
    title: '注册时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
    customRender: ({ text }) => formatDateTime(text),
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right',
  },
];

// 方法
const loadUsers = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    const mockUsers: User[] = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@guardian.com',
        realName: '系统管理员',
        role: 'admin',
        status: 'active',
        lastLogin: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00Z',
        circleCount: 5,
      },
      {
        id: 2,
        username: 'user1',
        email: 'user1@example.com',
        realName: '张三',
        role: 'user',
        status: 'active',
        lastLogin: new Date(Date.now() - 86400000).toISOString(),
        createdAt: '2024-01-15T00:00:00Z',
        circleCount: 2,
      },
    ];
    
    users.value = mockUsers;
    pagination.total = mockUsers.length;
    
    // 更新统计数据
    userStats.total = mockUsers.length;
    userStats.admin = mockUsers.filter(u => u.role === 'admin').length;
    userStats.user = mockUsers.filter(u => u.role === 'user').length;
    userStats.active = mockUsers.filter(u => u.status === 'active').length;
  } catch (error) {
    message.error('加载用户列表失败');
  } finally {
    loading.value = false;
  }
};

const refreshUsers = () => {
  loadUsers();
};

const handleSearch = () => {
  // 实现搜索逻辑
  loadUsers();
};

const resetSearch = () => {
  searchKeyword.value = '';
  roleFilter.value = undefined;
  statusFilter.value = undefined;
  loadUsers();
};

const handleTableChange = (pag: any, filters: any, sorter: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadUsers();
};

const getRoleColor = (role: string) => {
  return role === 'admin' ? 'purple' : 'blue';
};

const getRoleText = (role: string) => {
  return role === 'admin' ? '管理员' : '普通用户';
};

const viewUser = (user: User) => {
  selectedUser.value = user;
  showDetailModal.value = true;
};

const editUser = (user: User) => {
  Object.assign(editForm, user);
  showEditModal.value = true;
};

const handleCreateUser = async () => {
  try {
    await createFormRef.value.validate();
    createLoading.value = true;
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    message.success('用户创建成功');
    showCreateModal.value = false;
    Object.assign(createForm, {
      username: '',
      email: '',
      realName: '',
      role: 'user',
      password: '',
    });
    loadUsers();
  } catch (error) {
    // 表单验证失败
  } finally {
    createLoading.value = false;
  }
};

const handleEditUser = async () => {
  try {
    await editFormRef.value.validate();
    editLoading.value = true;
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    message.success('用户信息更新成功');
    showEditModal.value = false;
    loadUsers();
  } catch (error) {
    // 表单验证失败
  } finally {
    editLoading.value = false;
  }
};

const handleUserAction = (action: string, user: User) => {
  switch (action) {
    case 'resetPassword':
      Modal.confirm({
        title: '重置密码',
        content: `确定要重置用户 ${user.username} 的密码吗？`,
        onOk: () => {
          message.success('密码重置成功，新密码已发送到用户邮箱');
        },
      });
      break;
    case 'changeRole':
      // 实现角色修改逻辑
      break;
    case 'disable':
      Modal.confirm({
        title: user.status === 'active' ? '禁用用户' : '启用用户',
        content: `确定要${user.status === 'active' ? '禁用' : '启用'}用户 ${user.username} 吗？`,
        onOk: () => {
          message.success(`用户${user.status === 'active' ? '禁用' : '启用'}成功`);
          loadUsers();
        },
      });
      break;
    case 'delete':
      Modal.confirm({
        title: '删除用户',
        content: `确定要删除用户 ${user.username} 吗？此操作不可恢复。`,
        okType: 'danger',
        onOk: () => {
          message.success('用户删除成功');
          loadUsers();
        },
      });
      break;
  }
};

// 生命周期
onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.guardian-users {
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

.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.search-section {
  margin-bottom: 24px;
}

.table-section {
  margin-bottom: 24px;
}

.user-detail {
  padding: 16px 0;
}

.text-gray-400 {
  color: #9ca3af;
}

@media (max-width: 768px) {
  .guardian-users {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>