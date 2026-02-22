import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';

interface NotificationsPageProps {
  onNavigate?: (page: string) => void;
}

interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  content: string;
  type: string;
  read_at: string | null;
  created_at: string;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { user, signOut, profile, isAdmin } = useAuth();
  const { showToast, showConfirm } = useUI();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user?.id)
        .order('created_at', { ascending: false });

      if (filter === 'unread') {
        query = query.is('read_at', null);
      } else if (filter === 'read') {
        query = query.not('read_at', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('获取通知失败:', error);
      showToast('获取通知失败：' + (error.message || '未知错误'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      showToast('已标记为已读', 'success');
      fetchNotifications();
    } catch (error: any) {
      showToast('操作失败：' + (error.message || '未知错误'), 'error');
    }
  };

  const markAllAsRead = () => {
    showConfirm({
      title: '确认操作',
      message: '确定要将所有通知标记为已读吗？',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('recipient_id', user?.id)
            .is('read_at', null);

          if (error) throw error;

          showToast('所有通知已标记为已读', 'success');
          fetchNotifications();
        } catch (error: any) {
          showToast('操作失败：' + (error.message || '未知错误'), 'error');
        }
      }
    });
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return (
          <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'reminder':
        return (
          <svg className="w-6 h-6 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-info-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const unreadCount = notifications.filter(n => n.read_at === null).length;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 顶部导航栏 */}
      <header className="bg-primary-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleNavigate('dashboard')}
                className="text-white hover:text-primary-100 flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回首页
              </button>
              <h1 className="text-xl font-bold text-white">党组织生活会议管理系统</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{profile?.full_name}</p>
                <p className="text-xs text-primary-100">{isAdmin ? '管理员' : '普通用户'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-primary-700 bg-white rounded-md hover:bg-primary-50 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">通知提醒</h1>
              <p className="mt-2 text-sm text-gray-600">
                会议通知、提醒和系统消息 {unreadCount > 0 && `(${unreadCount}条未读)`}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="md"
                onClick={markAllAsRead}
              >
                全部标记为已读
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 筛选器 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'primary' : 'ghost'}
            size="md"
            onClick={() => setFilter('all')}
          >
            全部
          </Button>
          <Button
            variant={filter === 'unread' ? 'primary' : 'ghost'}
            size="md"
            onClick={() => setFilter('unread')}
          >
            未读
          </Button>
          <Button
            variant={filter === 'read' ? 'primary' : 'ghost'}
            size="md"
            onClick={() => setFilter('read')}
          >
            已读
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
            title="暂无通知"
            description={filter === 'unread' ? '没有未读通知' : filter === 'read' ? '没有已读通知' : '还没有收到任何通知'}
          />
        ) : (
          <div className="grid gap-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-200 ${
                  notification.read_at !== null ? 'border-gray-200' : 'border-primary-200 bg-primary-50/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {notification.title}
                        {notification.read_at === null && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-error-100 text-error-800">
                            新
                          </span>
                        )}
                      </h3>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{notification.content}</p>
                    {notification.read_at === null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        标记为已读
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
