<template>
  <div class="guardian-settings">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>{{ $t('guardian.settings.title') }}</h1>
          <p>管理您的 Guardian 系统设置和偏好</p>
        </div>
        <div class="header-actions">
          <a-space>
            <a-button @click="resetToDefault">
              <template #icon><ReloadOutlined /></template>
              恢复默认
            </a-button>
            <a-button type="primary" @click="saveAllSettings" :loading="saving">
              <template #icon><SaveOutlined /></template>
              保存设置
            </a-button>
          </a-space>
        </div>
      </div>
    </div>

    <div class="settings-container">
      <a-row :gutter="[24, 24]">
        <!-- 左侧菜单 -->
        <a-col :xs="24" :md="6">
          <a-card :bordered="false" class="settings-menu">
            <a-menu
              v-model:selectedKeys="selectedKeys"
              mode="inline"
              :items="menuItems"
              @click="handleMenuClick"
            />
          </a-card>
        </a-col>

        <!-- 右侧内容 -->
        <a-col :xs="24" :md="18">
          <!-- 基本设置 -->
          <div v-show="activeTab === 'basic'" class="settings-panel">
            <a-card title="基本设置" :bordered="false">
              <a-form
                ref="basicFormRef"
                :model="basicSettings"
                layout="vertical"
                :rules="basicRules"
              >
                <a-row :gutter="[24, 16]">
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="系统名称" name="systemName">
                      <a-input v-model:value="basicSettings.systemName" placeholder="请输入系统名称" />
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="系统描述" name="systemDescription">
                      <a-input v-model:value="basicSettings.systemDescription" placeholder="请输入系统描述" />
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="默认语言" name="defaultLanguage">
                      <a-select v-model:value="basicSettings.defaultLanguage" placeholder="选择默认语言">
                        <a-select-option value="zh-CN">简体中文</a-select-option>
                        <a-select-option value="en-US">English</a-select-option>
                        <a-select-option value="ja-JP">日本語</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="时区设置" name="timezone">
                      <a-select v-model:value="basicSettings.timezone" placeholder="选择时区">
                        <a-select-option value="Asia/Shanghai">北京时间 (UTC+8)</a-select-option>
                        <a-select-option value="America/New_York">纽约时间 (UTC-5)</a-select-option>
                        <a-select-option value="Europe/London">伦敦时间 (UTC+0)</a-select-option>
                        <a-select-option value="Asia/Tokyo">东京时间 (UTC+9)</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24">
                    <a-form-item label="系统 Logo" name="systemLogo">
                      <a-upload
                        v-model:file-list="logoFileList"
                        name="logo"
                        list-type="picture-card"
                        class="logo-uploader"
                        :show-upload-list="false"
                        :before-upload="beforeUpload"
                        @change="handleLogoChange"
                      >
                        <img v-if="basicSettings.systemLogo" :src="basicSettings.systemLogo" alt="logo" class="logo-preview" />
                        <div v-else class="upload-placeholder">
                          <PlusOutlined />
                          <div class="ant-upload-text">上传 Logo</div>
                        </div>
                      </a-upload>
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24">
                    <a-form-item label="功能开关">
                      <div class="feature-switches">
                        <div class="switch-item">
                          <span>启用设备自动绑定</span>
                          <a-switch v-model:checked="basicSettings.autoDeviceBinding" />
                        </div>
                        <div class="switch-item">
                          <span>启用实时位置追踪</span>
                          <a-switch v-model:checked="basicSettings.realtimeTracking" />
                        </div>
                        <div class="switch-item">
                          <span>启用数据统计分析</span>
                          <a-switch v-model:checked="basicSettings.dataAnalytics" />
                        </div>
                        <div class="switch-item">
                          <span>启用系统维护模式</span>
                          <a-switch v-model:checked="basicSettings.maintenanceMode" />
                        </div>
                      </div>
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-form>
            </a-card>
          </div>

          <!-- 通知设置 -->
          <div v-show="activeTab === 'notification'" class="settings-panel">
            <a-card title="通知设置" :bordered="false">
              <a-form
                ref="notificationFormRef"
                :model="notificationSettings"
                layout="vertical"
              >
                <a-row :gutter="[24, 16]">
                  <a-col :xs="24">
                    <a-form-item label="通知方式">
                      <a-checkbox-group v-model:value="notificationSettings.methods">
                        <a-row :gutter="[16, 16]">
                          <a-col :xs="24" :sm="12">
                            <a-checkbox value="email">
                              <MailOutlined /> 邮件通知
                            </a-checkbox>
                          </a-col>
                          <a-col :xs="24" :sm="12">
                            <a-checkbox value="sms">
                              <MessageOutlined /> 短信通知
                            </a-checkbox>
                          </a-col>
                          <a-col :xs="24" :sm="12">
                            <a-checkbox value="push">
                              <BellOutlined /> 推送通知
                            </a-checkbox>
                          </a-col>
                          <a-col :xs="24" :sm="12">
                            <a-checkbox value="webhook">
                              <ApiOutlined /> Webhook
                            </a-checkbox>
                          </a-col>
                        </a-row>
                      </a-checkbox-group>
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="邮件服务器" name="emailServer">
                      <a-input v-model:value="notificationSettings.emailServer" placeholder="smtp.example.com" />
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="邮件端口" name="emailPort">
                      <a-input-number v-model:value="notificationSettings.emailPort" :min="1" :max="65535" style="width: 100%" />
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="发件人邮箱" name="senderEmail">
                      <a-input v-model:value="notificationSettings.senderEmail" placeholder="noreply@example.com" />
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="邮箱密码" name="emailPassword">
                      <a-input-password v-model:value="notificationSettings.emailPassword" placeholder="请输入邮箱密码" />
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24">
                    <a-form-item label="Webhook URL" name="webhookUrl">
                      <a-input v-model:value="notificationSettings.webhookUrl" placeholder="https://your-webhook-url.com" />
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24">
                    <a-form-item label="通知模板">
                      <a-tabs v-model:activeKey="templateTab">
                        <a-tab-pane key="email" tab="邮件模板">
                          <a-textarea
                            v-model:value="notificationSettings.templates.email"
                            :rows="6"
                            placeholder="邮件通知模板，支持变量：{deviceName}, {alertType}, {timestamp}"
                          />
                        </a-tab-pane>
                        <a-tab-pane key="sms" tab="短信模板">
                          <a-textarea
                            v-model:value="notificationSettings.templates.sms"
                            :rows="4"
                            placeholder="短信通知模板，支持变量：{deviceName}, {alertType}, {timestamp}"
                          />
                        </a-tab-pane>
                        <a-tab-pane key="push" tab="推送模板">
                          <a-textarea
                            v-model:value="notificationSettings.templates.push"
                            :rows="4"
                            placeholder="推送通知模板，支持变量：{deviceName}, {alertType}, {timestamp}"
                          />
                        </a-tab-pane>
                      </a-tabs>
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24">
                    <a-form-item>
                      <a-button @click="testNotification" :loading="testing">
                        <template #icon><SendOutlined /></template>
                        测试通知
                      </a-button>
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-form>
            </a-card>
          </div>

          <!-- 安全设置 -->
          <div v-show="activeTab === 'security'" class="settings-panel">
            <a-card title="安全设置" :bordered="false">
              <a-form
                ref="securityFormRef"
                :model="securitySettings"
                layout="vertical"
              >
                <a-row :gutter="[24, 16]">
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="密码策略">
                      <div class="password-policy">
                        <div class="policy-item">
                          <span>最小长度：</span>
                          <a-input-number v-model:value="securitySettings.passwordPolicy.minLength" :min="6" :max="32" />
                        </div>
                        <div class="policy-item">
                          <span>要求大写字母</span>
                          <a-switch v-model:checked="securitySettings.passwordPolicy.requireUppercase" />
                        </div>
                        <div class="policy-item">
                          <span>要求小写字母</span>
                          <a-switch v-model:checked="securitySettings.passwordPolicy.requireLowercase" />
                        </div>
                        <div class="policy-item">
                          <span>要求数字</span>
                          <a-switch v-model:checked="securitySettings.passwordPolicy.requireNumbers" />
                        </div>
                        <div class="policy-item">
                          <span>要求特殊字符</span>
                          <a-switch v-model:checked="securitySettings.passwordPolicy.requireSpecialChars" />
                        </div>
                      </div>
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="会话设置">
                      <div class="session-settings">
                        <div class="setting-item">
                          <span>会话超时时间（分钟）：</span>
                          <a-input-number v-model:value="securitySettings.sessionTimeout" :min="5" :max="1440" />
                        </div>
                        <div class="setting-item">
                          <span>最大登录尝试次数：</span>
                          <a-input-number v-model:value="securitySettings.maxLoginAttempts" :min="3" :max="10" />
                        </div>
                        <div class="setting-item">
                          <span>账户锁定时间（分钟）：</span>
                          <a-input-number v-model:value="securitySettings.lockoutDuration" :min="5" :max="60" />
                        </div>
                      </div>
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24">
                    <a-form-item label="双因素认证">
                      <div class="two-factor-auth">
                        <div class="auth-item">
                          <span>启用双因素认证</span>
                          <a-switch v-model:checked="securitySettings.twoFactorAuth.enabled" />
                        </div>
                        <div v-if="securitySettings.twoFactorAuth.enabled" class="auth-methods">
                          <a-checkbox-group v-model:value="securitySettings.twoFactorAuth.methods">
                            <a-checkbox value="totp">TOTP (Google Authenticator)</a-checkbox>
                            <a-checkbox value="sms">短信验证码</a-checkbox>
                            <a-checkbox value="email">邮箱验证码</a-checkbox>
                          </a-checkbox-group>
                        </div>
                      </div>
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24">
                    <a-form-item label="IP 白名单">
                      <div class="ip-whitelist">
                        <div class="whitelist-header">
                          <span>允许访问的 IP 地址</span>
                          <a-button type="link" @click="addIpRule">
                            <PlusOutlined /> 添加规则
                          </a-button>
                        </div>
                        <div class="ip-rules">
                          <div
                            v-for="(rule, index) in securitySettings.ipWhitelist"
                            :key="index"
                            class="ip-rule"
                          >
                            <a-input v-model:value="rule.ip" placeholder="IP 地址或 CIDR" />
                            <a-input v-model:value="rule.description" placeholder="描述" />
                            <a-button type="text" danger @click="removeIpRule(index)">
                              <DeleteOutlined />
                            </a-button>
                          </div>
                        </div>
                      </div>
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-form>
            </a-card>
          </div>

          <!-- 数据设置 -->
          <div v-show="activeTab === 'data'" class="settings-panel">
            <a-card title="数据设置" :bordered="false">
              <a-form
                ref="dataFormRef"
                :model="dataSettings"
                layout="vertical"
              >
                <a-row :gutter="[24, 16]">
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="数据保留策略">
                      <div class="retention-policy">
                        <div class="policy-item">
                          <span>设备数据保留天数：</span>
                          <a-input-number v-model:value="dataSettings.retentionPolicy.deviceData" :min="1" :max="3650" />
                        </div>
                        <div class="policy-item">
                          <span>事件数据保留天数：</span>
                          <a-input-number v-model:value="dataSettings.retentionPolicy.eventData" :min="1" :max="3650" />
                        </div>
                        <div class="policy-item">
                          <span>告警数据保留天数：</span>
                          <a-input-number v-model:value="dataSettings.retentionPolicy.alertData" :min="1" :max="3650" />
                        </div>
                        <div class="policy-item">
                          <span>用户日志保留天数：</span>
                          <a-input-number v-model:value="dataSettings.retentionPolicy.userLogs" :min="1" :max="3650" />
                        </div>
                      </div>
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="备份设置">
                      <div class="backup-settings">
                        <div class="setting-item">
                          <span>启用自动备份</span>
                          <a-switch v-model:checked="dataSettings.backup.enabled" />
                        </div>
                        <div v-if="dataSettings.backup.enabled">
                          <div class="setting-item">
                            <span>备份频率：</span>
                            <a-select v-model:value="dataSettings.backup.frequency" style="width: 120px">
                              <a-select-option value="daily">每日</a-select-option>
                              <a-select-option value="weekly">每周</a-select-option>
                              <a-select-option value="monthly">每月</a-select-option>
                            </a-select>
                          </div>
                          <div class="setting-item">
                            <span>备份时间：</span>
                            <a-time-picker v-model:value="dataSettings.backup.time" format="HH:mm" />
                          </div>
                          <div class="setting-item">
                            <span>保留备份数量：</span>
                            <a-input-number v-model:value="dataSettings.backup.keepCount" :min="1" :max="30" />
                          </div>
                        </div>
                      </div>
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24">
                    <a-form-item label="数据导出">
                      <div class="data-export">
                        <a-space direction="vertical" style="width: 100%">
                          <div class="export-item">
                            <span>导出格式：</span>
                            <a-radio-group v-model:value="exportFormat">
                              <a-radio value="csv">CSV</a-radio>
                              <a-radio value="excel">Excel</a-radio>
                              <a-radio value="json">JSON</a-radio>
                            </a-radio-group>
                          </div>
                          <div class="export-actions">
                            <a-space>
                              <a-button @click="exportData('devices')" :loading="exporting.devices">
                                <template #icon><DownloadOutlined /></template>
                                导出设备数据
                              </a-button>
                              <a-button @click="exportData('events')" :loading="exporting.events">
                                <template #icon><DownloadOutlined /></template>
                                导出事件数据
                              </a-button>
                              <a-button @click="exportData('alerts')" :loading="exporting.alerts">
                                <template #icon><DownloadOutlined /></template>
                                导出告警数据
                              </a-button>
                              <a-button @click="exportData('users')" :loading="exporting.users">
                                <template #icon><DownloadOutlined /></template>
                                导出用户数据
                              </a-button>
                            </a-space>
                          </div>
                        </a-space>
                      </div>
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24">
                    <a-form-item label="数据清理">
                      <div class="data-cleanup">
                        <a-alert
                          message="危险操作"
                          description="以下操作将永久删除数据，请谨慎操作"
                          type="warning"
                          show-icon
                          style="margin-bottom: 16px"
                        />
                        <a-space>
                          <a-button danger @click="cleanupData('expired')" :loading="cleaning.expired">
                            <template #icon><DeleteOutlined /></template>
                            清理过期数据
                          </a-button>
                          <a-button danger @click="cleanupData('logs')" :loading="cleaning.logs">
                            <template #icon><DeleteOutlined /></template>
                            清理系统日志
                          </a-button>
                          <a-button danger @click="cleanupData('temp')" :loading="cleaning.temp">
                            <template #icon><DeleteOutlined /></template>
                            清理临时文件
                          </a-button>
                        </a-space>
                      </div>
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-form>
            </a-card>
          </div>

          <!-- 系统信息 -->
          <div v-show="activeTab === 'system'" class="settings-panel">
            <a-card title="系统信息" :bordered="false">
              <a-row :gutter="[24, 24]">
                <a-col :xs="24" :md="12">
                  <a-card title="系统状态" size="small">
                    <a-descriptions :column="1" size="small">
                      <a-descriptions-item label="系统版本">
                        <a-tag color="blue">{{ systemInfo.version }}</a-tag>
                      </a-descriptions-item>
                      <a-descriptions-item label="运行时间">
                        {{ systemInfo.uptime }}
                      </a-descriptions-item>
                      <a-descriptions-item label="系统状态">
                        <a-badge :status="systemInfo.status === 'healthy' ? 'success' : 'error'" :text="getStatusText(systemInfo.status)" />
                      </a-descriptions-item>
                      <a-descriptions-item label="最后更新">
                        {{ formatTime(systemInfo.lastUpdate) }}
                      </a-descriptions-item>
                    </a-descriptions>
                  </a-card>
                </a-col>
                <a-col :xs="24" :md="12">
                  <a-card title="资源使用" size="small">
                    <div class="resource-usage">
                      <div class="usage-item">
                        <span>CPU 使用率</span>
                        <a-progress :percent="systemInfo.resources.cpu" size="small" />
                      </div>
                      <div class="usage-item">
                        <span>内存使用率</span>
                        <a-progress :percent="systemInfo.resources.memory" size="small" />
                      </div>
                      <div class="usage-item">
                        <span>磁盘使用率</span>
                        <a-progress :percent="systemInfo.resources.disk" size="small" />
                      </div>
                      <div class="usage-item">
                        <span>网络流量</span>
                        <span class="network-info">
                          ↑ {{ formatBytes(systemInfo.resources.networkUp) }}/s
                          ↓ {{ formatBytes(systemInfo.resources.networkDown) }}/s
                        </span>
                      </div>
                    </div>
                  </a-card>
                </a-col>
                <a-col :xs="24">
                  <a-card title="服务状态" size="small">
                    <a-row :gutter="[16, 16]">
                      <a-col :xs="24" :sm="12" :md="6" v-for="service in systemInfo.services" :key="service.name">
                        <div class="service-item">
                          <div class="service-header">
                            <span class="service-name">{{ service.name }}</span>
                            <a-badge :status="service.status === 'running' ? 'success' : 'error'" />
                          </div>
                          <div class="service-info">
                            <div>端口: {{ service.port }}</div>
                            <div>PID: {{ service.pid }}</div>
                            <div>内存: {{ formatBytes(service.memory) }}</div>
                          </div>
                        </div>
                      </a-col>
                    </a-row>
                  </a-card>
                </a-col>
                <a-col :xs="24">
                  <a-card title="系统操作" size="small">
                    <a-space>
                      <a-button @click="checkUpdate" :loading="checking">
                        <template #icon><SyncOutlined /></template>
                        检查更新
                      </a-button>
                      <a-button @click="restartService" :loading="restarting">
                        <template #icon><ReloadOutlined /></template>
                        重启服务
                      </a-button>
                      <a-button @click="downloadLogs">
                        <template #icon><DownloadOutlined /></template>
                        下载日志
                      </a-button>
                      <a-button danger @click="confirmSystemReset">
                        <template #icon><ExclamationCircleOutlined /></template>
                        系统重置
                      </a-button>
                    </a-space>
                  </a-card>
                </a-col>
              </a-row>
            </a-card>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
  BellOutlined,
  ShieldOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  MailOutlined,
  MessageOutlined,
  ApiOutlined,
  SendOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons-vue';

