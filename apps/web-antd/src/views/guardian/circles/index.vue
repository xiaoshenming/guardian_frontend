<template>
  <div class="guardian-circles">
    <!-- 页面头部 -->
    <div class="page-header">
      <a-card :bordered="false" class="header-card">
        <div class="header-content">
          <div class="header-left">
            <div class="header-icon">
              <TeamOutlined />
            </div>
            <div class="header-title">
              <h1>守护圈管理</h1>
              <p>管理您的守护圈，保护您关心的人</p>
            </div>
          </div>
          <div class="header-actions">
            <a-space size="large">
              <a-button 
                size="large" 
                @click="showJoinModal = true"
                class="action-button join-button"
              >
                <template #icon><UserAddOutlined /></template>
                加入守护圈
              </a-button>
              <a-button 
                type="primary" 
                size="large"
                @click="showCreateModal = true"
                class="action-button create-button"
              >
                <template #icon><PlusOutlined /></template>
                创建守护圈
              </a-button>
            </a-space>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <a-card :bordered="false">
        <template #title>
          <div class="search-title">
            <SearchOutlined class="search-icon" />
            <span>搜索筛选</span>
          </div>
        </template>
        <a-row :gutter="[24, 16]">
          <a-col :xs="24" :sm="12" :lg="8">
            <div class="search-item">
              <label class="search-label">守护圈名称</label>
              <a-input-search
                v-model:value="searchKeyword"
                placeholder="输入守护圈名称进行搜索"
                allow-clear
                size="large"
                @search="handleSearch"
                @pressEnter="handleSearch"
              >
                <template #enterButton>
                  <a-button type="primary">
                    <SearchOutlined />
                  </a-button>
                </template>
              </a-input-search>
            </div>
          </a-col>
          <a-col :xs="24" :sm="12" :lg="6">
            <div class="search-item">
              <label class="search-label">状态筛选</label>
              <a-select
                v-model:value="statusFilter"
                placeholder="选择状态"
                style="width: 100%"
                size="large"
                allow-clear
              >
                <a-select-option value="normal">
                  <a-tag color="green">正常</a-tag>
                </a-select-option>
                <a-select-option value="disabled">
                  <a-tag color="red">已禁用</a-tag>
                </a-select-option>
              </a-select>
            </div>
          </a-col>
          <a-col :xs="24" :sm="24" :lg="10">
            <div class="search-item">
              <label class="search-label">操作</label>
              <a-space size="middle">
                <a-button size="large" @click="handleReset">
                  <template #icon><ReloadOutlined /></template>
                  重置
                </a-button>
                <a-button type="primary" size="large" @click="fetchCircles" :loading="loading">
                  <template #icon><SearchOutlined /></template>
                  搜索
                </a-button>
                <a-button size="large" @click="fetchCircles" :loading="loading">
                  <template #icon><SyncOutlined /></template>
                  刷新
                </a-button>
              </a-space>
            </div>
          </a-col>
        </a-row>
      </a-card>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section" v-if="!loading">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="8">
          <a-card class="stat-card" :bordered="false">
            <a-statistic
              title="我的守护圈"
              :value="processedCircles.length"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix>
                <TeamOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="8">
          <a-card class="stat-card" :bordered="false">
            <a-statistic
              title="活跃守护圈"
              :value="processedCircles.filter(c => c.status === 'normal').length"
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix>
                <SafetyOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="8">
          <a-card class="stat-card" :bordered="false">
            <a-statistic
              title="总成员数"
              :value="processedCircles.reduce((sum, c) => sum + (c.memberCount || 0), 0)"
              :value-style="{ color: '#722ed1' }"
            >
              <template #prefix>
                <UserOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 守护圈列表 -->
    <div class="circles-section">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin size="large">
          <template #indicator>
            <SafetyOutlined class="loading-icon" />
          </template>
        </a-spin>
        <div class="loading-text">
          <h3>正在加载守护圈</h3>
          <p>请稍候，正在为您获取最新的守护圈信息...</p>
        </div>
      </div>

      <!-- 守护圈卡片 -->
      <div v-else-if="processedCircles.length > 0" class="cards-container">
        <a-row :gutter="[24, 24]">
          <a-col :xs="24" :sm="12" :lg="8" :xl="6" v-for="circle in processedCircles" :key="circle.id">
            <a-card
              class="circle-card"
              :hoverable="true"
              @click="viewCircleDetail(circle.id)"
            >
              <!-- 卡片封面 -->
              <div class="circle-cover">
                <div class="cover-background">
                  <div class="cover-pattern"></div>
                </div>
                <div class="cover-content">
                  <div class="circle-avatar">
                    <SafetyOutlined />
                  </div>
                  <div class="circle-badge">
                    <HeartOutlined class="heart-icon" />
                  </div>
                </div>
                <a-tag class="circle-status" :color="getStatusColor(circle.status)">
                  {{ getStatusText(circle.status) }}
                </a-tag>
              </div>

              <!-- 卡片标题和操作菜单 -->
              <div class="circle-header">
                <div class="circle-title-section">
                  <h3 class="circle-title">{{ circle.name }}</h3>
                  <p class="circle-description">{{ circle.description || '暂无描述' }}</p>
                </div>
                <a-dropdown placement="bottomRight">
                  <a-button type="text" size="small" @click.stop class="more-button">
                    <MoreOutlined />
                  </a-button>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item @click.stop="viewCircleDetail(circle.id)">
                        <template #icon><EyeOutlined /></template>
                        查看详情
                      </a-menu-item>
                      <a-menu-item @click.stop="viewMembers(circle)">
                        <template #icon><UserOutlined /></template>
                        管理成员
                      </a-menu-item>
                      <a-menu-item @click.stop="editCircle(circle)">
                        <template #icon><SettingOutlined /></template>
                        圈子设置
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item v-if="circle.inviteCode" @click.stop="copyInviteCode(circle.inviteCode)">
                        <template #icon><CopyOutlined /></template>
                        复制邀请码
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>

              <!-- 守护圈信息 -->
              <div class="circle-info">
                <div class="info-row">
                  <div class="info-item members-info">
                    <div class="info-header">
                      <UserOutlined class="info-icon" />
                      <span class="info-label">成员</span>
                    </div>
                    <div class="members-display">
                      <a-progress 
                        :percent="Math.round((circle.memberCount || 0) / circle.maxMembers * 100)"
                        size="small"
                        :stroke-color="{
                          '0%': '#87d068',
                          '100%': '#108ee9',
                        }"
                        :show-info="false"
                        class="members-progress"
                      />
                      <span class="members-count">{{ circle.memberCount || 0 }}/{{ circle.maxMembers }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="info-row">
                  <div class="info-item">
                    <div class="info-header">
                      <CalendarOutlined class="info-icon" />
                      <span class="info-label">创建时间</span>
                    </div>
                    <span class="info-value">{{ formatDate(circle.createdAt) }}</span>
                  </div>
                </div>
                
                <div class="info-row" v-if="circle.inviteCode">
                  <div class="info-item invite-item">
                    <div class="info-header">
                      <CopyOutlined class="info-icon" />
                      <span class="info-label">邀请码</span>
                    </div>
                    <div class="invite-code-container" @click.stop="copyInviteCode(circle.inviteCode)">
                      <a-tag color="blue" class="invite-code-tag">
                        {{ circle.inviteCode }}
                      </a-tag>
                      <a-tooltip title="点击复制">
                        <CopyOutlined class="copy-icon" />
                      </a-tooltip>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 卡片操作 -->
              <div class="card-actions">
                <a-tooltip title="查看详情">
                  <a-button 
                    type="text" 
                    size="small" 
                    @click.stop="viewCircleDetail(circle.id)"
                    class="action-btn"
                  >
                    <EyeOutlined />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="管理成员">
                  <a-button 
                    type="text" 
                    size="small" 
                    @click.stop="viewMembers(circle)"
                    class="action-btn"
                  >
                    <UserOutlined />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="圈子设置">
                  <a-button 
                    type="text" 
                    size="small" 
                    @click.stop="editCircle(circle)"
                    class="action-btn"
                  >
                    <SettingOutlined />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="复制邀请码" v-if="circle.inviteCode">
                  <a-button 
                    type="text" 
                    size="small" 
                    @click.stop="copyInviteCode(circle.inviteCode)"
                    class="action-btn copy-btn"
                  >
                    <CopyOutlined />
                  </a-button>
                </a-tooltip>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-container">
        <a-empty
          :image="Empty.PRESENTED_IMAGE_SIMPLE"
          description="暂无守护圈"
        >
          <template #description>
            <div class="empty-content">
              <h2>欢迎使用守护圈</h2>
              <p class="empty-subtitle">守护圈让您与家人朋友保持安全连接</p>
              <p class="empty-description">创建或加入守护圈，开始您的安全守护之旅</p>
            </div>
          </template>
          <div class="empty-actions">
            <a-space size="large" direction="vertical">
              <a-button 
                type="primary" 
                size="large"
                @click="showCreateModal = true"
                class="primary-action"
              >
                <template #icon><PlusOutlined /></template>
                创建我的守护圈
              </a-button>
              <a-button 
                size="large"
                @click="showJoinModal = true"
                class="secondary-action"
              >
                <template #icon><UserAddOutlined /></template>
                加入现有守护圈
              </a-button>
            </a-space>
          </div>
        </a-empty>
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
      title="创建守护圈"
      :confirm-loading="createLoading"
      @ok="handleCreate"
      width="600px"
      :mask-closable="false"
    >
      <a-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        layout="vertical"
      >
        <a-form-item label="守护圈名称" name="name">
          <a-input 
            v-model:value="createForm.name" 
            placeholder="请输入守护圈名称"
            size="large"
            :maxlength="50"
            show-count
          />
        </a-form-item>
        <a-form-item label="守护圈描述" name="description">
          <a-textarea
            v-model:value="createForm.description"
            placeholder="请输入守护圈描述（可选）"
            :rows="4"
            :maxlength="200"
            show-count
            size="large"
          />
        </a-form-item>
        <a-form-item label="最大成员数" name="maxMembers">
          <a-input-number
            v-model:value="createForm.maxMembers"
            :min="2"
            :max="100"
            style="width: 100%"
            size="large"
            placeholder="设置最大成员数量"
          />
          <div style="margin-top: 8px; color: var(--ant-color-text-secondary); font-size: 12px;">
            建议设置为 2-50 人，便于管理和沟通
          </div>
        </a-form-item>
      </a-form>
      <template #footer>
        <a-space>
          <a-button @click="handleCreateCancel" size="large">
            取消
          </a-button>
          <a-button 
            type="primary" 
            :loading="createLoading"
            @click="handleCreate"
            size="large"
          >
            <template #icon><PlusOutlined /></template>
            创建守护圈
          </a-button>
        </a-space>
      </template>
    </a-modal>

    <!-- 加入守护圈弹窗 -->
    <a-modal
      v-model:open="showJoinModal"
      title="加入守护圈"
      :confirm-loading="joinLoading"
      @ok="handleJoin"
      width="500px"
      :mask-closable="false"
    >
      <a-form
        ref="joinFormRef"
        :model="joinForm"
        :rules="joinRules"
        layout="vertical"
      >
        <a-form-item label="邀请码" name="inviteCode">
          <a-input
            v-model:value="joinForm.inviteCode"
            placeholder="请输入6位邀请码"
            size="large"
            :maxlength="6"
            style="text-align: center; font-size: 18px; letter-spacing: 4px;"
            @input="handleInviteCodeInput"
            @paste="handleInviteCodePaste"
          />
          <div style="margin-top: 8px; color: var(--ant-color-text-secondary); font-size: 12px;">
            <div>请向守护圈管理员获取邀请码</div>
            <div style="margin-top: 4px;">支持大小写字母和数字，自动转换为大写</div>
          </div>
        </a-form-item>
      </a-form>
      <template #footer>
        <a-space>
          <a-button @click="handleJoinCancel" size="large">
            取消
          </a-button>
          <a-button 
            type="primary" 
            :loading="joinLoading"
            @click="handleJoin"
            size="large"
          >
            <template #icon><UserAddOutlined /></template>
            加入守护圈
          </a-button>
        </a-space>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message, Modal, Empty } from 'ant-design-vue';
