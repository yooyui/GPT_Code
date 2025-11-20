/**
 * 主应用组件
 */

import { Component } from 'solid-js';
import { A } from '@solidjs/router';

const App: Component = (props: any) => {
  return (
    <div class="min-h-screen">
      {/* 导航栏 - Glassmorphism */}
      <nav class="sticky top-0 z-50 glass border-b-0 mb-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center gap-8">
              <div class="flex-shrink-0 flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30">
                  M
                </div>
                <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-500">
                  MS365 管理系统
                </h1>
              </div>
              <div class="hidden sm:flex sm:space-x-4">
                <NavLink href="/" label="仪表板" />
                <NavLink href="/users" label="用户管理" />
                <NavLink href="/subscriptions" label="订阅管理" />
              </div>
            </div>
            <div class="flex items-center">
              {/* 右侧可以放用户信息等，暂时留空或放个占位 */}
              <div class="w-8 h-8 rounded-full bg-slate-200/50 border border-white/50"></div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 animate-enter">
        {props.children}
      </main>
    </div>
  );
};

const NavLink: Component<{ href: string; label: string }> = (props) => (
  <A
    href={props.href}
    class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-600 hover:text-primary-600 hover:bg-primary-50/50"
    activeClass="bg-primary-50 text-primary-700 shadow-sm"
    end={props.href === '/'}
  >
    {props.label}
  </A>
);

export default App;
