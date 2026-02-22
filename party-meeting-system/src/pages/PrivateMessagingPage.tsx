import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';

interface PrivateMessagingPageProps {
  onNavigate?: (page: string) => void;
}

interface PartyMember {
  id: string;
  user_id: string;
  full_name: string;
  party_branch: string | null;
  role: string;
}

interface PrivateMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}

export function PrivateMessagingPage({ onNavigate }: PrivateMessagingPageProps) {
  const { user, profile } = useAuth();
  const { showToast } = useUI();
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<PartyMember | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 党员列表分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [filteredMembers, setFilteredMembers] = useState<PartyMember[]>([]);

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      fetchMessages(selectedMember.user_id);
      // 标记消息为已读
      markMessagesAsRead(selectedMember.user_id);
      // 设置自动刷新
      const interval = setInterval(() => {
        fetchMessages(selectedMember.user_id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedMember]);

  useEffect(() => {
    // 搜索筛选逻辑
    const filtered = members.filter(member =>
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.party_branch && member.party_branch.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setTotalItems(filtered.length);
    
    // 应用分页
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setFilteredMembers(filtered.slice(startIndex, endIndex));
  }, [members, searchTerm, currentPage, pageSize]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, party_branch, role')
        .eq('status', 'active')
        .neq('user_id', user?.id || '')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      showToast(error.message || '加载党员列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error: any) {
      console.error('加载消息失败:', error);
    }
  };

  const markMessagesAsRead = async (senderId: string) => {
    try {
      await supabase
        .from('private_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', senderId)
        .eq('recipient_id', user?.id || '')
        .is('read_at', null);
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedMember) return;

    try {
      setSending(true);
      const { error } = await supabase
        .from('private_messages')
        .insert([{
          sender_id: user?.id,
          recipient_id: selectedMember.user_id,
          content: newMessage.trim(),
        }]);

      if (error) throw error;

      setNewMessage('');
      await fetchMessages(selectedMember.user_id);
      showToast('消息发送成功', 'success');
    } catch (error: any) {
      showToast(error.message || '发送消息失败', 'error');
    } finally {
      setSending(false);
    }
  };

  const getUnreadCount = async (memberId: string): Promise<number> => {
    try {
      const { count } = await supabase
        .from('private_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', memberId)
        .eq('recipient_id', user?.id || '')
        .is('read_at', null);

      return count || 0;
    } catch (error) {
      return 0;
    }
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
              <h1 className="text-2xl font-bold text-primary-700">私信系统</h1>
            </div>
            {selectedMember && (
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900">
                  正在与 {selectedMember.full_name} 聊天
                </p>
                {selectedMember.party_branch && (
                  <p className="text-xs text-neutral-500">{selectedMember.party_branch}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* 左侧：党员列表 */}
          <div className="bg-white rounded-lg shadow flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-primary-700 mb-3">党员列表</h2>
              <input
                type="text"
                placeholder="搜索党员姓名或党支部..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner size="md" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="py-8 px-4 text-center text-neutral-500 text-sm">
                  {searchTerm ? '没有找到匹配的党员' : '暂无其他党员'}
                </div>
              ) : (
                <>
                  <div className="divide-y divide-neutral-200">
                    {filteredMembers.map((member) => (
                      <button
                        key={member.user_id}
                        onClick={() => setSelectedMember(member)}
                        className={`w-full px-6 py-3 text-left hover:bg-neutral-50 transition ${
                          selectedMember?.user_id === member.user_id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-neutral-900">
                              {member.full_name}
                            </div>
                            {member.party_branch && (
                              <div className="text-xs text-neutral-500 mt-1">
                                {member.party_branch}
                              </div>
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
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* 分页组件 */}
                  {totalItems > pageSize && (
                    <div className="border-t border-neutral-200 bg-neutral-50 p-4">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalItems={totalItems}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 右侧：聊天区域 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col">
            {selectedMember ? (
              <>
                {/* 消息列表 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <EmptyState
                        icon={
                          <svg className="w-16 h-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        }
                        title="还没有消息"
                        description="发送一条消息开始对话"
                      />
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isSentByMe = msg.sender_id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md ${isSentByMe ? 'order-2' : 'order-1'}`}>
                              <div
                                className={`px-4 py-2 rounded-lg ${
                                  isSentByMe
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-neutral-100 text-neutral-900'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              </div>
                              <div className={`flex items-center mt-1 space-x-2 ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-xs text-neutral-500">
                                  {new Date(msg.created_at).toLocaleString('zh-CN', {
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {isSentByMe && msg.read_at && (
                                  <span className="text-xs text-neutral-500">已读</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* 消息输入框 */}
                <div className="border-t border-neutral-200 p-4">
                  <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                    <div className="flex-1">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        placeholder="输入消息... (Shift+Enter 换行)"
                        rows={3}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={sending}
                      disabled={!newMessage.trim()}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              /* 未选择聊天对象 */
              <div className="flex items-center justify-center h-full">
                <EmptyState
                  icon={
                    <svg className="w-16 h-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  }
                  title="选择一个党员开始聊天"
                  description="从左侧列表中选择一个党员开始私信对话"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
