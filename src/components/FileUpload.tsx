// 文件上传组件 ----
// 提供拖拽和点击上传EPUB文件的功能，包含文件验证和状态反馈

'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { EpubParser } from '@/lib/epubParser';
import { useBookStore } from '@/store/useBookStore';

// 组件属性接口 ----
interface FileUploadProps {
  onUploadComplete?: (bookId: string) => void; // 上传完成回调函数
}

// 文件上传组件 ----
// 支持拖拽和点击上传EPUB文件，提供实时状态反馈和错误处理
export const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  // 上传状态管理 ----
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle'); // 上传状态
  const [errorMessage, setErrorMessage] = useState(''); // 错误信息

  // 从全局状态获取操作方法
  const { addBook, setLoading, setError } = useBookStore();

  // 文件拖拽处理 ----
  // 处理用户拖拽或选择的文件，进行验证和解析
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadStatus('uploading');
    setError(null);
    setLoading(true);

    try {
      // 验证文件格式
      const isValid = await EpubParser.validateEpubFile(file);
      if (!isValid) {
        throw new Error('Invalid EPUB file. Please select a valid .epub file.');
      }

      // 解析EPUB文件
      const epubBook = await EpubParser.parseEpubFile(file);

      // 添加到全局状态
      addBook(epubBook);

      setUploadStatus('success');
      onUploadComplete?.(epubBook.id);

      // 2秒后重置状态
      setTimeout(() => setUploadStatus('idle'), 2000);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process EPUB file';
      setErrorMessage(message);
      setUploadStatus('error');
      setError(message);

      // 5秒后重置错误状态
      setTimeout(() => {
        setUploadStatus('idle');
        setErrorMessage('');
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  }, [addBook, setLoading, setError, onUploadComplete]);

  // 配置拖拽区域 ----
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/epub+zip': ['.epub'], // 只接受EPUB格式文件
    },
    multiple: false, // 不允许多文件上传
    disabled: uploadStatus === 'uploading', // 上传中时禁用
  });

  // 获取状态图标 ----
  // 根据上传状态返回对应的图标
  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Upload className="w-8 h-8 text-gray-400" />;
    }
  };

  // 获取状态文本 ----
  // 根据上传状态返回对应的提示文本
  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Processing EPUB file...';
      case 'success':
        return 'EPUB uploaded successfully!';
      case 'error':
        return errorMessage || 'Upload failed';
      default:
        return isDragActive ? 'Drop your EPUB file here' : 'Drag & drop an EPUB file here, or click to select';
    }
  };

  // 获取状态颜色 ----
  // 根据上传状态返回对应的样式颜色
  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'border-blue-300 bg-blue-50';
      case 'success':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400';
    }
  };

  // 渲染上传区域 ----
  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${getStatusColor()}
          ${uploadStatus === 'uploading' ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          {/* 状态图标 */}
          {getStatusIcon()}

          {/* 状态文本和说明 */}
          <div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              {getStatusText()}
            </p>

            {/* 空闲状态下的提示信息 */}
            {uploadStatus === 'idle' && (
              <p className="text-sm text-gray-500">
                Supports .epub files up to 100MB
              </p>
            )}

            {/* 错误状态下的详细信息 */}
            {uploadStatus === 'error' && errorMessage && (
              <p className="text-sm text-red-600 mt-2">
                {errorMessage}
              </p>
            )}
          </div>

          {/* 空闲状态下的格式提示 */}
          {uploadStatus === 'idle' && (
            <div className="flex items-center space-x-2 text-gray-400">
              <FileText className="w-4 h-4" />
              <span className="text-sm">EPUB format only</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};