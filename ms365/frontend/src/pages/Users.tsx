/**
 * 用户管理页面
 */

import { Component, createResource, createSignal, For, Show, createMemo } from 'solid-js';
import { userApi, subscriptionApi } from '../services/api';
import { UserRole, CreateUserInput, UpdateUserInput } from '../../../shared/types';
import { Modal } from '../components/Modal';
import { FormField } from '../components/FormField';
import { Select } from '../components/Select';

const Users: Component = () => {
  const [users, { refetch }] = createResource(() => userApi.getAll());
  const [subscriptions] = createResource(() => subscriptionApi.getAll());

  const [verifiedDomains] = createResource(() => userApi.getVerifiedDomains());
  const [availableRoles] = createResource(() => userApi.getRoles());

  const [searchTerm, setSearchTerm] = createSignal('');
  const [showCreateModal, setShowCreateModal] = createSignal(false);
  const [showAssignModal, setShowAssignModal] = createSignal(false);
  const [showEditModal, setShowEditModal] = createSignal(false);

  const [selectedUserId, setSelectedUserId] = createSignal('');
  const [selectedSubscriptionId, setSelectedSubscriptionId] = createSignal('');

  // Create Form State
  const [username, setUsername] = createSignal('');
  const [selectedDomain, setSelectedDomain] = createSignal('');
  const [formData, setFormData] = createSignal<Omit<CreateUserInput, 'email' | 'usageLocation' | 'directoryRoleTemplateId'>>({
    name: '',
    role: 'readonly',
  });
  const [createUserSubscriptionId, setCreateUserSubscriptionId] = createSignal<string>('');
  const [usageLocation, setUsageLocation] = createSignal<string>('HK');

  // Edit Form State
  const [editFormData, setEditFormData] = createSignal<UpdateUserInput>({});
  const [editingUser, setEditingUser] = createSignal<any>(null);

  // 纯前端过滤搜索
  const filteredUsers = createMemo(() => {
    const all = (users() as any)?.data || [];
    const term = searchTerm().toLowerCase();
    if (!term) return all;
    return all.filter((u: any) =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  const usageLocations = [{ label: '香港 (Hong Kong)', value: 'HK' }, { label: '中国 (China)', value: 'CN' }];

  const roleOptions = createMemo(() => {
    const roles = (availableRoles() as any)?.data || [];

    // Handle local mode (string array)
    if (roles.length > 0 && typeof roles[0] === 'string') {
      const roleMap: Record<string, string> = {
        'super_admin': '超级管理员',
        'admin': '管理员',
        'readonly': '普通用户 (只读)'
      };
      return roles.map((r: string) => ({
        label: roleMap[r] || r,
        value: r
      }));
    }

    // Handle Azure mode (object array)
    return roles.map((r: any) => ({
      label: r.displayName,
      value: r.id,
      description: r.description
    }));
  });

  const handleCreate = async () => {
    const user = username().trim();
    const domain = selectedDomain();
    if (!user || !domain) return;
    const email = `${user}@${domain}`;

    const selectedRole = formData().role;
    // If selecting a built-in role, use it directly; otherwise treat it as Azure role template ID
    const isBuiltIn = ['super_admin', 'admin', 'readonly'].includes(selectedRole);

    const result = await userApi.create({
      name: formData().name,
      email,
      usageLocation: usageLocation(),
      role: isBuiltIn ? selectedRole : 'readonly' as UserRole,
      directoryRoleTemplateId: isBuiltIn ? undefined : selectedRole
    });

    if (result.success) {
      if (createUserSubscriptionId()) await userApi.assignSubscription(result.data.id, createUserSubscriptionId());
      setShowCreateModal(false);
      setUsername(''); setSelectedDomain(''); setCreateUserSubscriptionId('');
      setFormData({ name: '', role: 'readonly' });
      refetch();
    }
  };

  const handleUpdate = async () => {
    if (!editingUser()) return;

    const updates = { ...editFormData() };
    const selectedRole = updates.role;

    if (selectedRole) {
      const isBuiltIn = ['super_admin', 'admin', 'readonly'].includes(selectedRole);
      if (!isBuiltIn) {
        updates.role = 'readonly' as UserRole;
        updates.directoryRoleTemplateId = selectedRole;
      }
    }

    const result = await userApi.update(editingUser().id, updates);
    if (result.success) {
      setShowEditModal(false);
      setEditingUser(null);
      setEditFormData({});
      refetch();
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    const displayRole = user.azureRoleTemplateId || user.role;
    setEditFormData({
      name: user.name,
      role: displayRole,
      isActive: user.isActive
    });
    setShowEditModal(true);
  };

  const handleAssignSubscription = async () => {
    if (!selectedSubscriptionId()) return;
    const result = await userApi.assignSubscription(selectedUserId(), selectedSubscriptionId());
    if (result.success) { setShowAssignModal(false); refetch(); }
  };

  return (
    <div class="py-4">
      {/* 顶部操作栏 */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-enter">
        <div>
          <h2 class="text-3xl font-bold text-slate-900 tracking-tight">用户管理</h2>
          <p class="mt-2 text-slate-500">管理组织内的用户账号、权限及订阅分配</p>
        </div>
        <div class="flex gap-3 w-full sm:w-auto">
          <div class="relative flex-1 sm:flex-initial group">
            <input
              type="text"
              placeholder="搜索姓名或邮箱..."
              class="input pl-10 w-full sm:w-64 bg-white/50 focus:bg-white transition-all"
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
            />
            <svg class="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <button class="btn-primary shrink-0 shadow-lg shadow-primary-500/20" onClick={() => setShowCreateModal(true)}>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            添加用户
          </button>
        </div>
      </div>

      {/* 表格区域 */}
      <Show when={!users.loading} fallback={<div class="py-20 text-center animate-pulse-slow"><div class="inline-block w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div><p class="text-slate-500">加载用户数据中...</p></div>}>
        <Show when={users()?.success}>
          <div class="table-container animate-enter-up delay-100">
            <table class="table">
              <thead>
                <tr>
                  <th>用户信息</th>
                  <th>角色权限</th>
                  <th>订阅状态</th>
                  <th>账号状态</th>
                  <th class="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                <For each={filteredUsers()} fallback={
                  <tr><td colspan="5" class="text-center py-12 text-slate-500">没有找到匹配的用户</td></tr>
                }>
                  {(user) => (
                    <tr class="group hover:bg-primary-50/30 transition-colors duration-200">
                      <td>
                        <div class="flex items-center">
                          <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 flex items-center justify-center font-bold text-lg mr-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div class="font-medium text-slate-900">{user.name}</div>
                            <div class="text-slate-500 text-xs font-mono mt-0.5">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class={user.role === 'super_admin' ? 'badge-danger' : user.role === 'admin' ? 'badge-warning' : 'badge-info'}>
                          {user.role === 'super_admin' ? '超级管理员' : user.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      <td>
                        <Show when={user.subscriptionId} fallback={<span class="text-slate-400 text-xs italic px-2 py-1 rounded bg-slate-50">未分配</span>}>
                          <div class="flex items-center gap-2">
                            <span class="relative flex h-2.5 w-2.5">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span class="text-slate-700 font-medium text-sm">{user.subscriptionName}</span>
                          </div>
                        </Show>
                      </td>
                      <td>
                        <span class={user.isActive ? 'badge-success' : 'badge-danger'}>
                          {user.isActive ? '正常' : '已停用'}
                        </span>
                      </td>
                      <td class="text-right">
                        <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                          <button class="btn-secondary text-xs py-1.5 px-3" onClick={() => openEditModal(user)}>
                            编辑
                          </button>
                          <Show when={!user.subscriptionId}>
                            <button class="btn-secondary text-xs py-1.5 px-3" onClick={() => { setSelectedUserId(user.id); setShowAssignModal(true); }}>
                              分配订阅
                            </button>
                          </Show>
                          <Show when={user.subscriptionId}>
                            {/* 只有当用户不是管理员或超级管理员时，才显示回收按钮 */}
                            <Show when={user.role !== 'admin' && user.role !== 'super_admin'}>
                              <button class="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors" onClick={() => { if (confirm('确认回收?')) userApi.revokeSubscription(user.id).then(refetch); }}>
                                回收
                              </button>
                            </Show>
                          </Show>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Show>

      {/* 创建用户模态框 */}
      <Modal show={showCreateModal()} onClose={() => setShowCreateModal(false)} title="创建新用户">
        <div class="space-y-6">
          <div class="bg-slate-50/50 p-5 rounded-xl border border-slate-100">
            <h4 class="text-xs font-bold text-primary-600 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1 h-4 bg-primary-500 rounded-full"></span>
              基本信息
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div class="sm:col-span-2">
                <label class="label">邮箱前缀 & 域名 <span class="text-rose-500">*</span></label>
                <div class="flex gap-2">
                  <input type="text" class="input flex-1" placeholder="zhangsan" value={username()} onInput={(e) => setUsername(e.currentTarget.value)} />
                  <div class="flex items-center text-slate-400 font-medium">@</div>
                  <Select
                    class="flex-1"
                    value={selectedDomain()}
                    onChange={setSelectedDomain}
                    placeholder="选择域名"
                    options={((verifiedDomains() as any)?.data || []).map((d: any) => ({ label: d.name, value: d.name }))}
                  />
                </div>
              </div>
              <div class="sm:col-span-2">
                <FormField label="显示名称" required>
                  <input type="text" class="input" value={formData().name} onInput={(e) => setFormData({ ...formData(), name: e.currentTarget.value })} placeholder="例如: 张三" />
                </FormField>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Select
              label="系统角色"
              required
              value={formData().role}
              onChange={(val) => setFormData({ ...formData(), role: val as any })}
              options={roleOptions()}
            />
            <Select
              label="数据位置"
              required
              value={usageLocation()}
              onChange={setUsageLocation}
              options={usageLocations}
            />
          </div>

          <div>
            <Select
              label="初始订阅分配 (可选)"
              value={createUserSubscriptionId()}
              onChange={setCreateUserSubscriptionId}
              placeholder="暂不分配"
              options={((subscriptions() as any)?.data || []).map((sub: any) => ({
                label: `${sub.name} (剩余 ${sub.totalLicenses - sub.usedLicenses})`,
                value: sub.id,
                disabled: sub.totalLicenses <= sub.usedLicenses
              }))}
            />
          </div>
        </div>

        <div class="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button class="btn-secondary" onClick={() => setShowCreateModal(false)}>取消</button>
          <button class="btn-primary" onClick={handleCreate}>确认创建</button>
        </div>
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal show={showEditModal()} onClose={() => setShowEditModal(false)} title="编辑用户">
        <div class="space-y-6">
          <FormField label="显示名称">
            <input
              type="text"
              class="input"
              value={editFormData().name || ''}
              onInput={(e) => setEditFormData({ ...editFormData(), name: e.currentTarget.value })}
            />
          </FormField>

          <Select
            label="系统角色"
            value={editFormData().role || 'readonly'}
            onChange={(val) => setEditFormData({ ...editFormData(), role: val as UserRole })}

            options={roleOptions()}
          />

          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              class="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              checked={editFormData().isActive}
              onChange={(e) => setEditFormData({ ...editFormData(), isActive: e.currentTarget.checked })}
            />
            <label for="isActive" class="text-sm text-slate-700 font-medium select-none">启用账号</label>
          </div>
        </div>

        <div class="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button class="btn-secondary" onClick={() => setShowEditModal(false)}>取消</button>
          <button class="btn-primary" onClick={handleUpdate}>保存修改</button>
        </div>
      </Modal>

      {/* 分配订阅模态框 */}
      <Modal show={showAssignModal()} onClose={() => setShowAssignModal(false)} title="分配许可证">
        <div class="py-6">
          <Select
            label="选择可用的订阅计划"
            value={selectedSubscriptionId()}
            onChange={setSelectedSubscriptionId}
            placeholder="-- 请选择 --"
            options={((subscriptions() as any)?.data || []).map((sub: any) => ({
              label: `${sub.name} (剩余 ${sub.totalLicenses - sub.usedLicenses})`,
              value: sub.id,
              disabled: sub.totalLicenses <= sub.usedLicenses
            }))}
          />
        </div>
        <div class="flex justify-end gap-3 mt-4">
          <button class="btn-secondary" onClick={() => setShowAssignModal(false)}>取消</button>
          <button class="btn-primary" onClick={handleAssignSubscription}>分配</button>
        </div>
      </Modal>
    </div>
  );
};



export default Users;