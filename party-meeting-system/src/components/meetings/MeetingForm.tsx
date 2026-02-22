import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { Button } from '../common/Button';

interface MeetingFormProps {
  meeting?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface MeetingType {
  code: string;
  name: string;
}

interface FormErrors {
  [key: string]: string;
}

export const MeetingForm: React.FC<MeetingFormProps> = ({ meeting, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { showToast } = useUI();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [meetingTypes] = useState<MeetingType[]>([
    { code: 'branch_meeting', name: '支委会' },
    { code: 'member_meeting', name: '党员大会' },
    { code: 'group_meeting', name: '党小组会' },
    { code: 'party_lecture', name: '党课' }
  ]);

  const [formData, setFormData] = useState({
    type_code: meeting?.type_code || '',
    title: meeting?.title || '',
    content: meeting?.content || '',
    location: meeting?.location || '',
    meeting_date: meeting?.meeting_date || '',
    status: meeting?.status || 'planned',
    notes: meeting?.notes || '',
  });

  useEffect(() => {
    // 不需要从数据库获取类型，直接使用预定义的
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.type_code) {
      newErrors.type_code = '请选择会议类型';
    }
    if (!formData.title.trim()) {
      newErrors.title = '请输入会议标题';
    }
    if (!formData.location.trim()) {
      newErrors.location = '请输入会议地点';
    }
    if (!formData.meeting_date) {
      newErrors.meeting_date = '请选择会议日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('请填写所有必填项', 'warning');
      return;
    }

    setLoading(true);

    try {
      // 获取用户的组织ID
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('user_id', user?.id)
        .maybeSingle();

      const meetingData = {
        ...formData,
        organizer_id: user?.id,
        org_id: profile?.org_id,
        updated_by: user?.id,
      };

      if (meeting?.id) {
        // 更新现有会议
        const { error } = await supabase
          .from('meetings')
          .update(meetingData)
          .eq('id', meeting.id);

        if (error) throw error;
        showToast('会议更新成功', 'success');
      } else {
        // 创建新会议
        const { error } = await supabase
          .from('meetings')
          .insert([{
            ...meetingData,
            created_by: user?.id,
          }]);

        if (error) throw error;
        showToast('会议创建成功', 'success');
      }

      onSuccess && onSuccess();
    } catch (error: any) {
      console.error('保存会议失败:', error);
      showToast('保存失败：' + (error.message || '未知错误'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除该字段的错误提示
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {meeting?.id ? '编辑会议' : '创建会议'}
      </h2>

      {/* 会议类型 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          会议类型 <span className="text-error-500">*</span>
        </label>
        <select
          name="type_code"
          value={formData.type_code}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
            errors.type_code 
              ? 'border-error-500 focus:ring-error-500' 
              : 'border-gray-300 focus:ring-primary-500'
          }`}
        >
          <option value="">请选择会议类型</option>
          {meetingTypes.map((type) => (
            <option key={type.code} value={type.code}>
              {type.name}
            </option>
          ))}
        </select>
        {errors.type_code && (
          <p className="mt-1 text-sm text-error-600">{errors.type_code}</p>
        )}
      </div>

      {/* 会议标题 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          会议标题 <span className="text-error-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
            errors.title 
              ? 'border-error-500 focus:ring-error-500' 
              : 'border-gray-300 focus:ring-primary-500'
          }`}
          placeholder="请输入会议标题"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-error-600">{errors.title}</p>
        )}
      </div>

      {/* 会议内容 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          会议内容
        </label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          placeholder="请输入会议内容"
        />
      </div>

      {/* 地点 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          会议地点 <span className="text-error-500">*</span>
        </label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
            errors.location 
              ? 'border-error-500 focus:ring-error-500' 
              : 'border-gray-300 focus:ring-primary-500'
          }`}
          placeholder="请输入会议地点"
        />
        {errors.location && (
          <p className="mt-1 text-sm text-error-600">{errors.location}</p>
        )}
      </div>

      {/* 日期 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          会议日期 <span className="text-error-500">*</span>
        </label>
        <input
          type="date"
          name="meeting_date"
          value={formData.meeting_date}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
            errors.meeting_date 
              ? 'border-error-500 focus:ring-error-500' 
              : 'border-gray-300 focus:ring-primary-500'
          }`}
        />
        {errors.meeting_date && (
          <p className="mt-1 text-sm text-error-600">{errors.meeting_date}</p>
        )}
      </div>

      {/* 状态 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          会议状态
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        >
          <option value="planned">计划中</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      {/* 备注 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          备注
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          placeholder="请输入备注信息"
        />
      </div>

      {/* 按钮 */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onCancel}
          >
            取消
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
        >
          {meeting?.id ? '更新会议' : '创建会议'}
        </Button>
      </div>
    </form>
  );
};
