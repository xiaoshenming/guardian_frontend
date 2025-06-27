<template>
  <div class="guardian-circles">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>守护圈管理</h1>
          <p>管理您的守护圈，保护您关心的人</p>
        </div>
        <div class="header-actions">
          <a-space>
            <a-button @click="showJoinModal = true">
              <template #icon><UserAddOutlined /></template>
              加入守护圈
            </a-button>
            <a-button type="primary" @click="showCreateModal = true">
              <template #icon><PlusOutlined /></template>
              创建守护圈
            </a-button>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <a-card :bordered="false">
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :sm="12" :md="8">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索守护圈"
              allow-clear
              @search="handleSearch"
            />
          </a-col>
          <a-col :xs="24" :sm="12" :md="8">
            <a-select
              v-model:value="statusFilter"
              placeholder="选择状态"
              style="width: 100%"
              allow-clear
            >
              <a-select-option value="normal">正常</a-select-option>
              <a-select-option value="disabled">已禁用</a-select-option>
            </a-select>
          </a-col>
          <a-col :xs="24" :sm="24" :md="8">
            <a-space>
              <a-button @click="handleReset">重置</a-button>
            <a-button type="primary" @click="fetchCircles">搜索</a-button>
            </a-space>
          </a-col>
        </a-row>
      </a-card>
    </div>

    <!-- 守护圈列表 -->
    <div class="circles-section">
      <a-row :gutter="[16, 16]">
        <a-col
          v-for="circle in circles"
          :key="circle.id"
          :xs="24"
          :sm="12"
          :lg="8"
          :xl="6"
        >
          <a-card
            :bordered="false"
            class="circle-card"
            hoverable
            @click="viewCircleDetail(circle.id)"
          >
            <template #cover>
              <div class="circle-cover">
                <div class="circle-avatar">
                  <TeamOutlined />
                </div>
                <div class="circle-status">
                  <a-tag :color="getStatusColor(circle.status)">{{ getStatusText(circle.status) }}</a-tag>
                </div>
              </div>
            </template>
            
            <template #actions>
              <SettingOutlined key="setting" @click.stop="editCircle(circle)" />
              <UserOutlined key="members" @click.stop="viewMembers(circle)" />
              <MoreOutlined key="more" @click.stop="showCircleMenu(circle)" />
            </template>

            <a-card-meta
              :title="circle.name"
              :description="circle.description || '暂无描述'"
            />
            
            <div class="circle-info">
              <div class="info-item">
                <span class="info-label">{{ $t('guardian.circle.owner') }}:</span>
                <span class="info-value">{{ circle.ownerName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ $t('guardian.circle.memberCount') }}:</span>
                <span class="info-value">{{ circle.memberCount }}/{{ circle.maxMembers }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ $t('guardian.circle.deviceCount') }}:</span>
                <span class="info-value">{{ circle.deviceCount }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ $t('guardian.common.createTime') }}:</span>
                <span class="info-value">{{ formatDate(circle.createdAt) }}</span>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 空状态 -->
      <a-empty v-if="!loading && circles.length === 0" :description="$t('guardian.common.noData')" />

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin size="large" />
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-section">
      <a-pagination
        v-model:current="pagination.current"
        v-model:page-size="pagination.pageSize"
        :total="total"
        :show-size-changer="true"
        :show-quick-jumper="true"
        :show-total="(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`"
        @change="handlePageChange"
      />
    </div>

    <!-- 创建守护圈弹窗 -->
    <a-modal
      v-model:open="showCreateModal"
      :title="$t('guardian.circle.create')"
      :confirm-loading="createLoading"
      @ok="handleCreate"
    >
      <a-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        layout="vertical"
      >
        <a-form-item :label="$t('guardian.circle.name')" name="name">
          <a-input v-model:value="createForm.name" :placeholder="$t('guardian.circle.name')" />
        </a-form-item>
        <a-form-item :label="$t('guardian.circle.description')" name="description">
          <a-textarea
            v-model:value="createForm.description"
            :placeholder="$t('guardian.circle.description')"
            :rows="3"
          />
        </a-form-item>
        <a-form-item :label="$t('guardian.circle.maxMembers')" name="maxMembers">
          <a-input-number
            v-model:value="createForm.maxMembers"
            :min="2"
            :max="100"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 加入守护圈弹窗 -->
    <a-modal
      v-model:open="showJoinModal"
      :title="$t('guardian.circle.join')"
      :confirm-loading="joinLoading"
      @ok="handleJoin"
    >
      <a-form
        ref="joinFormRef"
        :model="joinForm"
        :rules="joinRules"
        layout="vertical"
      >
        <a-form-item :label="$t('guardian.circle.inviteCode')" name="inviteCode">
          <a-input
            v-model:value="joinForm.inviteCode"
            :placeholder="$t('guardian.circle.inviteCode')"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import {
  PlusOutlined,
  UserAddOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined,
  MoreOutlined,
} from '@ant-design/icons-vue';
import {
  getCircleList,
  createCircle,
  joinCircle,
  type Circle,
  type CreateCircleParams,
  type JoinCircleParams,
} from '#/api/guardian';

