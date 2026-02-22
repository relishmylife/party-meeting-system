import React, { useState } from 'react';
import { MeetingList } from '../components/meetings/MeetingList';
import { MeetingForm } from '../components/meetings/MeetingForm';
import { FileUpload } from '../components/meetings/FileUpload';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';

interface MeetingsPageProps {
  onNavigate?: (page: 'dashboard' | 'meetings' | 'statistics') => void;
}

export const MeetingsPage: React.FC<MeetingsPageProps> = ({ onNavigate }) => {
  const { signOut, profile, isAdmin } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateNew = () => {
    setSelectedMeeting(null);
    setShowForm(true);
    setShowFileUpload(false);
  };

  const handleEdit = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowForm(true);
    setShowFileUpload(false);
  };

  const handleViewFiles = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowFileUpload(true);
    setShowForm(false);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setShowFileUpload(false);
    setSelectedMeeting(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setShowFileUpload(false);
    setSelectedMeeting(null);
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">会议管理</h1>
              <p className="mt-2 text-sm text-gray-600">
                管理党组织三会一课会议记录
              </p>
            </div>
            {!showForm && !showFileUpload && (
              <Button
                variant="primary"
                size="lg"
                onClick={handleCreateNew}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                创建会议
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm ? (
          <div className="max-w-3xl mx-auto">
            <MeetingForm
              meeting={selectedMeeting}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        ) : showFileUpload && selectedMeeting ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedMeeting.title} - 文件管理
              </h2>
              <Button
                variant="ghost"
                size="md"
                onClick={handleCancel}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                }
              >
                返回列表
              </Button>
            </div>
            <FileUpload
              meetingId={selectedMeeting.id}
              onUploadSuccess={handleSuccess}
            />
          </div>
        ) : (
          <MeetingList key={refreshKey} onEdit={handleEdit} />
        )}
      </div>
    </div>
  );
};