import {
  TeamOutlined,
  UserOutlined,
  SafetyOutlined,
  PlusOutlined,
  UserAddOutlined,
  SearchOutlined,
  ReloadOutlined,
  SyncOutlined,
  MoreOutlined,
  EyeOutlined,
  SettingOutlined,
  CopyOutlined,
  HeartOutlined,
  CalendarOutlined,
} from '@ant-design/icons-vue';
import {
  getUserCirclesApi,
  createCircleApi,
  joinCircleApi,
  type Circle,
  type CreateCircleParams,
} from '#/api/guardian';

const router = useRouter();
const route = useRoute();

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

// 处理后的守护圈数据
const processedCircles = computed(() => {
  return circles.value.map(circle => ({
    ...circle,
    id: circle.id.toString(),
    name: circle.circle_name,
    description: circle.circle_desc,
    memberCount: circle.member_count || 0,
    maxMembers: circle.max_members,
    inviteCode: circle.invite_code,
    createdAt: circle.created_at,
    status: circle.status === 1 ? 'normal' : 'disabled'
  }));
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
  name: [
    { required: true, message: '请输入守护圈名称' },
    { min: 2, max: 50, message: '守护圈名称长度应在2-50个字符之间' },
    { pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/, message: '守护圈名称只能包含中文、英文、数字和空格' }
  ],
  description: [
    { max: 200, message: '描述不能超过200个字符' }
  ],
  maxMembers: [
    { required: true, message: '请设置最大成员数' },
    { type: 'number', min: 2, max: 100, message: '最大成员数应在2-100之间' }
  ],
};

// 加入守护圈
const showJoinModal = ref(false);
const joinLoading = ref(false);
const joinFormRef = ref();
const joinForm = reactive({
  inviteCode: '',
});

const joinRules = {
  inviteCode: [
    { required: true, message: '请输入邀请码' },
    { len: 6, message: '邀请码必须是6位' },
    { pattern: /^[A-Z0-9]{6}$/, message: '邀请码只能包含大写字母和数字' }
  ],
};

// 获取守护圈列表
const fetchCircles = async () => {
  loading.value = true;
  try {
    const response = await getUserCirclesApi();
    if (response.code === 200) {
      let filteredCircles = response.data || [];
      
      // 应用搜索和状态过滤
      if (searchKeyword.value) {
        filteredCircles = filteredCircles.filter(circle => 
          circle.circle_name?.toLowerCase().includes(searchKeyword.value.toLowerCase())
        );
      }
      
      if (statusFilter.value) {
        const statusValue = statusFilter.value === 'normal' ? 1 : 0;
        filteredCircles = filteredCircles.filter(circle => circle.status === statusValue);
      }
      
      circles.value = filteredCircles;
      total.value = filteredCircles.length;
      
      if (filteredCircles.length === 0 && (response.data || []).length > 0) {
        message.info('没有找到符合条件的守护圈');
      } else if ((response.data || []).length > 0) {
        message.success(`成功获取 ${(response.data || []).length} 个守护圈`);
      }
    } else {
      message.error(response.message || '获取守护圈列表失败');
    }
  } catch (error: any) {
    console.error('获取守护圈列表失败:', error);
    message.error('网络错误，请检查网络连接');
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
    
    const apiData = {
      circleName: createForm.name.trim(),
      description: createForm.description.trim(),
      maxMembers: createForm.maxMembers,
    };
    
    const response = await createCircleApi(apiData);
    
    if (response.code === 200) {
      message.success('守护圈创建成功！');
      showCreateModal.value = false;
      resetCreateForm();
      await fetchCircles();
      
      if (response.data?.invite_code) {
        Modal.success({
          title: '创建成功',
          content: `守护圈已创建成功！邀请码：${response.data.invite_code}`,
          okText: '知道了',
        });
      }
    } else {
      message.error(response.message || '创建守护圈失败');
    }
  } catch (error: any) {
    console.error('创建守护圈失败:', error);
    const errorMessage = getErrorMessage(error, '创建守护圈失败');
    message.error(errorMessage);
  } finally {
    createLoading.value = false;
  }
};

// 加入守护圈
const handleJoin = async () => {
  try {
    await joinFormRef.value.validate();
    joinLoading.value = true;
    
    const inviteCode = joinForm.inviteCode.toUpperCase().trim();
    const response = await joinCircleApi(inviteCode);
    
    if (response.code === 200) {
      message.success('成功加入守护圈！');
      showJoinModal.value = false;
      resetJoinForm();
      await fetchCircles();
      
      if (response.data?.circle_name) {
        Modal.success({
          title: '加入成功',
          content: `欢迎加入「${response.data.circle_name}」守护圈！`,
          okText: '开始使用',
        });
      }
    } else {
      message.error(response.message || '加入守护圈失败');
    }
  } catch (error: any) {
    console.error('加入守护圈失败:', error);
    const errorMessage = getErrorMessage(error, '加入守护圈失败');
    message.error(errorMessage);
  } finally {
    joinLoading.value = false;
  }
};

// 工具函数
const getErrorMessage = (error: any, defaultMessage: string) => {
  if (error.response) {
    const status = error.response.status;
    const errorMap: Record<number, string> = {
      400: '请求参数有误，请检查输入信息',
      401: '登录已过期，请重新登录',
      403: '没有权限执行此操作',
      404: '资源不存在或已过期',
      409: '资源冲突或已存在',
      423: '资源已锁定或已满',
      500: '服务器错误，请稍后重试',
    };
    return errorMap[status] || error.response.data?.message || defaultMessage;
  }
  return error.message || defaultMessage;
};

const resetCreateForm = () => {
  createFormRef.value?.resetFields();
  Object.assign(createForm, {
    name: '',
    description: '',
    maxMembers: 10,
  });
};

const resetJoinForm = () => {
  joinFormRef.value?.resetFields();
  joinForm.inviteCode = '';
};

// 页面操作
const viewCircleDetail = (id: string) => {
  router.push(`/guardian/circles/${id}`);
};

const editCircle = (circle: any) => {
  router.push(`/guardian/circles/${circle.id}?tab=settings`);
};

const viewMembers = (circle: any) => {
  router.push(`/guardian/circles/${circle.id}?tab=members`);
};

// 状态相关
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    normal: 'green',
    disabled: 'red',
  };
  return colorMap[status] || 'blue';
};

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    normal: '正常',
    disabled: '已禁用',
  };
  return textMap[status] || status;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

