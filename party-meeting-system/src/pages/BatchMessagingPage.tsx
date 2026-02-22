import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

interface BatchMessagingPageProps {
  onNavigate?: (page: string) => void;
}

interface PartyMember {
  id: string;
  user_id: string;
  full_name: string;
  party_branch: string | null;
  role: string;
}

interface MessageHistory {
  id: string;
  title: string;
  content: string;
  recipient_count: number;
  created_at: string;
}

export function BatchMessagingPage({ onNavigate }: BatchMessagingPageProps) {
  const { isSuperAdmin, user } = useAuth();
  const { showToast } = useUI();
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<MessageHistory[]>([]);
  const [messageData, setMessageData] = useState({
    title: '',
    content: '',
    type: 'notification',
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
  }, [isSuperAdmin]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, party_branch, role')
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      showToast(error.message || '加载党员列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, content, created_at')
        .eq('type', 'batch_message')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // 统计每条消息的接收人数
      const historyWithCount = await Promise.all(
        (data || []).map(async (msg) => {
          const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('title', msg.title)
            .eq('created_at', msg.created_at);

          return {
            ...msg,
            recipient_count: count || 0,
          };
        })
      );

      setHistory(historyWithCount);
    } catch (error: any) {
      showToast(error.message || '加载历史记录失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const selectAll = () => {
    setSelectedMembers(new Set(members.map(m => m.user_id)));
  };

  const clearSelection = () => {
    setSelectedMembers(new Set());
  };

  const selectByBranch = (branch: string) => {
    const branchMembers = members.filter(m => m.party_branch === branch);
    setSelectedMembers(new Set(branchMembers.map(m => m.user_id)));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedMembers.size === 0) {
      showToast('请至少选择一个接收人', 'warning');
      return;
    }

    try {
      setSending(true);

      // 为每个选中的党员创建通知记录
      const notifications = Array.from(selectedMembers).map(userId => ({
        recipient_id: userId,
        title: messageData.title,
        content: messageData.content,
        type: 'batch_message',
        read_at: null,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      showToast(`成功发送消息给 ${selectedMembers.size} 位党员`, 'success');
      
      // 重置表单
      setMessageData({
        title: '',
        content: '',
        type: 'notification',
      });
      clearSelection();
    } catch (error: any) {
      showToast(error.message || '发送消息失败', 'error');
    } finally {
      setSending(false);
    }
  };

  const messageTemplates = [
    {
      title: '会议通知',
      content: '定于【时间】在【地点】召开【会议名称】，请全体党员准时参加。',
    },
    {
      title: '学习提醒',
      content: '请各位党员及时完成本月党课学习任务，学习材料已上传至系统。',
    },
    {
      title: '活动通知',
      content: '【活动名称】将于【时间】举行，请积极参与，共同推进党建工作。',
    },
  ];

  const useTemplate = (template: { title: string; content: string }) => {
    setMessageData({
      ...messageData,
      title: template.title,
      content: template.content,
    });
  };

  const branches = Array.from(new Set(members.map(m => m.party_branch).filter(Boolean))) as string[];

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
          description="只有超级管理员可以使用批量消息功能"
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
              <h1 className="text-2xl font-bold text-primary-700">批量消息</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant={showHistory ? 'primary' : 'ghost'}
                size="md"
                onClick={() => {
                  setShowHistory(!showHistory);
                  if (!showHistory) fetchHistory();
                }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showHistory ? '返回发送' : '发送历史'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showHistory ? (
          /* 历史记录 */
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-primary-700">发送历史</h2>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={
                    <svg className="w-16 h-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  }
                  title="暂无发送记录"
                  description="还没有发送过批量消息"
                />
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {history.map((msg) => (
                  <div key={msg.id} className="px-6 py-4 hover:bg-neutral-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-neutral-900">{msg.title}</h3>
                        <p className="text-sm text-neutral-600 mt-1">{msg.content}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-neutral-500">
                            发送给 {msg.recipient_count} 人
                          </span>
                          <span className="text-xs text-neutral-500">
                            {new Date(msg.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 发送消息界面 */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：选择接收人 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-neutral-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-primary-700">
                    选择接收人 ({selectedMembers.size}/{members.length})
                  </h2>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      全选
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      清空
                    </Button>
                  </div>
                </div>
                {/* 快捷筛选 */}
                {branches.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {branches.map((branch) => (
                      <button
                        key={branch}
                        onClick={() => selectByBranch(branch)}
                        className="px-3 py-1 text-xs bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition"
                      >
                        {branch}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200">
                    {members.map((member) => (
                      <label
                        key={member.user_id}
                        className="flex items-center px-6 py-3 hover:bg-neutral-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.has(member.user_id)}
                          onChange={() => toggleMember(member.user_id)}
                          className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-neutral-900">
                            {member.full_name}
                          </div>
                          {member.party_branch && (
                            <div className="text-xs text-neutral-500">{member.party_branch}</div>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          member.role === 'super_admin' 
                            ? 'bg-accent-100 text-accent-700'
                            : member.role === 'admin'
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {member.role === 'super_admin' ? '超管' : member.role === 'admin' ? '管理' : '党员'}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：消息内容 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-primary-700">消息内容</h2>
              </div>

              <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                {/* 消息模板 */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    快捷模板
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {messageTemplates.map((template, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => useTemplate(template)}
                        className="px-3 py-2 text-xs bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 transition"
                      >
                        {template.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 消息标题 */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    消息标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={messageData.title}
                    onChange={(e) => setMessageData({ ...messageData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入消息标题"
                  />
                </div>

                {/* 消息内容 */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    消息内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={messageData.content}
                    onChange={(e) => setMessageData({ ...messageData, content: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入消息内容"
                  />
                </div>

                {/* 发送按钮 */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={sending}
                    disabled={selectedMembers.size === 0}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    发送消息
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