// 响应式数据
const selectedKeys = ref(['basic']);
const activeTab = ref('basic');
const saving = ref(false);
const testing = ref(false);
const checking = ref(false);
const restarting = ref(false);
const templateTab = ref('email');
const exportFormat = ref('csv');

// 表单引用
const basicFormRef = ref();
const notificationFormRef = ref();
const securityFormRef = ref();
const dataFormRef = ref();

// Logo 上传
const logoFileList = ref([]);

// 导出和清理状态
const exporting = reactive({
  devices: false,
  events: false,
  alerts: false,
  users: false,
});

const cleaning = reactive({
  expired: false,
  logs: false,
  temp: false,
});

// 菜单项
const menuItems = [
  {
    key: 'basic',
    icon: SettingOutlined,
    label: '基本设置',
  },
  {
    key: 'notification',
    icon: BellOutlined,
    label: '通知设置',
  },
  {
    key: 'security',
    icon: ShieldOutlined,
    label: '安全设置',
  },
  {
    key: 'data',
    icon: DatabaseOutlined,
    label: '数据设置',
  },
  {
    key: 'system',
    icon: InfoCircleOutlined,
    label: '系统信息',
  },
];

// 基本设置
const basicSettings = reactive({
  systemName: 'Guardian 守护系统',
  systemDescription: '智能守护设备管理系统',
  defaultLanguage: 'zh-CN',
  timezone: 'Asia/Shanghai',
  systemLogo: '',
  autoDeviceBinding: true,
  realtimeTracking: true,
  dataAnalytics: true,
  maintenanceMode: false,
});