// 邀请码处理
const handleInviteCodeInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const value = target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  joinForm.inviteCode = value;
};

const handleInviteCodePaste = (e: ClipboardEvent) => {
  e.preventDefault();
  const paste = e.clipboardData?.getData('text') || '';
  const cleanPaste = paste.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  joinForm.inviteCode = cleanPaste;
};

const copyInviteCode = async (inviteCode: string) => {
  try {
    await navigator.clipboard.writeText(inviteCode);
    message.success('邀请码已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    message.error('复制失败，请手动复制');
  }
};

// 弹窗关闭
const handleCreateCancel = () => {
  showCreateModal.value = false;
  resetCreateForm();
};

const handleJoinCancel = () => {
  showJoinModal.value = false;
  resetJoinForm();
};

// 生命周期
onMounted(() => {
  fetchCircles();
  
  // 处理URL参数
  const action = route.query.action as string;
  if (action === 'create') {
    showCreateModal.value = true;
  }
});
</script>

<style scoped lang="less">
.guardian-circles {
  padding: 24px;
  background: var(--ant-color-bg-layout);
  min-height: 100vh;

  // 页面头部
  .page-header {
    margin-bottom: 24px;

    .header-card {
      background: linear-gradient(135deg, 
        var(--ant-color-primary) 0%, 
        var(--ant-color-primary-active) 100%);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(24, 144, 255, 0.15);
      border: none;
      
      :deep(.ant-card-body) {
        padding: 32px;
      }
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      @media (max-width: 768px) {
        flex-direction: column;
        gap: 24px;
        text-align: center;
      }
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .header-icon {
      width: 64px;
      height: 64px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: white;
      backdrop-filter: blur(10px);
    }

    .header-title {
      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: white;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      p {
        margin: 8px 0 0 0;
        color: rgba(255, 255, 255, 0.9);
        font-size: 16px;
        font-weight: 400;
      }
    }

    .header-actions {
      .action-button {
        height: 48px;
        padding: 0 24px;
        border-radius: 24px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s ease;
        
        &.join-button {
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          backdrop-filter: blur(10px);
          
          &:hover {
            background: rgba(255, 255, 255, 0.25);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          }
        }
        
        &.create-button {
          background: white;
          border: 2px solid white;
          color: var(--ant-color-primary);
          
          &:hover {
            background: rgba(255, 255, 255, 0.95);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          }
        }
      }
    }
  }

  // 搜索区域
  .search-section {
    margin-bottom: 24px;

    .search-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--ant-color-text);
      
      .search-icon {
        color: var(--ant-color-primary);
      }
    }

    .search-item {
      .search-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--ant-color-text);
        font-size: 14px;
      }
    }
  }

  // 统计区域
  .stats-section {
    margin-bottom: 24px;

    .stat-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid var(--ant-color-border-secondary);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }
      
      :deep(.ant-card-body) {
        padding: 24px;
      }
    }
  }

  // 守护圈区域
  .circles-section {
    margin-bottom: 24px;

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;

      .loading-icon {
        font-size: 48px;
        color: var(--ant-color-primary);
        animation: spin 1s linear infinite;
      }

      .loading-text {
        margin-top: 24px;
        
        h3 {
          margin: 0 0 8px 0;
          color: var(--ant-color-text);
          font-size: 18px;
          font-weight: 600;
        }
        
        p {
          margin: 0;
          color: var(--ant-color-text-secondary);
          font-size: 14px;
        }
      }
    }

    .cards-container {
      .circle-card {
        height: 100%;
        border-radius: 16px;
        overflow: hidden;
        transition: all 0.3s ease;
        background: var(--ant-color-bg-container);
        border: 1px solid var(--ant-color-border-secondary);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        
        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(24, 144, 255, 0.15);
          border-color: var(--ant-color-primary-border-hover);
        }

        :deep(.ant-card-body) {
          padding: 0;
        }

        .circle-cover {
          position: relative;
          height: 140px;
          overflow: hidden;

          .cover-background {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, 
              var(--ant-color-primary) 0%, 
              var(--ant-color-primary-active) 50%,
              var(--ant-color-primary-hover) 100%);

            .cover-pattern {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-image: 
                radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
            }
          }

          .cover-content {
            position: relative;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;

            .circle-avatar {
              width: 80px;
              height: 80px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 36px;
              color: white;
              backdrop-filter: blur(10px);
              border: 3px solid rgba(255, 255, 255, 0.3);
              transition: all 0.3s ease;
            }

            .circle-badge {
              position: absolute;
              top: 20px;
              left: 20px;
              width: 32px;
              height: 32px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              backdrop-filter: blur(10px);
              
              .heart-icon {
                color: #ff4d4f;
                font-size: 16px;
                animation: heartbeat 2s ease-in-out infinite;
              }
            }
          }

          .circle-status {
            position: absolute;
            top: 16px;
            right: 16px;
            z-index: 3;
            border-radius: 12px;
            font-weight: 500;
          }
        }

        .circle-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--ant-color-border-secondary);

          .circle-title-section {
            flex: 1;
            
            .circle-title {
              margin: 0 0 4px 0;
              font-size: 16px;
              font-weight: 600;
              color: var(--ant-color-text);
              line-height: 1.4;
            }
            
            .circle-description {
              margin: 0;
              font-size: 12px;
              color: var(--ant-color-text-tertiary);
              line-height: 1.4;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }
          }

          .more-button {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            
            &:hover {
              background: var(--ant-color-fill-tertiary);
              color: var(--ant-color-primary);
            }
          }
        }

        .circle-info {
          padding: 16px 20px;

          .info-row {
            margin-bottom: 16px;
            
            &:last-child {
              margin-bottom: 0;
            }
          }

          .info-item {
            .info-header {
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 8px;
              
              .info-icon {
                color: var(--ant-color-primary);
                font-size: 14px;
              }
              
              .info-label {
                color: var(--ant-color-text-secondary);
                font-size: 12px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
            }

            .info-value {
              color: var(--ant-color-text);
              font-weight: 600;
              font-size: 14px;
            }

            &.members-info {
              .members-display {
                display: flex;
                align-items: center;
                gap: 12px;
                
                .members-progress {
                  flex: 1;
                  max-width: 80px;
                }
                
                .members-count {
                  color: var(--ant-color-text);
                  font-weight: 600;
                  font-size: 14px;
                }
              }
            }

            &.invite-item {
              .invite-code-container {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                
                &:hover {
                  .invite-code-tag {
                    background: var(--ant-color-primary-hover);
                  }
                  
                  .copy-icon {
                    color: var(--ant-color-primary);
                  }
                }
                
                .invite-code-tag {
                  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                  font-weight: 600;
                  letter-spacing: 1px;
                  transition: all 0.3s ease;
                }
                
                .copy-icon {
                  color: var(--ant-color-text-tertiary);
                  font-size: 12px;
                  transition: all 0.3s ease;
                }
              }
            }
          }
        }

        .card-actions {
          display: flex;
          justify-content: center;
          gap: 8px;
          padding: 16px 20px;
          border-top: 1px solid var(--ant-color-border-secondary);
          background: var(--ant-color-fill-quaternary);
          
          .action-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            border: 1px solid transparent;
            
            &:hover {
              background: var(--ant-color-primary-bg-hover);
              color: var(--ant-color-primary);
              transform: scale(1.1);
              border-color: var(--ant-color-primary-border);
              box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
            }
            
            &.copy-btn:hover {
              background: var(--ant-color-success-bg-hover);
              color: var(--ant-color-success);
              border-color: var(--ant-color-success-border);
              box-shadow: 0 2px 8px rgba(82, 196, 26, 0.2);
            }
          }
        }
      }
    }

    .empty-container {
      padding: 60px 20px;
      text-align: center;
      
      .empty-content {
        margin-bottom: 32px;
        
        h2 {
          font-size: 24px;
          font-weight: 700;
          color: var(--ant-color-text);
          margin-bottom: 12px;
        }
        
        .empty-subtitle {
          font-size: 16px;
          color: var(--ant-color-text-secondary);
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        .empty-description {
          font-size: 14px;
          color: var(--ant-color-text-tertiary);
        }
      }
      
      .empty-actions {
        .primary-action {
          height: 48px;
          padding: 0 32px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 24px;
          box-shadow: 0 4px 16px rgba(24, 144, 255, 0.3);
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
          }
        }
        
        .secondary-action {
          height: 48px;
          padding: 0 32px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 24px;
          border: 2px solid var(--ant-color-border);
          
          &:hover {
            border-color: var(--ant-color-primary);
            color: var(--ant-color-primary);
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(24, 144, 255, 0.1);
          }
        }
      }
    }
  }

  // 分页
  .pagination-section {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
}

// 动画效果
@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .guardian-circles {
    padding: 16px;
    
    .page-header {
      .header-card {
        :deep(.ant-card-body) {
          padding: 24px;
        }
      }
      
      .header-content {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }
    }

    .circles-section {
      .cards-container {
        .circle-card {
          .circle-info {
            padding: 16px;
          }
        }
      }
    }
  }
}
</style>