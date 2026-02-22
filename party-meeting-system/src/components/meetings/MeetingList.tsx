import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../common/Button';

interface Meeting {
  id: string;
  type_code: string;
  title: string;
  content: string;
  location: string;
  meeting_date: string;
  status: string;
  organizer_id: string;
  org_id: string;
  created_at: string;
}

interface MeetingListProps {
  onEdit?: (meeting: Meeting) => void;
}

export const MeetingList: React.FC<MeetingListProps> = ({ onEdit }) => {
  const { user } = useAuth();
  const { showToast } = useUI();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // 会议类型名称映射
  const getMeetingTypeName = (typeCode: string) => {
    const typeMap: Record<string, string> = {
      'branch_meeting': '支委会',
      'member_meeting': '党员大会',
      'group_meeting': '党小组会',
      'party_lecture': '党课'
    };
    return typeMap[typeCode] || '未分类';
  };

  useEffect(() => {
    fetchMeetings();
  }, [filter]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      
      // 获取会议列表（不包含JOIN查询，直接查询基本信息）
      let query = supabase
        .from('meetings')
        .select('*')
        .order('meeting_date', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMeetings(data || []);
    } catch (error: any) {
      console.error('获取会议列表失败:', error);
      showToast('获取会议列表失败：' + (error.message || '未知错误'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      planned: { text: '计划中', className: 'bg-info-100 text-info-800' },
      in_progress: { text: '进行中', className: 'bg-success-100 text-success-800' },
      completed: { text: '已完成', className: 'bg-neutral-100 text-neutral-800' },
      cancelled: { text: '已取消', className: 'bg-error-100 text-error-800' },
    };
    const status_info = statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status_info.className}`}>
        {status_info.text}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="md"
          onClick={() => setFilter('all')}
        >
          全部
        </Button>
        <Button
          variant={filter === 'planned' ? 'primary' : 'ghost'}
          size="md"
          onClick={() => setFilter('planned')}
        >
          计划中
        </Button>
        <Button
          variant={filter === 'in_progress' ? 'primary' : 'ghost'}
          size="md"
          onClick={() => setFilter('in_progress')}
        >
          进行中
        </Button>
        <Button
          variant={filter === 'completed' ? 'primary' : 'ghost'}
          size="md"
          onClick={() => setFilter('completed')}
        >
          已完成
        </Button>
      </div>

      {/* 会议列表 */}
      {meetings.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="暂无会议记录"
          description={filter === 'all' ? '还没有创建任何会议' : `暂无${filter === 'planned' ? '计划中' : filter === 'in_progress' ? '进行中' : '已完成'}的会议`}
        />
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-200 transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{meeting.title}</h3>
                  <p className="text-sm text-gray-600">
                    {getMeetingTypeName(meeting.type_code)}
                  </p>
                </div>
                {getStatusBadge(meeting.status)}
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(meeting.meeting_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{meeting.location}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onEdit && onEdit(meeting)}
                >
                  查看详情
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