const router = useRouter();

// 响应式数据
const circles = ref<Circle[]>([]);
const loading = ref(false);
const total = ref(0);
const searchKeyword = ref('');
const statusFilter = ref<string>();

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 12,
});

// 创建守护圈
const showCreateModal = ref(false);
const createLoading = ref(false);
const createFormRef = ref();
const createForm = reactive<CreateCircleParams>({
  name: '',
  description: '',
  maxMembers: 10,
});

const createRules = {
  name: [{ required: true, message: '请输入守护圈名称' }],
  maxMembers: [{ required: true, message: '请设置最大成员数' }],
};

// 加入守护圈
const showJoinModal = ref(false);
const joinLoading = ref(false);
const joinFormRef = ref();
const joinForm = reactive<JoinCircleParams>({
  inviteCode: '',
});

const joinRules = {
  inviteCode: [{ required: true, message: '请输入邀请码' }],
};

// 获取守护圈列表
const fetchCircles = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value,
      status: statusFilter.value,
    };
    const response = await getCircleList(params);
    circles.value = response.data.list;
    total.value = response.data.total;
  } catch (error) {
    console.error('获取守护圈列表失败:', error);
    message.error('获取守护圈列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchCircles();
};

// 重置
const handleReset = () => {
  searchKeyword.value = '';
  statusFilter.value = undefined;
  pagination.current = 1;
  fetchCircles();
};

// 分页变化
const handlePageChange = (page: number, pageSize: number) => {
  pagination.current = page;
  pagination.pageSize = pageSize;
  fetchCircles();
};

// 创建守护圈
const handleCreate = async () => {
  try {
    await createFormRef.value.validate();
    createLoading.value = true;
    
    await createCircle(createForm);
    message.success('创建守护圈成功');
    showCreateModal.value = false;
    
    // 重置表单
    Object.assign(createForm, {
      name: '',
      description: '',
      maxMembers: 10,
    });
    
    // 刷新列表
    fetchCircles();
  } catch (error) {
    console.error('创建守护圈失败:', error);
    message.error('创建守护圈失败');
  } finally {
    createLoading.value = false;
  }
};

// 加入守护圈
const handleJoin = async () => {
  try {
    await joinFormRef.value.validate();
    joinLoading.value = true;
    
    await joinCircle(joinForm);
    message.success('加入守护圈成功');
    showJoinModal.value = false;
    
    // 重置表单
    joinForm.inviteCode = '';
    
    // 刷新列表
    fetchCircles();
  } catch (error) {
    console.error('加入守护圈失败:', error);
    message.error('加入守护圈失败');
  } finally {
    joinLoading.value = false;
  }
};

// 查看守护圈详情
const viewCircleDetail = (id: string) => {
  router.push(`/guardian/circles/${id}`);
};

// 编辑守护圈
const editCircle = (circle: Circle) => {
  router.push(`/guardian/circles/${circle.id}?tab=settings`);
};

// 查看成员
const viewMembers = (circle: Circle) => {
  router.push(`/guardian/circles/${circle.id}?tab=members`);
};

// 显示更多菜单
const showCircleMenu = (circle: Circle) => {
  // 这里可以实现更多操作菜单
  console.log('显示更多菜单:', circle);
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    normal: 'green',
    disabled: 'red',
  };
  return colorMap[status] || 'blue';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    normal: '正常',
    disabled: '已禁用',
  };
  return textMap[status] || status;
};

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

// 生命周期
onMounted(() => {
  fetchCircles();
});
</script>

<style scoped lang="less">
.guardian-circles {
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

  .search-section {
    margin-bottom: 24px;
  }

  .circles-section {
    margin-bottom: 24px;

    .circle-card {
      height: 100%;
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      .circle-cover {
        position: relative;
        height: 120px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;

        .circle-avatar {
          font-size: 48px;
          color: white;
        }

        .circle-status {
          position: absolute;
          top: 12px;
          right: 12px;
        }
      }

      .circle-info {
        margin-top: 16px;

        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;

          .info-label {
            color: #8c8c8c;
          }

          .info-value {
            color: #262626;
            font-weight: 500;
          }
        }
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
    }
  }

  .pagination-section {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
}

:deep(.ant-card) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.ant-card-actions) {
  background: #fafafa;
}

:deep(.ant-card-meta-title) {
  font-size: 16px;
  font-weight: 600;
}

:deep(.ant-card-meta-description) {
  color: #8c8c8c;
  font-size: 12px;
}
</style>