// 基本设置验证规则
const basicRules = {
  systemName: [
    { required: true, message: '请输入系统名称', trigger: 'blur' },
    { min: 2, max: 50, message: '系统名称长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  systemDescription: [
    { max: 200, message: '系统描述不能超过 200 个字符', trigger: 'blur' },
  ],
};

// 通知设置
const notificationSettings = reactive({
  methods: ['email', 'push'],
  emailServer: 'smtp.gmail.com',
  emailPort: 587,
  senderEmail: '',
  emailPassword: '',
  webhookUrl: '',
  templates: {
    email: '设备 {deviceName} 发生 {alertType} 告警，时间：{timestamp}',
    sms: '【Guardian】{deviceName} {alertType} {timestamp}',
    push: '{deviceName} 发生 {alertType} 告警',
  },
});

// 安全设置
const securitySettings = reactive({
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
  sessionTimeout: 120,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  twoFactorAuth: {
    enabled: false,
    methods: ['totp'],
  },
  ipWhitelist: [
    { ip: '127.0.0.1', description: '本地访问' },
    { ip: '192.168.1.0/24', description: '内网访问' },
  ],
});

// 数据设置
const dataSettings = reactive({
  retentionPolicy: {
    deviceData: 365,
    eventData: 180,
    alertData: 90,
    userLogs: 30,
  },
  backup: {
    enabled: true,
    frequency: 'daily',
    time: null,
    keepCount: 7,
  },
});

// 系统信息
const systemInfo = reactive({
  version: '1.0.0',
  uptime: '7天 12小时 30分钟',
  status: 'healthy',
  lastUpdate: '2024-01-15T10:30:00Z',
  resources: {
    cpu: 25,
    memory: 68,
    disk: 45,
    networkUp: 1024000,
    networkDown: 2048000,
  },
  services: [
    {
      name: 'Web Server',
      status: 'running',
      port: 3000,
      pid: 1234,
      memory: 128 * 1024 * 1024,
    },
    {
      name: 'MQTT Broker',
      status: 'running',
      port: 1883,
      pid: 1235,
      memory: 64 * 1024 * 1024,
    },
    {
      name: 'Database',
      status: 'running',
      port: 5432,
      pid: 1236,
      memory: 256 * 1024 * 1024,
    },
    {
      name: 'Redis Cache',
      status: 'running',
      port: 6379,
      pid: 1237,
      memory: 32 * 1024 * 1024,
    },
  ],
});

// 菜单点击
const handleMenuClick = ({ key }: { key: string }) => {
  activeTab.value = key;
};

// Logo 上传前检查
const beforeUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('只能上传 JPG/PNG 格式的图片!');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB!');
    return false;
  }
  return false; // 阻止自动上传
};

