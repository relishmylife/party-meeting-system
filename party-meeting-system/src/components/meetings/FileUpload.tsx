import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useUI } from '../../contexts/UIContext';
import { Button } from '../common/Button';

interface FileUploadProps {
  meetingId: string;
  onUploadSuccess?: (fileUrl: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ meetingId, onUploadSuccess }) => {
  const { showToast } = useUI();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        showToast('不支持的文件类型。仅支持JPEG、PNG和PDF文件。', 'warning');
        return;
      }

      // 验证文件大小 (最大10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast('文件大小不能超过10MB', 'warning');
        return;
      }

      setSelectedFile(file);
      showToast('文件已选择，请点击上传按钮', 'info');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('请先选择文件', 'warning');
      return;
    }

    setUploading(true);

    try {
      // 将文件转换为base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;

          // 调用Edge Function上传文件
          const { data, error } = await supabase.functions.invoke('file-upload', {
            body: {
              fileData: base64Data,
              fileName: selectedFile.name,
              fileType: selectedFile.type,
              meetingId: meetingId,
              description: description
            }
          });

          if (error) throw error;

          showToast('文件上传成功！', 'success');
          setSelectedFile(null);
          setDescription('');
          
          if (onUploadSuccess && data?.data?.publicUrl) {
            onUploadSuccess(data.data.publicUrl);
          }

          // 重置文件输入
          const fileInput = document.getElementById('file-input') as HTMLInputElement;
          if (fileInput) fileInput.value = '';

        } catch (error: any) {
          console.error('上传错误:', error);
          showToast('上传失败：' + (error.message || '未知错误'), 'error');
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        showToast('读取文件失败', 'error');
        setUploading(false);
      };

      reader.readAsDataURL(selectedFile);

    } catch (error: any) {
      console.error('上传错误:', error);
      showToast('上传失败：' + (error.message || '未知错误'), 'error');
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">上传会议文件</h3>
      
      <div className="space-y-4">
        {/* 文件选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择文件 <span className="text-gray-500">(支持JPEG、PNG、PDF，最大10MB)</span>
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleFileSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-colors"
          />
          {selectedFile && (
            <div className="mt-2 p-3 bg-success-50 border border-success-200 rounded-md">
              <p className="text-sm text-success-800 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                已选择: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            </div>
          )}
        </div>

        {/* 文件描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            文件描述 <span className="text-gray-500">(可选)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            placeholder="请输入文件描述..."
          />
        </div>

        {/* 上传按钮 */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleUpload}
          disabled={!selectedFile}
          loading={uploading}
          className="w-full"
        >
          上传文件
        </Button>
      </div>
    </div>
  );
};
