'use client';

// 导入React相关依赖
import React from 'react';
// 导入书籍图标组件
import { BookOpen } from 'lucide-react';

// 组件属性接口定义 ----
interface LoadingProps {
  // 自定义加载提示消息，默认为"加载中..."
  message?: string;
  // 加载图标的大小，可选值为小、中、大，默认为中
  size?: 'sm' | 'md' | 'lg';
}

// 加载状态提示组件 ----
export const Loading: React.FC<LoadingProps> = ({
  message = '加载中...',
  size = 'md'
}) => {
  // 尺寸样式映射对象 ----
  // 根据不同的尺寸选项提供对应的CSS类名
  const sizeClasses = {
    sm: 'w-4 h-4',    // 小尺寸
    md: 'w-8 h-8',    // 中尺寸
    lg: 'w-12 h-12'   // 大尺寸
  };

  // 组件渲染 ----
  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* 图标容器 ---- */}
      <div className="relative">
        {/* 书籍图标 ---- */}
        {/* 使用animate-pulse实现脉动效果 */}
        <BookOpen className={`${sizeClasses[size]} text-blue-600 animate-pulse`} />
        
        {/* 旋转加载环 ---- */}
        {/* 使用animate-spin实现旋转效果，border-t-transparent创建缺口效果 */}
        <div className={`absolute inset-0 ${sizeClasses[size]} border-2 border-blue-600 border-t-transparent rounded-full animate-spin`} />
      </div>
      
      {/* 加载提示文本 ---- */}
      <p className="mt-4 text-gray-600 text-sm">{message}</p>
    </div>
  );
};