// Logo 上传处理
const handleLogoChange = (info: any) => {
  if (info.file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      basicSettings.systemLogo = e.target?.result as string;
    };
    reader.readAsDataURL(info.file);
  }
};

// 添加 IP 规则
const addIpRule = () => {
  securitySettings.ipWhitelist.push({
    ip: '',
    description: '',
  });
};

// 删除 IP 规则
const removeIpRule = (index: number) => {
  securitySettings.ipWhitelist.splice(index, 1);
};

// 测试通知
const testNotification = async () => {
  testing.value = true;
  try {
    // 这里应该调用测试通知的 API
    await new Promise(resolve => setTimeout(resolve, 2000));
    message.success('测试通知发送成功');
  } catch (error) {
    console.error('测试通知失败:', error);
    message.error('测试通知发送失败');
  } finally {
    testing.value = false;
  }
};

// 导出数据
const exportData = async (type: string) => {
  exporting[type] = true;
  try {
    // 这里应该调用导出数据的 API
    await new Promise(resolve => setTimeout(resolve, 2000));
    message.success(`${type} 数据导出成功`);
  } catch (error) {
    console.error('导出数据失败:', error);
    message.error('导出数据失败');
  } finally {
    exporting[type] = false;
  }
};

// 清理数据
const cleanupData = async (type: string) => {
  Modal.confirm({
    title: '确认清理',
    content: `确定要清理 ${type} 数据吗？此操作不可恢复。`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      cleaning[type] = true;
      try {
        // 这里应该调用清理数据的 API
        await new Promise(resolve => setTimeout(resolve, 2000));
        message.success(`${type} 数据清理成功`);
      } catch (error) {
        console.error('清理数据失败:', error);
        message.error('清理数据失败');
      } finally {
        cleaning[type] = false;
      }
    },
  });
};

