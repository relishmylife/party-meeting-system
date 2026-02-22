import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, profile, signOut, isAdmin, isSuperAdmin } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 顶部导航栏 */}
      <header className="bg-primary-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">
                党组织生活会议管理系统
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{profile?.full_name || '党员同志'}</p>
                <p className="text-xs text-primary-100">
                  {isSuperAdmin ? '超级管理员' : isAdmin ? '管理员' : '普通用户'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-primary-700 bg-white rounded-md hover:bg-primary-50 transition"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎卡片 */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-2">
            欢迎，{profile?.full_name || '同志'}
          </h2>
          <p className="text-primary-100">
            {isSuperAdmin 
              ? '您拥有超级管理员权限，可以管理数据库和系统功能' 
              : isAdmin 
              ? '您拥有管理员权限，可以管理所有功能模块' 
              : '欢迎使用党组织生活会议管理系统'}
          </p>
        </div>

        {/* 功能模块网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 三会一课管理 */}
          <div 
            onClick={() => handleNavigate('meetings')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary-700">三会一课</h3>
                <p className="text-sm text-neutral-500">会议管理</p>
              </div>
            </div>
            <p className="text-neutral-600 text-sm">
              管理支委会、党员大会、党小组会和党课
            </p>
            <div className="mt-4 text-primary-600 text-sm font-medium">
              查看详情 →
            </div>
          </div>

          {/* 会议记录 */}
          <div 
            onClick={() => handleNavigate('records')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-accent-50 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary-700">会议记录</h3>
                <p className="text-sm text-neutral-500">文件归档</p>
              </div>
            </div>
            <p className="text-neutral-600 text-sm">
              上传和管理会议材料、图片、PDF文档
            </p>
            <div className="mt-4 text-primary-600 text-sm font-medium">
              查看详情 →
            </div>
          </div>

          {/* 通知提醒 */}
          <div 
            onClick={() => handleNavigate('notifications')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary-700">通知提醒</h3>
                <p className="text-sm text-neutral-500">消息中心</p>
              </div>
            </div>
            <p className="text-neutral-600 text-sm">
              会议通知、提醒和系统消息
            </p>
            <div className="mt-4 text-primary-600 text-sm font-medium">
              查看详情 →
            </div>
          </div>

          {/* 参会统计 */}
          <div 
            onClick={() => handleNavigate('statistics')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary-700">参会统计</h3>
                <p className="text-sm text-neutral-500">数据分析</p>
              </div>
            </div>
            <p className="text-neutral-600 text-sm">
              查看参会率统计和数据可视化
            </p>
            <div className="mt-4 text-primary-600 text-sm font-medium">
              查看详情 →
            </div>
          </div>

          {/* 用户管理 - 仅管理员 */}
          {isAdmin && (
            <div 
              onClick={() => handleNavigate('users')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
            >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-accent-50 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary-700">用户管理</h3>
                <p className="text-sm text-neutral-500">管理员功能</p>
              </div>
            </div>
            <p className="text-neutral-600 text-sm">
              管理用户账户和权限分配
            </p>
            <div className="mt-4 text-primary-600 text-sm font-medium">
              查看详情 →
            </div>
          </div>
          )}

          {/* 数据库管理 - 仅超级管理员 */}
          {isSuperAdmin && (
            <div 
              onClick={() => handleNavigate('database')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-2 border-accent-200"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-accent-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary-700">数据库管理</h3>
                  <p className="text-sm text-accent-600">超管功能</p>
                </div>
              </div>
              <p className="text-neutral-600 text-sm">
                党员信息增删改查，批量导入导出
              </p>
              <div className="mt-4 text-accent-600 text-sm font-medium">
                查看详情 →
              </div>
            </div>
          )}

          {/* 批量消息 - 仅超级管理员 */}
          {isSuperAdmin && (
            <div 
              onClick={() => handleNavigate('batch-messaging')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-2 border-accent-200"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-accent-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary-700">批量消息</h3>
                  <p className="text-sm text-accent-600">超管功能</p>
                </div>
              </div>
              <p className="text-neutral-600 text-sm">
                批量给党员发送通知消息
              </p>
              <div className="mt-4 text-accent-600 text-sm font-medium">
                查看详情 →
              </div>
            </div>
          )}

          {/* 私信系统 - 仅超级管理员 */}
          {isSuperAdmin && (
            <div 
              onClick={() => handleNavigate('private-messaging')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-2 border-accent-200"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-accent-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary-700">私信系统</h3>
                  <p className="text-sm text-accent-600">超管功能</p>
                </div>
              </div>
              <p className="text-neutral-600 text-sm">
                党员间一对一私信沟通
              </p>
              <div className="mt-4 text-accent-600 text-sm font-medium">
                查看详情 →
              </div>
            </div>
          )}

          {/* 系统设置 - 仅管理员 */}
          {isAdmin && (
            <div 
              onClick={() => handleNavigate('system-settings')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
            >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary-700">系统设置</h3>
                <p className="text-sm text-neutral-500">管理员功能</p>
              </div>
            </div>
            <p className="text-neutral-600 text-sm">
              系统配置、参数设置和监控面板
            </p>
            <div className="mt-4 text-primary-600 text-sm font-medium">
              查看详情 →
            </div>
          </div>
          )}
        </div>
      </main>
    </div>
  );
}
