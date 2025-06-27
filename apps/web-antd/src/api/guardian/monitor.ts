import { requestClient } from '#/api/request';

// 系统监控相关接口定义
export interface SystemStatus {
  uptime: string;
  status: 'normal' | 'warning' | 'error';
  version: string;
  environment: string;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    load: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    inbound: number;
    outbound: number;
    connections: number;
  };
}

export interface ServiceStatus {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'stopped' | 'error';
  health: number;
  port?: number;
  pid?: number;
  uptime: string;
  lastCheck: string;
  description: string;
  version?: string;
  config?: Record<string, any>;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  service?: string;
  source: string;
  details?: Record<string, any>;
}

export interface AlertInfo {
  id: string;
  type: 'system' | 'service' | 'performance';
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  source: string;
}

export interface PerformanceData {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: {
    inbound: number;
    outbound: number;
  };
  requests: number;
  responseTime: number;
}

export interface DatabaseStatus {
  status: 'connected' | 'disconnected' | 'error';
  responseTime: number;
  connections: {
    active: number;
    idle: number;
    total: number;
  };
  queries: {
    total: number;
    slow: number;
    failed: number;
  };
  size: {
    total: number;
    used: number;
  };
}

export interface ApiStats {
  status: 'healthy' | 'degraded' | 'down';
  qps: number;
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
  };
  errors: {
    rate: number;
    count: number;
  };
  endpoints: {
    path: string;
    method: string;
    count: number;
    avgTime: number;
    errorRate: number;
  }[];
}