// 检查更新
const checkUpdate = async () => {
  checking.value = true;
  try {
    // 这里应该调用检查更新的 API
    await new Promise(resolve => setTimeout(resolve, 2000));
    message.info('当前已是最新版本');
  } catch (error) {
    console.error('检查更新失败:', error);
    message.error('检查更新失败');
  } finally {
    checking.value = false;
  }
};

// 重启服务
const restartService = async () => {
  Modal.confirm({
    title: '确认重启',
    content: '确定要重启系统服务吗？这将导致短暂的服务中断。',
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      restarting.value = true;
      try {
        // 这里应该调用重启服务的 API
        await new Promise(resolve => setTimeout(resolve, 3000));
        message.success('服务重启成功');
      } catch (error) {
        console.error('重启服务失败:', error);
        message.error('重启服务失败');
      } finally {
        restarting.value = false;
      }
    },
  });
};

// 下载日志
const downloadLogs = () => {
  // 这里应该调用下载日志的 API
  message.info('日志下载功能开发中');
};

// 确认系统重置
const confirmSystemReset = () => {
  Modal.confirm({
    title: '危险操作',
    content: '系统重置将清除所有数据和设置，恢复到初始状态。此操作不可恢复，请谨慎操作！',
    okText: '确认重置',
    cancelText: '取消',
    okType: 'danger',
    onOk: () => {
      message.info('系统重置功能开发中');
    },
  });
};

