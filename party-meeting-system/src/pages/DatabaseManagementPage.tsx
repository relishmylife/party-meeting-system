import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';

interface DatabaseManagementPageProps {
  onNavigate?: (page: string) => void;
}

interface PartyMember {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  party_branch: string | null;
  position: string | null;
  role: 'super_admin' | 'admin' | 'member';
  status: string;
  created_at: string;
}

export function DatabaseManagementPage({ onNavigate }: DatabaseManagementPageProps) {
  const { isSuperAdmin } = useAuth();
  const { showToast, showConfirm, closeConfirm } = useUI();
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<PartyMember | null>(null);
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    party_branch: '',
    position: '',
    role: 'member' as 'admin' | 'member',
  });

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchMembers();
    }
  }, [isSuperAdmin, currentPage, pageSize]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      // 获取总数
      const { count, error: countError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalItems(count || 0);

      // 获取当前页数据
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      showToast(error.message || '加载党员信息失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // 调用Edge Function创建党员
      const { data, error } = await supabase.functions.invoke('create-party-member', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone || null,
          party_branch: formData.party_branch || null,
          position: formData.position || null,
          role: formData.role,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error.message);

      showToast('添加党员成功', 'success');
      setShowAddForm(false);
      resetForm();
      fetchMembers();
    } catch (error: any) {
      showToast(error.message || '添加党员失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          party_branch: formData.party_branch || null,
          position: formData.position || null,
          role: formData.role,
        })
        .eq('id', editingMember.id);

      if (error) throw error;

      showToast('更新党员信息成功', 'success');
      setEditingMember(null);
      resetForm();
      fetchMembers();
    } catch (error: any) {
      showToast(error.message || '更新党员信息失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = (member: PartyMember) => {
    showConfirm({
      title: '确认删除',
      message: `确定要删除党员"${member.full_name}"吗？此操作不可恢复。`,
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          // 删除用户档案
          const { error } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', member.id);

          if (error) throw error;

          showToast('删除党员成功', 'success');
          fetchMembers();
        } catch (error: any) {
          showToast(error.message || '删除党员失败', 'error');
        } finally {
          closeConfirm();
        }
      },
      onCancel: closeConfirm,
    });
  };

  const startEdit = (member: PartyMember) => {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name,
      email: '',
      password: '',
      phone: member.phone || '',
      party_branch: member.party_branch || '',
      position: member.position || '',
      role: member.role === 'super_admin' ? 'admin' : member.role,
    });
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      phone: '',
      party_branch: '',
      position: '',
      role: 'member',
    });
  };

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // 重置到第一页
  };

  // 计算总页数
  const totalPages = Math.ceil(totalItems / pageSize);

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingMember(null);
    resetForm();
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      super_admin: 'bg-accent-100 text-accent-700',
      admin: 'bg-primary-100 text-primary-700',
      member: 'bg-neutral-100 text-neutral-700',
    };
    const labels = {
      super_admin: '超级管理员',
      admin: '管理员',
      member: '普通党员',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[role as keyof typeof styles]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <EmptyState
          icon={
            <svg className="w-16 h-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          title="权限不足"
          description="只有超级管理员可以访问数据库管理功能"
          action={
            <Button variant="primary" size="md" onClick={() => handleNavigate('dashboard')}>
              返回首页
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleNavigate('dashboard')}
                className="text-neutral-600 hover:text-primary-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-primary-700">数据库管理</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowAddForm(true)}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                添加党员
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 添加/编辑表单 */}
        {(showAddForm || editingMember) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-primary-700 mb-6">
              {editingMember ? '编辑党员信息' : '添加新党员'}
            </h2>
            <form onSubmit={editingMember ? handleUpdateMember : handleAddMember}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {!editingMember && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        邮箱 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        初始密码 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    手机号
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    党支部
                  </label>
                  <input
                    type="text"
                    value={formData.party_branch}
                    onChange={(e) => setFormData({ ...formData, party_branch: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    职务
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    角色 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'member' })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="member">普通党员</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button type="button" variant="ghost" size="md" onClick={cancelForm}>
                  取消
                </Button>
                <Button type="submit" variant="primary" size="md" loading={loading}>
                  {editingMember ? '保存修改' : '添加党员'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 党员列表 */}
        {loading && !showAddForm && !editingMember ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            title="暂无党员信息"
            description="点击上方「添加党员」按钮开始添加党员信息"
          />
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    手机号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    党支部
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    职务
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">{member.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">{member.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">{member.party_branch || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">{member.position || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(member.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        member.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {member.status === 'active' ? '正常' : '停用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => startEdit(member)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        编辑
                      </button>
                      {member.role !== 'super_admin' && (
                        <button
                          onClick={() => handleDeleteMember(member)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* 分页组件 */}
            {totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
