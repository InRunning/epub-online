// EPUB阅读器组件 ----
// 提供完整的EPUB阅读体验，包括页面导航、主题设置、目录浏览等功能

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import ePub, { Book, Rendition } from 'epubjs';
import {
  Menu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  Maximize,
  Minimize,
  BookOpen
} from 'lucide-react';
import { useBookStore } from '@/store/useBookStore';
import { EpubBook } from '@/types/epub';

// 组件属性接口 ----
interface EpubReaderProps {
  book: EpubBook; // 要阅读的EPUB书籍对象
  onClose?: () => void; // 关闭阅读器的回调函数
}

// EPUB阅读器组件 ----
// 核心阅读功能组件，负责书籍渲染、导航和用户交互
export const EpubReader: React.FC<EpubReaderProps> = ({ book, onClose }) => {
  // DOM元素引用 ----
  const viewerRef = useRef<HTMLDivElement>(null); // 阅读器容器引用
  const bookRef = useRef<Book | null>(null); // epubjs书籍实例引用
  const renditionRef = useRef<Rendition | null>(null); // epubjs渲染实例引用

  // 组件状态管理 ----
  const [isLoading, setIsLoading] = useState(true); // 加载状态
  const [currentLocation, setCurrentLocation] = useState<string>(''); // 当前阅读位置
  const [showToc, setShowToc] = useState(false); // 是否显示目录
  const [showSettings, setShowSettings] = useState(false); // 是否显示设置面板
  const [progress, setProgress] = useState(0); // 阅读进度（0-1）

  // 从全局状态获取设置和更新方法
  const { settings, updateBookProgress, updateSettings } = useBookStore();

  // 加载书籍 ----
  // 初始化epubjs实例，创建渲染器并应用设置
  const loadBook = useCallback(async () => {
    if (!viewerRef.current || !book.file) return;

    try {
      setIsLoading(true);

      // 从文件创建书籍实例
      const arrayBuffer = await book.file.arrayBuffer();
      const epubBook = ePub(arrayBuffer);
      bookRef.current = epubBook;

      // 创建渲染器实例
      const rendition = epubBook.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        flow: 'paginated', // 分页模式
        manager: 'default',
      });
      renditionRef.current = rendition;

      // 应用主题和设置
      await rendition.display(book.progress.currentLocation || undefined);
      applySettings(rendition);

      // 设置事件监听器
      setupEventListeners(rendition);

      setIsLoading(false);

    } catch (error) {
      console.error('Error loading book:', error);
      setIsLoading(false);
    }
  }, [book, settings]);

  // 应用阅读设置 ----
  // 根据用户设置应用主题、字体、行高等样式
  const applySettings = useCallback((rendition: Rendition) => {
    // 定义主题配置
    const themes = {
      light: {
        body: {
          'color': '#333',
          'background': '#fff',
        }
      },
      dark: {
        body: {
          'color': '#e5e5e5',
          'background': '#1a1a1a',
        }
      },
      sepia: {
        body: {
          'color': '#5c4b37',
          'background': '#f7f3e9',
        }
      }
    };

    // 注册并选择主题
    rendition.themes.register('light', themes.light);
    rendition.themes.register('dark', themes.dark);
    rendition.themes.register('sepia', themes.sepia);
    rendition.themes.select(settings.theme);

    // 应用字体设置
    rendition.themes.fontSize(`${settings.fontSize}px`);
    rendition.themes.font(settings.fontFamily);

    // 应用行高和其他样式
    const customCSS = `
      body {
        line-height: ${settings.lineHeight} !important;
        max-width: ${settings.pageWidth}px !important;
        margin: 0 auto !important;
        padding: 20px !important;
      }
      p {
        margin-bottom: 1em !important;
        text-align: justify !important;
      }
    `;

    rendition.themes.override('body', {
      'line-height': settings.lineHeight.toString(),
    });

    // 应用自定义CSS样式
    rendition.getContents().forEach((content: any) => {
      content.addStylesheet('data:text/css,' + encodeURIComponent(customCSS));
    });

  }, [settings]);

  // 设置事件监听器 ----
  // 配置位置变化、键盘导航和点击导航的事件处理
  const setupEventListeners = useCallback((rendition: Rendition) => {
    // 位置变化事件
    rendition.on('locationChanged', (location: any) => {
      const locationString = location.start.cfi;
      setCurrentLocation(locationString);

      // 计算阅读进度
      const book = bookRef.current;
      if (book) {
        const progress = book.locations.percentageFromCfi(locationString);
        setProgress(progress);

        // 更新全局状态中的进度信息
        updateBookProgress(book.id, {
          currentLocation: locationString,
          progress: progress * 100,
          chapter: location.start.index || 0,
        });
      }
    });

    // 键盘导航事件
    rendition.on('keyup', (event: KeyboardEvent) => {
      if (event.code === 'ArrowLeft') {
        rendition.prev(); // 左箭头翻到上一页
      } else if (event.code === 'ArrowRight') {
        rendition.next(); // 右箭头翻到下一页
      }
    });

    // 点击导航事件
    const viewer = viewerRef.current;
    if (viewer) {
      viewer.addEventListener('click', (event) => {
        const rect = viewer.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const centerX = rect.width / 2;

        // 点击左侧区域翻到上一页，点击右侧区域翻到下一页
        if (x < centerX * 0.3) {
          rendition.prev();
        } else if (x > centerX * 1.7) {
          rendition.next();
        }
      });
    }
  }, [updateBookProgress]);

  // 跳转到指定章节 ----
  // 根据章节的href跳转到对应的内容页面
  const goToChapter = useCallback((href: string) => {
    if (renditionRef.current) {
      renditionRef.current.display(href);
      setShowToc(false); // 跳转后关闭目录面板
    }
  }, []);

  // 翻到下一页 ----
  const nextPage = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  }, []);

  // 翻到上一页 ----
  const prevPage = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  }, []);

  // 切换全屏模式 ----
  const toggleFullscreen = useCallback(() => {
    const newFullscreenState = !settings.isFullscreen;
    updateSettings({ isFullscreen: newFullscreenState });

    if (newFullscreenState) {
      document.documentElement.requestFullscreen?.(); // 进入全屏
    } else {
      document.exitFullscreen?.(); // 退出全屏
    }
  }, [settings.isFullscreen, updateSettings]);

  // 组件挂载时加载书籍 ----
  useEffect(() => {
    loadBook();

    // 组件卸载时清理资源
    return () => {
      if (bookRef.current) {
        bookRef.current.destroy();
      }
    };
  }, [loadBook]);

  // 设置变化时重新应用 ----
  useEffect(() => {
    if (renditionRef.current && !isLoading) {
      applySettings(renditionRef.current);
    }
  }, [settings, applySettings, isLoading]);

  // 加载状态显示 ----
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading book...</p>
        </div>
      </div>
    );
  }

  // 阅读器界面 ----
  return (
    <div className="h-screen flex flex-col bg-white relative">
      {/* 顶部工具栏 ---- */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-white shadow-sm">
        <div className="flex items-center space-x-4">
          {/* 返回主页按钮 */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="返回图书馆"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* 书籍信息显示 */}
          <div className="text-sm">
            <h1 className="font-semibold text-gray-900 truncate max-w-64">
              {book.metadata.title}
            </h1>
            <p className="text-gray-500 truncate">{book.metadata.author}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 阅读进度显示 */}
          <div className="text-xs text-gray-500 mr-4">
            {Math.round(progress * 100)}%
          </div>

          {/* 导航按钮 */}
          <button
            onClick={prevPage}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="上一页"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={nextPage}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="下一页"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* 目录按钮 */}
          <button
            onClick={() => setShowToc(!showToc)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="目录"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* 设置按钮 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="设置"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* 全屏按钮 */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={settings.isFullscreen ? "退出全屏" : "进入全屏"}
          >
            {settings.isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* 主要内容区域 ---- */}
      <div className="flex-1 flex relative">
        {/* 主阅读区域 */}
        <div className="flex-1 relative">
          <div
            ref={viewerRef}
            className="absolute inset-0 cursor-pointer"
            style={{
              backgroundColor: settings.theme === 'dark' ? '#1a1a1a' :
                            settings.theme === 'sepia' ? '#f7f3e9' : '#fff'
            }}
          />
        </div>

        {/* 目录侧边栏 ---- */}
        {showToc && (
          <div className="w-80 border-l bg-white shadow-lg">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Table of Contents
              </h3>
            </div>
            <div className="overflow-y-auto h-full pb-4">
              {book.chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => goToChapter(chapter.href)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900 line-clamp-2">
                    {chapter.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部进度条 ---- */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
};