// 恢复默认设置
const resetToDefault = () => {
  Modal.confirm({
    title: '恢复默认设置',
    content: '确定要恢复所有设置到默认值吗？',
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      // 重置所有设置到默认值
      Object.assign(basicSettings, {
        systemName: 'Guardian 守护系统',
        systemDescription: '智能守护设备管理系统',
        defaultLanguage: 'zh-CN',
        timezone: 'Asia/Shanghai',
        systemLogo: '',
        autoDeviceBinding: true,
        realtimeTracking: true,
        dataAnalytics: true,
        maintenanceMode: false,
      });
      message.success('已恢复默认设置');
    },
  });
};

// 保存所有设置
const saveAllSettings = async () => {
  saving.value = true;
  try {
    // 验证所有表单
    await Promise.all([
      basicFormRef.value?.validate(),
      // 其他表单验证可以根据需要添加
    ]);
    
    // 这里应该调用保存设置的 API
    await new Promise(resolve => setTimeout(resolve, 2000));
    message.success('设置保存成功');
  } catch (error) {
    console.error('保存设置失败:', error);
    message.error('保存设置失败');
  } finally {
    saving.value = false;
  }
};

// 工具函数
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    healthy: '健康',
    warning: '警告',
    error: '错误',
  };
  return statusMap[status] || status;
};

