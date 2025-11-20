/**
 * 仪表板页面
 */

import { Component, createResource, Show, ErrorBoundary } from 'solid-js';
import { dashboardApi } from '../services/api';
import type { DashboardStats } from '../../../shared/types';

const Dashboard: Component = () => {
  const [stats] = createResource(() => dashboardApi.getStats());

  return (
    <div class="py-4">
      <header class="mb-8 animate-enter">
        <h2 class="text-3xl font-bold text-slate-900 tracking-tight">系统概览</h2>
        <p class="mt-2 text-slate-500">实时监控 Microsoft 365 租户状态与许可使用情况</p>
      </header>

      <ErrorBoundary
        fallback={(err) => (
          <div class="glass border-l-4 border-red-500 p-6 rounded-r-xl flex items-center gap-4 animate-enter">
            <div class="text-red-500 bg-red-50 p-3 rounded-full">⚠️</div>
            <div>
              <h3 class="text-red-800 font-bold">数据加载失败</h3>
              <p class="text-red-600 text-sm mt-1">{err.toString()}</p>
            </div>
          </div>
        )}
      >
        <Show when={!stats.loading} fallback={<LoadingState />}>
          <Show
            when={stats()?.success ? stats() : false}
            fallback={<ErrorState error={(stats() as any)?.error} />}
          >
            {(response) => {
              const apiResponse = response();
              if (apiResponse.success && apiResponse.data) {
                return <StatsGrid stats={apiResponse.data} />;
              }
              return <ErrorState error={{ code: 'NO_DATA', message: '暂无数据' }} />;
            }}
          </Show>
        </Show>
      </ErrorBoundary>
    </div>
  );
};

const LoadingState: Component = () => (
  <div class="py-20 text-center animate-pulse-slow">
    <div class="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
    <p class="text-slate-500 font-medium">正在同步数据...</p>
  </div>
);

const ErrorState: Component<any> = (props) => (
  <div class="glass p-8 text-center rounded-2xl border border-red-100">
    <p class="text-red-500 font-medium">{props.error?.message || '未知错误'}</p>
  </div>
);

// SVG 图标组件
const IconUsers = () => (
  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
);
const IconSubs = () => (
  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
);
const IconLicense = () => (
  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);

const StatCard: Component<{ title: string; value: number; subValue: string; icon: any; gradient: string; delay: string }> = (props) => (
  <div class={`glass-card relative overflow-hidden group p-6 animate-enter-up ${props.delay}`}>
    <div class={`absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full opacity-10 transition-all duration-500 group-hover:scale-110 group-hover:opacity-20 ${props.gradient}`}></div>

    <div class="flex items-start justify-between mb-4">
      <div class={`p-3 rounded-xl shadow-lg ${props.gradient}`}>
        {props.icon}
      </div>
      <span class="text-xs font-bold px-2 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
        实时
      </span>
    </div>

    <h3 class="text-sm font-medium text-slate-500 mb-1">{props.title}</h3>
    <div class="flex items-baseline gap-2">
      <p class="text-3xl font-bold text-slate-800 tracking-tight">{props.value}</p>
    </div>
    <p class="mt-2 text-xs font-medium text-slate-400 flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
      {props.subValue}
    </p>
  </div>
);

const StatsGrid: Component<{ stats: DashboardStats }> = (props) => {
  const s = props.stats;
  const utilGradient = s.licenseUtilization > 90 ? 'from-rose-500 to-rose-600' : s.licenseUtilization > 75 ? 'from-amber-500 to-amber-600' : 'from-emerald-500 to-emerald-600';

  return (
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="总用户数"
        value={s.totalUsers}
        subValue={`激活用户: ${s.activeUsers}`}
        icon={<IconUsers />}
        gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        delay="delay-0"
      />
      <StatCard
        title="总订阅数"
        value={s.totalSubscriptions}
        subValue={`激活订阅: ${s.activeSubscriptions}`}
        icon={<IconSubs />}
        gradient="bg-gradient-to-br from-violet-500 to-violet-600"
        delay="delay-100"
      />
      <StatCard
        title="总许可数"
        value={s.totalLicenses}
        subValue={`剩余可用: ${s.availableLicenses}`}
        icon={<IconLicense />}
        gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
        delay="delay-200"
      />

      {/* 使用率卡片 */}
      <div class="glass-card p-6 animate-enter-up delay-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-slate-500">资源使用率</h3>
            <span class={`text-xs px-2 py-0.5 rounded-full text-white font-bold bg-gradient-to-r ${utilGradient}`}>{s.licenseUtilization}%</span>
          </div>
          <div class="mt-2 flex items-end gap-2">
            <span class="text-3xl font-bold text-slate-800">{s.usedLicenses}</span>
            <span class="text-sm text-slate-400 mb-1.5">/ {s.totalLicenses} 已分配</span>
          </div>
        </div>

        <div class="mt-4 w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            class={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${utilGradient} shadow-sm relative overflow-hidden`}
            style={{ width: `${s.licenseUtilization}%` }}
          >
            <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;