// 事件类型映射配置
// 用于统一前端显示和后端数据的事件类型

export interface EventTypeInfo {
  color: string;
  text: string;
  category: 'alert' | 'heartbeat' | 'status_change' | 'config_update' | 'device_online' | 'device_offline';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// 后端事件类型到前端显示的映射
export const EVENT_TYPE_MAPPING: Record<string, EventTypeInfo> = {
  // 告警类事件
  'fall_detection': {
    color: 'red',
    text: '跌倒检测',
    category: 'alert',
    severity: 'critical'
  },
  'sos_alert': {
    color: 'red',
    text: 'SOS求救',
    category: 'alert',
    severity: 'critical'
  },
  'stranger_detected': {
    color: 'orange',
    text: '陌生人检测',
    category: 'alert',
    severity: 'medium'
  },
  'motion_detected': {
    color: 'blue',
    text: '运动检测',
    category: 'alert',
    severity: 'low'
  },
  'door_opened': {
    color: 'cyan',
    text: '门禁开启',
    category: 'alert',
    severity: 'low'
  },
  'smoke_detected': {
    color: 'red',
    text: '烟雾检测',
    category: 'alert',
    severity: 'high'
  },
  'temperature_alert': {
    color: 'orange',
    text: '温度告警',
    category: 'alert',
    severity: 'medium'
  },
  'low_battery': {
    color: 'yellow',
    text: '电量不足',
    category: 'alert',
    severity: 'low'
  },
  
  // 设备状态类事件
  'device_offline': {
    color: 'red',
    text: '设备离线',
    category: 'device_offline',
    severity: 'medium'
  },
  'device_online': {
    color: 'green',
    text: '设备上线',
    category: 'device_online',
    severity: 'low'
  },
  
  // 心跳类事件
  'heartbeat': {
    color: 'green',
    text: '心跳',
    category: 'heartbeat',
    severity: 'low'
  },
  
  // 状态变更类事件
  'status_change': {
    color: 'blue',
    text: '状态变更',
    category: 'status_change',
    severity: 'low'
  },
  
  // 配置更新类事件
  'config_update': {
    color: 'orange',
    text: '配置更新',
    category: 'config_update',
    severity: 'low'
  },
  
  // 传统告警类型（兼容现有数据）
  'alert': {
    color: 'red',
    text: '告警',
    category: 'alert',
    severity: 'medium'
  },
  'sensor_error': {
    color: 'red',
    text: '传感器异常',
    category: 'alert',
    severity: 'high'
  },
  'network_error': {
    color: 'orange',
    text: '网络异常',
    category: 'alert',
    severity: 'medium'
  },
  'other': {
    color: 'gray',
    text: '其他',
    category: 'alert',
    severity: 'low'
  }
};

// 设备类型映射
export const DEVICE_TYPE_MAPPING: Record<string, string> = {
  'camera': '摄像头',
  'sensor': '传感器',
  'smoke_detector': '烟雾探测器',
  'environment': '环境传感器',
  'door_sensor': '门磁传感器',
  'motion_sensor': '运动传感器',
  'temperature_sensor': '温度传感器',
  'humidity_sensor': '湿度传感器'
};

// 告警级别映射
export const ALERT_LEVEL_MAPPING: Record<number, { color: string; text: string }> = {
  1: { color: 'red', text: '紧急' },
  2: { color: 'orange', text: '重要' },
  3: { color: 'yellow', text: '一般' },
  4: { color: 'blue', text: '提示' }
};

// 告警状态映射
export const ALERT_STATUS_MAPPING: Record<number, { color: string; text: string }> = {
  0: { color: 'red', text: '待处理' },
  1: { color: 'orange', text: '已通知' },
  2: { color: 'green', text: '已确认' },
  3: { color: 'gray', text: '已忽略' }
};

// 获取事件类型信息
export function getEventTypeInfo(eventType: string): EventTypeInfo {
  return EVENT_TYPE_MAPPING[eventType] || {
    color: 'default',
    text: eventType,
    category: 'alert',
    severity: 'low'
  };
}

// 获取设备类型显示名称
export function getDeviceTypeName(deviceType: string): string {
  return DEVICE_TYPE_MAPPING[deviceType] || deviceType;
}

// 获取告警级别信息
export function getAlertLevelInfo(level: number): { color: string; text: string } {
  return ALERT_LEVEL_MAPPING[level] || { color: 'default', text: '未知' };
}

// 获取告警状态信息
export function getAlertStatusInfo(status: number): { color: string; text: string } {
  return ALERT_STATUS_MAPPING[status] || { color: 'default', text: '未知' };
}

// 根据严重程度获取颜色
export function getSeverityColor(severity: string): string {
  const severityColors: Record<string, string> = {
    'low': 'blue',
    'medium': 'orange',
    'high': 'red',
    'critical': 'red'
  };
  return severityColors[severity] || 'default';
}

// 获取事件类型过滤器选项
export function getEventTypeFilters() {
  const categories = new Set<string>();
  Object.values(EVENT_TYPE_MAPPING).forEach(info => {
    categories.add(info.category);
  });
  
  return Array.from(categories).map(category => {
    const categoryNames: Record<string, string> = {
      'alert': '告警',
      'heartbeat': '心跳',
      'status_change': '状态变更',
      'config_update': '配置更新',
      'device_online': '设备上线',
      'device_offline': '设备离线'
    };
    
    return {
      text: categoryNames[category] || category,
      value: category
    };
  });
}