const formatTime = (time: string) => {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 生命周期
onMounted(() => {
  // 初始化数据
  console.log('设置页面已加载');
});
</script>

<style scoped lang="less">
.guardian-settings {
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

  .settings-container {
    .settings-menu {
      :deep(.ant-menu) {
        border: none;
        background: transparent;
      }
    }

    .settings-panel {
      .feature-switches {
        .switch-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
        }
      }

      .password-policy {
        .policy-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .session-settings,
      .retention-policy {
        .setting-item,
        .policy-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .two-factor-auth {
        .auth-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .auth-methods {
          margin-top: 12px;
          padding-left: 16px;
        }
      }

      .ip-whitelist {
        .whitelist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .ip-rules {
          .ip-rule {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            align-items: center;

            .ant-input {
              flex: 1;
            }
          }
        }
      }

      .backup-settings {
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .data-export {
        .export-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .export-actions {
          margin-top: 16px;
        }
      }

      .data-cleanup {
        .ant-space {
          flex-wrap: wrap;
        }
      }

      .resource-usage {
        .usage-item {
          margin-bottom: 16px;

          &:last-child {
            margin-bottom: 0;
          }

          .network-info {
            font-family: monospace;
            font-size: 12px;
            color: #666;
          }
        }
      }

      .service-item {
        padding: 12px;
        border: 1px solid #f0f0f0;
        border-radius: 6px;
        background: #fafafa;

        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .service-name {
            font-weight: 500;
          }
        }

        .service-info {
          font-size: 12px;
          color: #666;

          div {
            margin-bottom: 2px;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
    }
  }

  .logo-uploader {
    :deep(.ant-upload) {
      width: 128px;
      height: 128px;
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: border-color 0.3s;

      &:hover {
        border-color: #1890ff;
      }
    }

    .logo-preview {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .upload-placeholder {
      text-align: center;
      color: #666;

      .anticon {
        font-size: 32px;
        margin-bottom: 8px;
        color: #999;
      }

      .ant-upload-text {
        font-size: 14px;
      }
    }
  }
}

:deep(.ant-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .ant-card-head {
    border-bottom: 1px solid #f0f0f0;

    .ant-card-head-title {
      font-weight: 600;
    }
  }
}

:deep(.ant-menu-item) {
  border-radius: 6px;
  margin-bottom: 4px;

  &.ant-menu-item-selected {
    background: #e6f7ff;
    border-color: #1890ff;
  }
}

:deep(.ant-descriptions-item-label) {
  font-weight: 500;
}

:deep(.ant-progress) {
  margin-bottom: 0;
}

:deep(.ant-badge) {
  .ant-badge-status-text {
    margin-left: 8px;
  }
}
</style>