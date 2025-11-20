/**
 * 订阅管理页面
 */

import { Component, createResource, For, Show } from 'solid-js';
import { subscriptionApi } from '../services/api';

const Subscriptions: Component = () => {
  const [subscriptions] = createResource(() => subscriptionApi.getAll());

  return (
    <div class="py-4">
      <div class="flex justify-between items-center mb-8 animate-enter">
        <div>
          <h2 class="text-3xl font-bold text-slate-900 tracking-tight">订阅管理</h2>
          <p class="mt-2 text-slate-500">订阅数据从 Microsoft Graph API 自动同步</p>
        </div>
      </div>

      <Show when={!subscriptions.loading} fallback={<LoadingState />}>
        <Show when={subscriptions()}>
          {(response) => (
            <Show when={response().success} fallback={<ErrorState />}>
              <div class="table-container animate-enter-up delay-100">
                <table class="table">
                  <thead>
                    <tr>
                      <th>名称</th>
                      <th>总许可数</th>
                      <th>已用许可数</th>
                      <th>可用许可数</th>
                      <th>状态</th>
                      <th>过期日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={(response() as any).data}>
                      {(sub: any) => (
                        <tr class="group hover:bg-primary-50/30 transition-colors duration-200">
                          <td class="font-medium text-slate-900">{sub.name}</td>
                          <td>
                            <div class="flex items-center gap-2">
                              <div class="w-full max-w-[100px] bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div class="bg-slate-300 h-full rounded-full" style={{ width: '100%' }}></div>
                              </div>
                              <span class="text-xs text-slate-500">{sub.totalLicenses}</span>
                            </div>
                          </td>
                          <td>
                            <div class="flex items-center gap-2">
                              <div class="w-full max-w-[100px] bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div class="bg-primary-500 h-full rounded-full" style={{ width: `${(sub.usedLicenses / sub.totalLicenses) * 100}%` }}></div>
                              </div>
                              <span class="text-xs text-slate-500">{sub.usedLicenses}</span>
                            </div>
                          </td>
                          <td>
                            <span class="font-bold text-emerald-600">{sub.totalLicenses - sub.usedLicenses}</span>
                          </td>
                          <td>
                            <span class={sub.status === 'active' ? 'badge-success' : 'badge-danger'}>
                              {sub.status === 'active' ? '激活' : '过期'}
                            </span>
                          </td>
                          <td class="text-sm text-slate-500">
                            {sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString('zh-CN') : '无限期'}
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          )}
        </Show>
      </Show>
    </div>
  );
};

// 加载状态组件
const LoadingState: Component = () => (
  <div class="py-20 text-center animate-pulse-slow">
    <div class="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
    <p class="text-slate-500 font-medium">加载订阅数据中...</p>
  </div>
);

// 错误状态组件
const ErrorState: Component = () => (
  <div class="glass p-8 text-center rounded-2xl border border-red-100 animate-enter">
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
      <svg class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 class="text-lg font-bold text-slate-900 mb-2">加载失败</h3>
    <p class="text-slate-500">无法加载订阅数据，请稍后重试</p>
  </div>
);

export default Subscriptions;
