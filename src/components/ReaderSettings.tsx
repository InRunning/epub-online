'use client';

// 导入React相关依赖
import React from 'react';
// 导入图标组件
import { X, Type, Palette, Eye, Monitor, Columns, Scroll } from 'lucide-react';
// 导入状态管理
import { useBookStore } from '@/store/useBookStore';

// 组件属性接口定义 ----
interface ReaderSettingsProps {
  // 控制设置面板是否显示
  isOpen: boolean;
  // 关闭设置面板的回调函数
  onClose: () => void;
}

// 阅读器设置组件 ----
// 提供字体大小、字体类型、主题、行间距和页面宽度等阅读体验设置
export const ReaderSettings: React.FC<ReaderSettingsProps> = ({ isOpen, onClose }) => {
  // 从状态管理中获取设置和更新方法 ----
  const { settings, updateSettings } = useBookStore();

  // 如果设置面板未打开，不渲染任何内容
  if (!isOpen) return null;

  // 字体选项配置 ----
  // 提供多种字体选择，包括衬线字体和无衬线字体
  const fontOptions = [
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Times, serif', label: 'Times' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Helvetica, sans-serif', label: 'Helvetica' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'system-ui, sans-serif', label: 'System' },
  ];

  // 主题选项配置 ----
  // 提供明亮、暗黑和护眼三种阅读主题
  const themeOptions = [
    { value: 'light', label: '明亮', icon: '☀️' },
    { value: 'dark', label: '暗黑', icon: '🌙' },
    { value: 'sepia', label: '护眼', icon: '📖' },
  ] as const;

  // 栏数模式选项配置 ----
  // 提供单栏和双栏两种阅读模式
  const columnModeOptions = [
    { value: 'single', label: '单栏', icon: '📄' },
    { value: 'double', label: '双栏', icon: '📖' },
  ] as const;

  // 阅读模式选项配置 ----
  // 提供分页和滚动两种阅读方式
  const readingModeOptions = [
    { value: 'paginated', label: '分页', icon: '📄' },
    { value: 'scrolled', label: '滚动', icon: '📜' },
  ] as const;

  // 组件渲染 ----
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        {/* 头部区域 ---- */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            阅读设置
          </h2>
          {/* 关闭按钮 ---- */}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 设置选项区域 ---- */}
        <div className="p-6 space-y-6">
          {/* 字体大小设置 ---- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Type className="w-4 h-4 mr-2" />
              字体大小
            </label>
            <div className="flex items-center space-x-3">
              {/* 减小字体按钮 ---- */}
              <button
                onClick={() => updateSettings({ fontSize: Math.max(12, settings.fontSize - 2) })}
                className="p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                disabled={settings.fontSize <= 12}
              >
                <span className="text-lg">A-</span>
              </button>

              {/* 字体大小滑块 ---- */}
              <div className="flex-1">
                <input
                  type="range"
                  min="12"
                  max="32"
                  step="2"
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                {/* 字体大小范围标签 ---- */}
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>12px</span>
                  <span className="font-medium">{settings.fontSize}px</span>
                  <span>32px</span>
                </div>
              </div>

              {/* 增大字体按钮 ---- */}
              <button
                onClick={() => updateSettings({ fontSize: Math.min(32, settings.fontSize + 2) })}
                className="p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                disabled={settings.fontSize >= 32}
              >
                <span className="text-lg">A+</span>
              </button>
            </div>
          </div>

          {/* 字体类型设置 ---- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              字体类型
            </label>
            {/* 字体选择下拉框 ---- */}
            <select
              value={settings.fontFamily}
              onChange={(e) => updateSettings({ fontFamily: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* 阅读主题设置 ---- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              阅读主题
            </label>
            {/* 主题选择网格 ---- */}
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => updateSettings({ theme: theme.value })}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-center
                    ${settings.theme === theme.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-2xl mb-2">{theme.icon}</div>
                  <div className="text-sm font-medium">{theme.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 行间距设置 ---- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              行间距
            </label>
            <div className="space-y-2">
              {/* 行间距滑块 ---- */}
              <input
                type="range"
                min="1.2"
                max="2.5"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) => updateSettings({ lineHeight: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              {/* 行间距范围标签 ---- */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>紧密 (1.2)</span>
                <span className="font-medium">{settings.lineHeight.toFixed(1)}</span>
                <span>宽松 (2.5)</span>
              </div>
            </div>
          </div>

          {/* 栏数模式设置 ---- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Columns className="w-4 h-4 mr-2" />
              栏数模式
            </label>
            {/* 栏数模式选择网格 ---- */}
            <div className="grid grid-cols-2 gap-3">
              {columnModeOptions.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => updateSettings({ columnMode: mode.value as 'single' | 'double' })}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-center
                    ${settings.columnMode === mode.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-2xl mb-2">{mode.icon}</div>
                  <div className="text-sm font-medium">{mode.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 阅读模式设置 ---- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Scroll className="w-4 h-4 mr-2" />
              阅读模式
            </label>
            {/* 阅读模式选择网格 ---- */}
            <div className="grid grid-cols-2 gap-3">
              {readingModeOptions.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => updateSettings({ readingMode: mode.value as 'paginated' | 'scrolled' })}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-center
                    ${settings.readingMode === mode.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-2xl mb-2">{mode.icon}</div>
                  <div className="text-sm font-medium">{mode.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 阅读宽度设置 ---- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              阅读宽度
            </label>
            <div className="space-y-2">
              {/* 阅读宽度滑块 ---- */}
              <input
                type="range"
                min="600"
                max="1200"
                step="50"
                value={settings.pageWidth}
                onChange={(e) => updateSettings({ pageWidth: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              {/* 阅读宽度范围标签 ---- */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>窄 (600px)</span>
                <span className="font-medium">{settings.pageWidth}px</span>
                <span>宽 (1200px)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作区域 ---- */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          {/* 重置默认按钮 ---- */}
          <button
            onClick={() => {
              // 重置为默认设置
              updateSettings({
                fontSize: 16,
                fontFamily: 'Georgia, serif',
                theme: 'light',
                lineHeight: 1.6,
                pageWidth: 800,
                columnMode: 'single',
                readingMode: 'paginated',
              });
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            重置默认
          </button>
          {/* 完成按钮 ---- */}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};