// 查询参数接口
export interface LogQueryParams {
  level?: string;
  service?: string;
  startTime?: string;
  endTime?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface MetricsQueryParams {
  startTime?: string;
  endTime?: string;
  interval?: '1m' | '5m' | '15m' | '1h' | '1d';
}

export interface AlertQueryParams {
  level?: string;
  type?: string;
  resolved?: boolean;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

// API 函数

/**
 * 获取系统状态
 */
export function getSystemStatus() {
  return requestClient.get<SystemStatus>('/monitor/system/status');
}

/**
 * 获取系统指标
 */
export function getSystemMetrics() {
  return requestClient.get<SystemMetrics>('/monitor/system/metrics');
}

/**
 * 获取性能数据
 */
export function getPerformanceData(params?: MetricsQueryParams) {
  return requestClient.get<PerformanceData[]>('/monitor/performance', { params });
}

/**
 * 获取服务状态列表
 */
export function getServicesList() {
  return requestClient.get<ServiceStatus[]>('/monitor/services');
}

/**
 * 获取单个服务状态
 */
export function getServiceStatus(serviceId: string) {
  return requestClient.get<ServiceStatus>(`/monitor/services/${serviceId}`);
}

/**
 * 检查服务健康状态
 */
export function checkServiceHealth(serviceId: string) {
  return requestClient.post<{ health: number; status: string }>(`/monitor/services/${serviceId}/check`);
}

/**
 * 重启服务
 */
export function restartService(serviceId: string) {
  return requestClient.post<{ success: boolean; message: string }>(`/monitor/services/${serviceId}/restart`);
}

/**
 * 停止服务
 */
export function stopService(serviceId: string) {
  return requestClient.post<{ success: boolean; message: string }>(`/monitor/services/${serviceId}/stop`);
}

/**
 * 启动服务
 */
export function startService(serviceId: string) {
  return requestClient.post<{ success: boolean; message: string }>(`/monitor/services/${serviceId}/start`);
}

/**
 * 获取服务配置
 */
export function getServiceConfig(serviceId: string) {
  return requestClient.get<Record<string, any>>(`/monitor/services/${serviceId}/config`);
}

/**
 * 更新服务配置
 */
export function updateServiceConfig(serviceId: string, config: Record<string, any>) {
  return requestClient.put<{ success: boolean; message: string }>(`/monitor/services/${serviceId}/config`, config);
}

/**
 * 获取系统日志
 */
export function getSystemLogs(params?: LogQueryParams) {
  return requestClient.get<{
    logs: SystemLog[];
    total: number;
    page: number;
    pageSize: number;
  }>('/monitor/logs', { params });
}

/**
 * 获取服务日志
 */
export function getServiceLogs(serviceId: string, params?: LogQueryParams) {
  return requestClient.get<{
    logs: SystemLog[];
    total: number;
    page: number;
    pageSize: number;
  }>(`/monitor/services/${serviceId}/logs`, { params });
}

/**
 * 清空系统日志
 */
export function clearSystemLogs() {
  return requestClient.delete<{ success: boolean; message: string }>('/monitor/logs');
}

/**
 * 导出系统日志
 */
export function exportSystemLogs(params?: LogQueryParams) {
  return requestClient.get<Blob>('/monitor/logs/export', {
    params,
    responseType: 'blob',
  });
}

/**
 * 获取告警列表
 */
export function getAlerts(params?: AlertQueryParams) {
  return requestClient.get<{
    alerts: AlertInfo[];
    total: number;
    page: number;
    pageSize: number;
  }>('/monitor/alerts', { params });
}

/**
 * 获取告警统计
 */
export function getAlertStats() {
  return requestClient.get<{
    total: number;
    unresolved: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>('/monitor/alerts/stats');
}

/**
 * 标记告警为已解决
 */
export function resolveAlert(alertId: string) {
  return requestClient.post<{ success: boolean; message: string }>(`/monitor/alerts/${alertId}/resolve`);
}

/**
 * 批量解决告警
 */
export function resolveAlerts(alertIds: string[]) {
  return requestClient.post<{ success: boolean; message: string }>('/monitor/alerts/batch-resolve', {
    alertIds,
  });
}

/**
 * 删除告警
 */
export function deleteAlert(alertId: string) {
  return requestClient.delete<{ success: boolean; message: string }>(`/monitor/alerts/${alertId}`);
}

/**
 * 获取数据库状态
 */
export function getDatabaseStatus() {
  return requestClient.get<DatabaseStatus>('/monitor/database/status');
}

/**
 * 获取API统计信息
 */
export function getApiStats() {
  return requestClient.get<ApiStats>('/monitor/api/stats');
}

/**
 * 获取实时指标（WebSocket连接）
 */
export function subscribeRealTimeMetrics(callback: (data: PerformanceData) => void) {
  // 这里应该建立WebSocket连接
  // 暂时返回一个模拟的取消订阅函数
  const interval = setInterval(() => {
    callback({
      timestamp: new Date().toISOString(),
      cpu: Math.floor(Math.random() * 30) + 30,
      memory: Math.floor(Math.random() * 20) + 60,
      disk: Math.floor(Math.random() * 10) + 20,
      network: {
        inbound: Math.floor(Math.random() * 100) + 50,
        outbound: Math.floor(Math.random() * 80) + 30,
      },
      requests: Math.floor(Math.random() * 200) + 100,
      responseTime: Math.floor(Math.random() * 50) + 10,
    });
  }, 1000);

  return () => clearInterval(interval);
}

/**
 * 获取系统健康检查
 */
export function getHealthCheck() {
  return requestClient.get<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      name: string;
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      duration: number;
    }[];
    timestamp: string;
  }>('/monitor/health');
}

/**
 * 触发系统健康检查
 */
export function triggerHealthCheck() {
  return requestClient.post<{ success: boolean; message: string }>('/monitor/health/check');
}

/**
 * 获取系统信息
 */
export function getSystemInfo() {
  return requestClient.get<{
    hostname: string;
    platform: string;
    arch: string;
    nodeVersion: string;
    uptime: number;
    loadAverage: number[];
    totalMemory: number;
    freeMemory: number;
    cpuCount: number;
  }>('/monitor/system/info');
}