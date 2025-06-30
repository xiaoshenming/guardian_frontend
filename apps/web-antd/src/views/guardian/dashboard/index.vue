<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref, reactive } from 'vue';
import { message } from 'ant-design-vue';

import { Page, AnalysisOverview, AnalysisChartCard } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import {
  SvgCardIcon,
  SvgCakeIcon,
  SvgDownloadIcon,
  SvgBellIcon,
} from '@vben/icons';

import { getDashboardStatsApi, getDashboardChartsApi } from '#/api/core/dashboard';

// 图表引用
const alertTrendRef = ref<EchartsUIType>();
const deviceStatusRef = ref<EchartsUIType>();
const alertTypesRef = ref<EchartsUIType>();
const memberGrowthRef = ref<EchartsUIType>();

// 图表渲染函数
const { renderEcharts: renderAlertTrend } = useEcharts(alertTrendRef);
const { renderEcharts: renderDeviceStatus } = useEcharts(deviceStatusRef);
const { renderEcharts: renderAlertTypes } = useEcharts(alertTypesRef);
const { renderEcharts: renderMemberGrowth } = useEcharts(memberGrowthRef);

// 响应式数据
const dashboardData = reactive({
  stats: {
    totalCircles: 0,
    totalMembers: 0,
    totalDevices: 0,
    totalAlerts: 0,
    activeDevices: 0,
    pendingAlerts: 0,
    myCircles: 0,
    todayEvents: 0
  },
  charts: {
    alertTrend: [],
    deviceStatus: [],
    circleActivity: [],
    alertTypes: [],
    memberGrowth: []
  },
  userRole: 1,
  loading: false,
  chartsLoading: false,
  refreshing: false,
  lastUpdateTime: ""
});

// 统计卡片配置
const overviewItems = ref<AnalysisOverviewItem[]>([]);

// 获取统计数据
const fetchStats = async () => {
  try {
    dashboardData.loading = true;
    const result = await getDashboardStatsApi();

    dashboardData.stats = result.data.stats;
    dashboardData.userRole = result.data.userRole;

    // 更新统计卡片
    updateOverviewItems();
  } catch (error) {
    console.error("获取统计数据失败:", error);
    message.error("获取统计数据失败，请稍后重试");
    // 设置默认值避免页面崩溃
    dashboardData.stats = {
      totalCircles: 0,
      totalMembers: 0,
      totalDevices: 0,
      totalAlerts: 0,
      activeDevices: 0,
      pendingAlerts: 0,
      myCircles: 0,
      todayEvents: 0
    };
    updateOverviewItems();
  } finally {
    dashboardData.loading = false;
  }
};

// 获取图表数据
const fetchCharts = async () => {
  try {
    dashboardData.chartsLoading = true;
    const result = await getDashboardChartsApi();

    dashboardData.charts = result.data.charts;
    dashboardData.lastUpdateTime = new Date().toLocaleTimeString();

    // 渲染图表
    renderAllCharts();
  } catch (error) {
    console.error("获取图表数据失败:", error);
    message.error("获取图表数据失败，请稍后重试");
    // 设置默认值避免页面崩溃
    dashboardData.charts = {
      alertTrend: [],
      deviceStatus: [],
      circleActivity: [],
      alertTypes: [],
      memberGrowth: []
    };
    // 即使出错也要渲染图表（显示空状态）
    renderAllCharts();
  } finally {
    dashboardData.chartsLoading = false;
  }
};

// 更新统计卡片
const updateOverviewItems = () => {
  overviewItems.value = [
    {
      icon: SvgCardIcon,
      title: "圈子数量",
      totalTitle: dashboardData.userRole === 2 ? "总圈子数" : "我的圈子",
      totalValue: dashboardData.userRole === 2 ? dashboardData.stats.totalCircles : dashboardData.stats.myCircles,
      value: dashboardData.stats.totalMembers,
      valueTitle: "总成员数"
    },
    {
      icon: SvgDownloadIcon,
      title: "设备状态",
      totalTitle: "总设备数",
      totalValue: dashboardData.stats.totalDevices,
      value: dashboardData.stats.activeDevices,
      valueTitle: "在线设备"
    },
    {
      icon: SvgBellIcon,
      title: "告警情况",
      totalTitle: "总告警数",
      totalValue: dashboardData.stats.totalAlerts,
      value: dashboardData.stats.pendingAlerts,
      valueTitle: "待处理"
    },
    {
      icon: SvgCakeIcon,
      title: "今日事件",
      totalTitle: "事件总数",
      totalValue: dashboardData.stats.todayEvents,
      value: dashboardData.stats.todayEvents,
      valueTitle: "今日新增"
    }
  ];
};

