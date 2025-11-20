/**
 * 前端应用入口
 * Solid.js + 函数式编程
 */

import { render } from 'solid-js/web';
import { lazy } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import App from './App';
import './index.css';

// 懒加载页面
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

render(
  () => (
    <Router root={App}>
      <Route path="/" component={Dashboard} />
      <Route path="/users" component={Users} />
      <Route path="/subscriptions" component={Subscriptions} />
    </Router>
  ),
  root
);
