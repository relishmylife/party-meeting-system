import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

interface SystemSettingsPageProps {
  onNavigate?: (page: string) => void;
}

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  updated_at: string;
}

interface SystemStats {
  totalUsers: number;
  totalMeetings: number;
  totalMessages: number;
  activeUsers: number;
  todayMeetings: number;
  systemUptime: string;
}

export const SystemSettingsPage: React.FC<SystemSettingsPageProps> = ({ onNavigate }) => {
  const { user, profile, isAdmin, isSuperAdmin } = useAuth();
  const { showToast, showConfirm } = useUI();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'config' | 'permissions' | 'monitor' | 'logs'>('config');
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSystemConfigs();
      fetchSystemStats();
    }
  }, [isAdmin]);

  const fetchSystemConfigs = async () => {
    try {
      setLoading(true);
      
      // 模拟系统配置数据 - 实际项目中应该从数据库或配置文件读取
      const configs: SystemConfig[] = [
        {
          id: '1',
          key: 'system_name',
          value: '党组织生活会议管理系统',
          description: '系统名称显示',
          category: 'basic',
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          key: 'max_file_size',
          value: '10',
          description: '最大文件上传大小（MB）',
          category: 'file',
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          key: 'session_timeout',
          value: '480',
          description: '会话超时时间（分钟）',
          category: 'security',
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          key: 'enable_email_notifications',
          value: 'true',
          description: '启用邮件通知',
          category: 'notification',
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          key: 'auto_backup_enabled',
          value: 'true',
          description: '启用自动备份',
          category: 'backup',
          updated_at: new Date().toISOString()
        },
        {
          id: '6',
          key: 'maintenance_mode',
          value: 'false',
          description: '维护模式',
          category: 'system',
          updated_at: new Date().toISOString()
        }
      ];

      setSystemConfigs(configs);
    } catch (error: any) {
      console.error('获取系统配置失败:', error);
      showToast('获取系统配置失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      // 模拟系统统计数据
      const stats: SystemStats = {
        totalUsers: 45,
        totalMeetings: 128,
        totalMessages: 256,
        activeUsers: 32,
        todayMeetings: 3,
        systemUptime: '15天 8小时'
      };

      setSystemStats(stats);
    } catch (error: any) {
      console.error('获取系统统计失败:', error);
    }
  };

  const handleConfigSave = async (configId: string) => {
    try {
      const config = systemConfigs.find(c => c.id === configId);
      if (!config) return;

      // 这里应该调用API保存配置到数据库
      // 暂时只更新本地状态
      setSystemConfigs(prev => prev.map(c => 
        c.id === configId 
          ? { ...c, value: editValue, updated_at: new Date().toISOString() }
          : c
      ));

      setEditingConfig(null);
      setEditValue('');
      showToast('配置保存成功', 'success');
    } catch (error: any) {
      showToast('保存配置失败', 'error');
    }
  };

  const handleStartEdit = (config: SystemConfig) => {
    setEditingConfig(config.id);
    setEditValue(config.value);
  };

  const handleCancelEdit = () => {
    setEditingConfig(null);
    setEditValue('');
  };

  const getCategoryName = (category: string) => {
    const names = {
      basic: '基础配置',
      file: '文件管理',
      security: '安全设置',
      notification: '通知设置',
      backup: '备份设置',
      system: '系统设置'
    };
    return names[category as keyof typeof names] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      basic: 'bg-blue-100 text-blue-700',
      file: 'bg-green-100 text-green-700',
      security: 'bg-red-100 text-red-700',
      notification: 'bg-yellow-100 text-yellow-700',
      backup: 'bg-purple-100 text-purple-700',
      system: 'bg-gray-100 text-gray-700'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          title="权限不足"
          description="只有管理员可以访问系统设置功能"
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
              <h1 className="text-2xl font-bold text-primary-700">系统设置</h1>
            </div>
            <div className="flex items-center space-x-3">
              {isSuperAdmin && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setActiveTab('monitor')}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  系统监控
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={() => setActiveTab('config')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                系统配置
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 标签导航 */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('config')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'config'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              系统配置
            </button>
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('permissions')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'permissions'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  权限设置
                </button>
                <button
                  onClick={() => setActiveTab('monitor')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'monitor'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  系统监控
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'logs'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  操作日志
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* 系统配置标签页 */}
            {activeTab === 'config' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-primary-700 mb-6">系统配置管理</h2>
                  
                  {/* 配置分类显示 */}
                  <div className="space-y-8">
                    {Object.entries(
                      systemConfigs.reduce((acc, config) => {
                        if (!acc[config.category]) {
                          acc[config.category] = [];
                        }
                        acc[config.category].push(config);
                        return acc;
                      }, {} as Record<string, SystemConfig[]>)
                    ).map(([category, configs]) => (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="text-lg font-medium text-neutral-900">
                            {getCategoryName(category)}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(category)}`}>
                            {configs.length} 项配置
                          </span>
                        </div>
                        
                        <div className="grid gap-4">
                          {configs.map((config) => (
                            <div key={config.id} className="border border-neutral-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <h4 className="font-medium text-neutral-900">{config.key}</h4>
                                    <span className="text-sm text-neutral-500">{config.description}</span>
                                  </div>
                                  <p className="text-sm text-neutral-500 mt-1">
                                    更新时间: {new Date(config.updated_at).toLocaleString('zh-CN')}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {editingConfig === config.id ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="px-3 py-1 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        placeholder="输入配置值..."
                                      />
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleConfigSave(config.id)}
                                      >
                                        保存
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEdit}
                                      >
                                        取消
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="px-3 py-1 bg-neutral-100 rounded text-sm">
                                        {config.value}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleStartEdit(config)}
                                      >
                                        编辑
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 权限设置标签页（仅超级管理员） */}
            {activeTab === 'permissions' && isSuperAdmin && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-primary-700 mb-6">用户权限设置</h2>
                <EmptyState
                  icon={
                    <svg className="w-16 h-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                  title="权限管理功能开发中"
                  description="用户角色和权限的详细管理功能正在开发中，敬请期待"
                />
              </div>
            )}

            {/* 系统监控标签页（仅超级管理员） */}
            {activeTab === 'monitor' && isSuperAdmin && (
              <div className="space-y-6">
                {/* 系统统计概览 */}
                {systemStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-semibold text-neutral-900">{systemStats.totalUsers}</p>
                          <p className="text-sm text-neutral-500">总用户数</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-semibold text-neutral-900">{systemStats.totalMeetings}</p>
                          <p className="text-sm text-neutral-500">总会议数</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-semibold text-neutral-900">{systemStats.totalMessages}</p>
                          <p className="text-sm text-neutral-500">总消息数</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-semibold text-neutral-900">{systemStats.activeUsers}</p>
                          <p className="text-sm text-neutral-500">活跃用户</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-semibold text-neutral-900">{systemStats.todayMeetings}</p>
                          <p className="text-sm text-neutral-500">今日会议</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-semibold text-neutral-900">{systemStats.systemUptime}</p>
                          <p className="text-sm text-neutral-500">系统运行时间</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 系统监控详情 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-primary-700 mb-4">系统监控详情</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                      <span className="text-neutral-600">CPU使用率</span>
                      <span className="text-green-600 font-medium">23%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                      <span className="text-neutral-600">内存使用率</span>
                      <span className="text-blue-600 font-medium">67%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                      <span className="text-neutral-600">磁盘使用率</span>
                      <span className="text-yellow-600 font-medium">45%</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-neutral-600">数据库连接</span>
                      <span className="text-green-600 font-medium">正常</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 操作日志标签页（仅超级管理员） */}
            {activeTab === 'logs' && isSuperAdmin && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-primary-700 mb-6">操作日志</h2>
                <EmptyState
                  icon={
                    <svg className="w-16 h-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  title="操作日志功能开发中"
                  description="系统操作日志的详细查看和筛选功能正在开发中，敬请期待"
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};