// 渲染所有图表
const renderAllCharts = () => {
  setTimeout(() => {
    renderAlertTrendChart();
    renderDeviceStatusChart();
    renderAlertTypesChart();
    renderMemberGrowthChart();
  }, 100);
};

// 告警趋势图表
const renderAlertTrendChart = () => {
  const data = dashboardData.charts.alertTrend || [];

  if (data.length === 0) {
    renderAlertTrend({
      title: {
        text: "暂无数据",
        left: "center",
        top: "center",
        textStyle: {
          color: "#999",
          fontSize: 14
        }
      }
    });
    return;
  }

  const dates = data.map(item => {
    const date = new Date(item.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const values = data.map(item => item.value);

  renderAlertTrend({
    grid: {
      bottom: "10%",
      containLabel: true,
      left: "3%",
      right: "4%",
      top: "10%"
    },
    series: [
      {
        areaStyle: {
          color: {
            colorStops: [
              { offset: 0, color: "rgba(255, 99, 132, 0.3)" },
              { offset: 1, color: "rgba(255, 99, 132, 0.1)" }
            ]
          }
        },
        data: values,
        itemStyle: {
          color: "#ff6384"
        },
        smooth: true,
        type: "line"
      }
    ],
    tooltip: {
      trigger: "axis",
      formatter: "{b}: {c} 次告警"
    },
    xAxis: {
      boundaryGap: false,
      data: dates,
      type: "category"
    },
    yAxis: {
      type: "value",
      name: "告警次数"
    }
  });
};

// 设备状态饼图
const renderDeviceStatusChart = () => {
  const data = dashboardData.charts.deviceStatus || [];
  const colors = ["#36a2eb", "#ff6384", "#ffce56", "#4bc0c0"];

  if (data.length === 0) {
    renderDeviceStatus({
      title: {
        text: "暂无设备数据",
        left: "center",
        top: "center",
        textStyle: {
          color: "#999",
          fontSize: 14
        }
      }
    });
    return;
  }

  renderDeviceStatus({
    legend: {
      bottom: "5%",
      left: "center"
    },
    series: [
      {
        data: data.map((item, index) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: colors[index % colors.length]
          }
        })),
        emphasis: {
          label: {
            fontSize: "14",
            fontWeight: "bold",
            show: true
          }
        },
        label: {
          show: true,
          formatter: "{b}: {c}"
        },
        radius: ["40%", "70%"],
        type: "pie"
      }
    ],
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)"
    }
  });
};

// 告警类型分布图表
const renderAlertTypesChart = () => {
  const data = dashboardData.charts.alertTypes || [];
  const colors = ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff"];

  if (data.length === 0) {
    renderAlertTypes({
      title: {
        text: "暂无告警数据",
        left: "center",
        top: "center",
        textStyle: {
          color: "#999",
          fontSize: 14
        }
      }
    });
    return;
  }

  renderAlertTypes({
    legend: {
      bottom: "5%",
      left: "center"
    },
    series: [
      {
        data: data.map((item, index) => ({
          name: getAlertTypeName(item.name),
          value: item.value,
          itemStyle: {
            color: colors[index % colors.length]
          }
        })),
        emphasis: {
          label: {
            fontSize: "14",
            fontWeight: "bold",
            show: true
          }
        },
        label: {
          show: true,
          formatter: "{b}: {c}"
        },
        radius: ["30%", "60%"],
        type: "pie"
      }
    ],
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)"
    }
  });
};

