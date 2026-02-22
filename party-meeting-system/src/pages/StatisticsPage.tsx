import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';

interface StatisticsPageProps {
  onNavigate?: (page: 'dashboard' | 'meetings' | 'statistics') => void;
}

interface StatisticsData {
  totalMeetings: number;
  meetingsByType: Record<string, number>;
  meetingsByStatus: {
    planned: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  attendanceStats: {
    totalParticipants: number;
    totalSignIns: number;
    attendanceRate: string;
  };
  userAttendance?: {
    totalInvited: number;
    totalAttended: number;
    attendanceRate: string;
    meetings: Array<{
      meetingId: string;
      meetingTitle: string;
      meetingDate: string;
      attended: boolean;
      signInTime: string | null;
    }>;
  };
  monthlyStats: Record<string, {
    total: number;
    byType: Record<string, number>;
  }>;
}

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ onNavigate }) => {
  const { user, signOut, profile, isAdmin } = useAuth();
  const { showToast } = useUI();
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // 获取用户的组织ID
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!profile?.organization_id) {
        throw new Error('未找到组织信息');
      }

      // 调用统计分析Edge Function
      const { data, error } = await supabase.functions.invoke('generate-statistics', {
        body: {
          organizationId: profile.organization_id,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          userId: user?.id
        }
      });

      if (error) throw error;

      setStatistics(data?.data || null);
      showToast('统计数据加载成功', 'success');
    } catch (error: any) {
      console.error('获取统计数据失败:', error);
      showToast('获取统计数据失败：' + (error.message || '未知错误'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleNavigate = (page: 'dashboard' | 'meetings' | 'statistics') => {
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
          <h1 className="text-3xl font-bold text-gray-900">参会统计分析</h1>
          <p className="mt-2 text-sm text-gray-600">
            查看会议参会率和统计数据
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 日期筛选 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开始日期
              </label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                结束日期
              </label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              />
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={fetchStatistics}
              loading={loading}
              className="w-full md:w-auto"
            >
              查询统计
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : statistics ? (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">总会议数</div>
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-primary-600">{statistics.totalMeetings}</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">总参会人次</div>
                  <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-accent-600">{statistics.attendanceStats.totalParticipants}</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">实际签到</div>
                  <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-success-600">{statistics.attendanceStats.totalSignIns}</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">总体参会率</div>
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-primary-500">{statistics.attendanceStats.attendanceRate}%</div>
              </div>
            </div>

            {/* 个人参会统计 */}
            {statistics.userAttendance && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  我的参会统计
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-neutral-50 rounded-lg">
                    <div className="text-sm text-neutral-600 mb-1">受邀会议</div>
                    <div className="text-2xl font-bold text-neutral-900">{statistics.userAttendance.totalInvited}</div>
                  </div>
                  <div className="text-center p-4 bg-success-50 rounded-lg">
                    <div className="text-sm text-success-700 mb-1">实际参加</div>
                    <div className="text-2xl font-bold text-success-600">{statistics.userAttendance.totalAttended}</div>
                  </div>
                  <div className="text-center p-4 bg-primary-50 rounded-lg">
                    <div className="text-sm text-primary-700 mb-1">我的参会率</div>
                    <div className="text-2xl font-bold text-primary-600">{statistics.userAttendance.attendanceRate}%</div>
                  </div>
                </div>

                {/* 会议列表 */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">参会记录</h4>
                  {statistics.userAttendance.meetings.length > 0 ? (
                    <div className="space-y-2">
                      {statistics.userAttendance.meetings.map((meeting, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-neutral-50 rounded-md hover:bg-neutral-100 transition-colors">
                          <div>
                            <div className="font-medium text-neutral-900">{meeting.meetingTitle}</div>
                            <div className="text-sm text-neutral-600">{meeting.meetingDate}</div>
                          </div>
                          <div>
                            {meeting.attended ? (
                              <span className="px-3 py-1 bg-success-100 text-success-800 rounded-full text-sm font-medium">
                                已参加
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-error-100 text-error-800 rounded-full text-sm font-medium">
                                未参加
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-neutral-500">暂无参会记录</p>
                  )}
                </div>
              </div>
            )}

            {/* 会议类型分布和状态分布 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  会议类型分布
                </h3>
                <div className="space-y-4">
                  {Object.entries(statistics.meetingsByType).map(([type, count]) => {
                    const percentage = (count / statistics.totalMeetings) * 100;
                    return (
                      <div key={type}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-700 font-medium">{type}</span>
                          <span className="text-neutral-600">{count} 次 ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  会议状态分布
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-700 font-medium">计划中</span>
                      <span className="text-neutral-600">{statistics.meetingsByStatus.planned} 次</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-info-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(statistics.meetingsByStatus.planned / statistics.totalMeetings) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-700 font-medium">进行中</span>
                      <span className="text-neutral-600">{statistics.meetingsByStatus.in_progress} 次</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-success-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(statistics.meetingsByStatus.in_progress / statistics.totalMeetings) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-700 font-medium">已完成</span>
                      <span className="text-neutral-600">{statistics.meetingsByStatus.completed} 次</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-neutral-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(statistics.meetingsByStatus.completed / statistics.totalMeetings) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 月度统计 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                月度会议统计
              </h3>
              {Object.keys(statistics.monthlyStats).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(statistics.monthlyStats).sort().reverse().map(([month, data]) => (
                    <div key={month} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{month}</span>
                        <span className="text-sm text-gray-600">共 {data.total} 次会议</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(data.byType).map(([type, count]) => (
                          <span key={type} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                            {type}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-neutral-500">暂无月度统计数据</p>
              )}
            </div>
          </>
        ) : (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="暂无统计数据"
            description="请选择日期范围后点击查询按钮获取统计数据"
          />
        )}
      </div>
    </div>
  );
};