// 成员增长趋势图表
const renderMemberGrowthChart = () => {
  const data = dashboardData.charts.memberGrowth || [];

  if (data.length === 0) {
    renderMemberGrowth({
      title: {
        text: "暂无成员数据",
        left: "center",
        top: "center",
        textStyle: {
          color: "#999",
          fontSize: 14
        }
      }
    });
    return;
  }

  const dates = data.map(item => {
    const date = new Date(item.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const values = data.map(item => item.value);

  renderMemberGrowth({
    grid: {
      bottom: "10%",
      containLabel: true,
      left: "3%",
      right: "4%",
      top: "10%"
    },
    series: [
      {
        barMaxWidth: 40,
        data: values,
        itemStyle: {
          color: {
            colorStops: [
              { offset: 0, color: "#36a2eb" },
              { offset: 1, color: "#4bc0c0" }
            ]
          }
        },
        type: "bar"
      }
    ],
    tooltip: {
      trigger: "axis",
      formatter: "{b}: +{c} 人"
    },
    xAxis: {
      data: dates,
      type: "category"
    },
    yAxis: {
      type: "value",
      name: "新增成员"
    }
  });
};

// 告警类型名称转换
const getAlertTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    fall_detection: "跌倒检测",
    heart_rate_abnormal: "心率异常",
    temperature_abnormal: "体温异常",
    location_abnormal: "位置异常",
    device_offline: "设备离线",
    emergency: "紧急求助"
  };
  return typeMap[type] || type;
};

// 刷新数据
const refreshData = async () => {
  if (dashboardData.refreshing) return;

  try {
    dashboardData.refreshing = true;
    await Promise.all([fetchStats(), fetchCharts()]);
    message.success("数据刷新成功");
  } catch (error) {
    console.error("数据刷新失败:", error);
    message.error("数据刷新失败，请稍后重试");
  } finally {
    dashboardData.refreshing = false;
  }
};

// 组件挂载时获取数据
onMounted(() => {
  refreshData();

  // 设置定时刷新（每30秒）
  setInterval(() => {
    refreshData();
  }, 30000);
});
</script>

<template>
  <Page
    description="智能监护系统数据概览"
    title="仪表盘"
  >
    <div class="p-5">
      <!-- 统计卡片 -->
      <AnalysisOverview
        :items="overviewItems"
        :loading="dashboardData.loading"
      />

      <!-- 图表区域 -->
      <div class="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <!-- 告警趋势 -->
        <AnalysisChartCard
          title="告警趋势"
          description="最近7天告警趋势"
          class="h-80"
          :loading="dashboardData.chartsLoading"
        >
          <EchartsUI ref="alertTrendRef" class="h-full" />
        </AnalysisChartCard>

        <!-- 设备状态分布 -->
        <AnalysisChartCard
          title="设备状态分布"
          description="当前设备在线状态"
          class="h-80"
          :loading="dashboardData.chartsLoading"
        >
          <EchartsUI ref="deviceStatusRef" class="h-full" />
        </AnalysisChartCard>

        <!-- 告警类型分布 -->
        <AnalysisChartCard
          title="告警类型分布"
          description="最近30天告警类型统计"
          class="h-80"
          :loading="dashboardData.chartsLoading"
        >
          <EchartsUI ref="alertTypesRef" class="h-full" />
        </AnalysisChartCard>

        <!-- 成员增长趋势 -->
        <AnalysisChartCard
          title="成员增长趋势"
          description="最近30天成员增长情况"
          class="h-80"
          :loading="dashboardData.chartsLoading"
        >
          <EchartsUI ref="memberGrowthRef" class="h-full" />
        </AnalysisChartCard>
      </div>

      <!-- 操作区域 -->
      <div
        class="mt-5 flex flex-col items-center space-y-3 sm:flex-row sm:justify-between sm:space-y-0">
        <div class="text-sm text-gray-500">
          <span v-if="dashboardData.lastUpdateTime">
            最后更新时间: {{ dashboardData.lastUpdateTime }}
          </span>
        </div>
        <div class="flex space-x-3">
          <button
            @click="refreshData"
            :disabled="dashboardData.loading || dashboardData.chartsLoading || dashboardData.refreshing"
            class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {{ (dashboardData.loading || dashboardData.chartsLoading || dashboardData.refreshing) ? "刷新中..." : "刷新数据"
            }}
          </button>
        </div>
      </div>
    </div>
  </Page>
</template>
