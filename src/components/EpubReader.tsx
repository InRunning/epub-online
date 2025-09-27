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
import { BookCacheManager } from '@/lib/bookCache';

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
  const [loadingError, setLoadingError] = useState<string | null>(null); // 加载错误信息
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null); // 加载超时定时器
  const [loadingProgress, setLoadingProgress] = useState<string>(''); // 加载进度信息
  const [errorDetails, setErrorDetails] = useState<string>(''); // 错误详细信息

  // 从全局状态获取设置和更新方法
  const { settings, updateBookProgress, updateSettings } = useBookStore();

  // 加载书籍 ----
  // 初始化epubjs实例，创建渲染器并应用设置
  const loadBook = useCallback(async () => {
    // 清除之前的超时定时器
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }

    // 重置错误状态
    setLoadingError(null);
    setErrorDetails('');

    // 添加详细的调试信息
    console.log('=== BOOK LOADING DEBUG INFO ===');
    console.log('Book object:', book);
    console.log('Book metadata:', book.metadata);
    console.log('Book file:', book.file);
    console.log('Book file type:', book.file?.type);
    console.log('Book file size:', book.file?.size);
    console.log('Viewer ref:', viewerRef.current);
    console.log('=== END DEBUG INFO ===');

    if (!viewerRef.current) {
      console.error('Viewer ref is not available');
      setLoadingError('无法加载书籍：阅读器容器未准备好');
      return;
    }

    if (!book.file) {
      console.error('Book file is missing');
      setLoadingError('无法加载书籍：书籍文件不存在');
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      console.log('Starting to load book:', book.metadata.title);
      setIsLoading(true);
      setLoadingProgress('准备加载书籍...');

      // 设置加载超时处理（增加到30秒，给大型书籍更多时间）
      timeoutId = setTimeout(() => {
        console.error('Book loading timeout');
        setLoadingError('书籍加载超时');
        setErrorDetails('加载时间超过30秒，可能是文件过大或网络连接不稳定。请尝试较小的EPUB文件或检查网络连接后重试。');
        setIsLoading(false);
        setLoadingProgress('');
      }, 30000);
      setLoadingTimeout(timeoutId);

      // 使用缓存的ArrayBuffer或转换文件
      console.log('Getting ArrayBuffer...');
      setLoadingProgress('正在读取书籍文件...');
      let arrayBuffer: ArrayBuffer;
      
      // 首先检查全局缓存
      const globalCachedBuffer = BookCacheManager.getCachedBook(book.id);
      if (globalCachedBuffer) {
        console.log('Using globally cached ArrayBuffer');
        arrayBuffer = globalCachedBuffer;
        setLoadingProgress('使用缓存的书籍文件...');
      } else if (book._arrayBuffer) {
        console.log('Using book instance cached ArrayBuffer');
        arrayBuffer = book._arrayBuffer;
        // 同时添加到全局缓存
        BookCacheManager.cacheBook(book.id, arrayBuffer);
        setLoadingProgress('使用缓存的书籍文件...');
      } else {
        console.log('Converting file to ArrayBuffer...');
        setLoadingProgress('正在转换书籍文件格式...');
        arrayBuffer = await book.file.arrayBuffer();
        console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
        // 缓存ArrayBuffer
        BookCacheManager.cacheBook(book.id, arrayBuffer);
      }
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('文件内容为空，请检查EPUB文件是否损坏');
      }
      
      // 检查文件大小，如果过大则给出提示
      const fileSizeInMB = arrayBuffer.byteLength / (1024 * 1024);
      if (fileSizeInMB > 50) {
        console.warn('Large file detected:', fileSizeInMB.toFixed(2), 'MB');
        setLoadingProgress(`检测到大文件(${fileSizeInMB.toFixed(1)}MB)，加载可能需要更长时间...`);
      }
      
      console.log('Creating epubjs instance...');
      setLoadingProgress('正在初始化阅读器...');
      const epubBook = ePub(arrayBuffer);
      bookRef.current = epubBook;

      // 等待书籍准备就绪
      console.log('Waiting for book to be ready...');
      setLoadingProgress('正在解析书籍内容...');
      await epubBook.ready;
      console.log('Book is ready');

      // 创建渲染器实例
      console.log('Creating rendition...');
      setLoadingProgress('正在创建阅读界面...');
      const rendition = epubBook.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        flow: settings.readingMode, // 使用设置中的阅读模式（分页或滚动）
        manager: 'default',
        // 优化性能的设置
        snap: settings.readingMode === 'paginated', // 只在分页模式下启用snap
        allowScriptedContent: true,
        // 根据栏数设置
        spread: settings.columnMode === 'double' ? 'auto' : 'none', // 双栏模式使用auto，单栏模式使用none
      });
      renditionRef.current = rendition;
      console.log('Rendition created');

      // 注意：epubjs v0.3 没有 Promise 类型的 displayed 属性。
      // 直接使用 display() 返回的 Promise，避免一直等待导致加载覆盖层不消失。
      console.log('Displaying book at location:', book.progress.currentLocation || 'start');
      setLoadingProgress('正在显示书籍内容...');
      
      // 先显示内容，再异步生成locations，避免阻塞加载
      await rendition.display(book.progress.currentLocation || undefined);
      console.log('Book displayed, applying settings...');
      applySettings(rendition);

      // 设置事件监听器
      console.log('Setting up event listeners...');
      setupEventListeners(rendition);

      // 异步生成locations，使用更小的间隔值以提高性能，不阻塞主要加载流程
      console.log('Starting locations generation in background...');
      setLoadingProgress('正在生成阅读位置信息...');
      epubBook.locations.generate(500).then(() => {
        console.log('Locations generated:', epubBook.locations.length());
        setLoadingProgress('');
      }).catch(e => {
        console.warn('Generate locations failed:', e);
        setLoadingProgress('');
      });

      console.log('Book loading completed successfully');
      setLoadingProgress('加载完成！');
      
      // 清除超时定时器
      if (timeoutId) clearTimeout(timeoutId);
      setLoadingTimeout(null);
      
      // 延迟一点再隐藏加载状态，让用户看到"加载完成"的提示
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress('');
      }, 500);

    } catch (error) {
      console.error('Error loading book:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        bookTitle: book.metadata.title,
        bookId: book.id,
        fileName: book.file?.name,
        fileSize: book.file?.size,
        fileType: book.file?.type
      });
      
      // 清除超时定时器
      if (timeoutId) clearTimeout(timeoutId);
      setLoadingTimeout(null);
      
      // 根据错误类型提供更友好的错误信息
      let errorMessage = '加载书籍时发生未知错误';
      let detailsMessage = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // 根据错误消息提供更详细的解决方案
        if (error.message.includes('timeout') || error.message.includes('超时')) {
          detailsMessage = '加载时间过长，可能是文件过大或网络连接不稳定。请尝试较小的EPUB文件或检查网络连接后重试。';
        } else if (error.message.includes('文件内容为空') || error.message.includes('empty')) {
          detailsMessage = 'EPUB文件可能已损坏或不完整。请尝试重新下载或使用其他EPUB文件。';
        } else if (error.message.includes('解析') || error.message.includes('parse')) {
          detailsMessage = '无法解析EPUB文件格式。请确保文件是有效的EPUB格式，不是其他类型的文件。';
        } else if (error.message.includes('网络') || error.message.includes('network')) {
          detailsMessage = '网络连接问题导致加载失败。请检查网络连接后重试。';
        } else {
          detailsMessage = '请确保EPUB文件格式正确，然后重试。如果问题持续存在，请尝试使用其他EPUB文件。';
        }
      }
      
      setLoadingError(errorMessage);
      setErrorDetails(detailsMessage);
      setIsLoading(false);
      setLoadingProgress('');
    }
  }, [book.id, book.file, book._arrayBuffer, settings.readingMode, settings.columnMode]);

  // 应用阅读设置 ----
  // 根据用户设置应用主题、字体、行高等样式
  const applySettings = useCallback((rendition: Rendition) => {
    try {
      console.log('Applying reader settings:', settings);
      
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
      console.log('Registering themes...');
      rendition.themes.register('light', themes.light);
      rendition.themes.register('dark', themes.dark);
      rendition.themes.register('sepia', themes.sepia);
      rendition.themes.select(settings.theme);
      console.log('Theme selected:', settings.theme);

      // 应用字体设置
      console.log('Applying font settings...');
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

      console.log('Applying custom CSS...');
      rendition.themes.override('body', `line-height: ${settings.lineHeight} !important;`);

      // 应用自定义CSS样式
      const contents = rendition.getContents();
      console.log('Found contents:', contents);
      
      // 处理contents可能是数组或单个对象的情况
      if (Array.isArray(contents)) {
        console.log('Contents is an array, length:', contents.length);
        contents.forEach((content: any, index: number) => {
          console.log(`Applying styles to content ${index}`);
          content.addStylesheet('data:text/css,' + encodeURIComponent(customCSS));
        });
      } else if (contents) {
        console.log('Contents is a single object');
        contents.addStylesheet('data:text/css,' + encodeURIComponent(customCSS));
      }

      console.log('Settings applied successfully');
    } catch (error) {
      console.error('Error applying settings:', error);
      console.error('Settings error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        settings: settings
      });
    }
  }, [settings]);

  // 设置事件监听器 ----
  // 配置位置变化、键盘导航和点击导航的事件处理
  const setupEventListeners = useCallback((rendition: Rendition) => {
    try {
      console.log('Setting up event listeners...');
      
      // 位置变化事件
      console.log('Setting up relocated listener...');
      rendition.on('relocated', (location: any) => {
        console.log('Relocated:', location);
        const locationString = location.start.cfi;
        setCurrentLocation(locationString);

        // 计算阅读进度
        const epubBook = bookRef.current;
        if (epubBook) {
          // 确保locations已加载
          if (!epubBook.locations || epubBook.locations.length() === 0) {
            console.log('Locations not loaded yet, skipping progress calculation');
            return;
          }
          
          const progress = epubBook.locations.percentageFromCfi(locationString);
          setProgress(progress);
          console.log('Progress updated:', progress);

          // 更新全局状态中的进度信息
          updateBookProgress(book.id, {
            currentLocation: locationString,
            progress: progress * 100,
            chapter: location.start.index || 0,
          });
        }
      });

      // 键盘导航事件
      console.log('Setting up keyup listener...');
      rendition.on('keyup', (event: KeyboardEvent) => {
        console.log('Key pressed:', event.code);
        if (event.code === 'ArrowLeft') {
          console.log('Navigating to previous page');
          rendition.prev(); // 左箭头翻到上一页
        } else if (event.code === 'ArrowRight') {
          console.log('Navigating to next page');
          rendition.next(); // 右箭头翻到下一页
        }
      });

      // 点击导航事件
      const viewer = viewerRef.current;
      if (viewer) {
        console.log('Setting up click navigation...');
        viewer.addEventListener('click', (event) => {
          const rect = viewer.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const centerX = rect.width / 2;

          console.log('Viewer clicked at position:', x, 'center:', centerX);

          // 点击左侧区域翻到上一页，点击右侧区域翻到下一页
          if (x < centerX * 0.3) {
            console.log('Navigating to previous page (click)');
            rendition.prev();
          } else if (x > centerX * 1.7) {
            console.log('Navigating to next page (click)');
            rendition.next();
          }
        });
      }

      console.log('Event listeners setup completed');
    } catch (error) {
      console.error('Error setting up event listeners:', error);
      console.error('Event listeners error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
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
      // 清除超时定时器
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      
      // 清理书籍资源
      if (bookRef.current) {
        console.log('Cleaning up book resources...');
        bookRef.current.destroy();
        bookRef.current = null;
      }
      
      // 清理渲染器
      if (renditionRef.current) {
        console.log('Cleaning up rendition...');
        renditionRef.current = null;
      }
    };
  }, [loadBook]);

  // 设置变化时重新应用 ----
  useEffect(() => {
    if (renditionRef.current && !isLoading) {
      applySettings(renditionRef.current);
    }
  }, [settings, applySettings, isLoading]);

  // 注意：不要在加载时提前return，否则渲染容器不会挂载，
  // 导致viewerRef.current为null并报“阅读器容器未准备好”。

  // 如果有加载错误且不在加载中，显示错误页面
  if (loadingError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-2">{loadingError}</p>
          {errorDetails && (
            <p className="text-sm text-gray-500 mb-4">{errorDetails}</p>
          )}
          <div className="space-y-3">
            <button
              onClick={() => {
                setLoadingError(null);
                setErrorDetails('');
                loadBook();
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              重试加载
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              返回图书馆
            </button>
          </div>
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

          {/* 加载与错误遮罩层（保持容器已挂载） */}
          {(isLoading || loadingError) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50/80">
              <div className="text-center">
                {isLoading && (
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                )}
                <p className="text-gray-600 mb-2">Loading book...</p>
                <p className="text-sm text-gray-500">正在加载《{book.metadata.title}》</p>
                {loadingProgress && (
                  <p className="text-xs text-blue-600 mt-1">{loadingProgress}</p>
                )}
                {loadingError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600 font-medium">{loadingError}</p>
                    {errorDetails && (
                      <p className="text-xs text-red-500 mt-1">{errorDetails}</p>
                    )}
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => {
                          setLoadingError(null);
                          setErrorDetails('');
                          loadBook();
                        }}
                        className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                      >
                        重试
                      </button>
                      <button
                        onClick={() => {
                          setIsLoading(false);
                          onClose?.();
                        }}
                        className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 transition-colors"
                      >
                        返回图书馆
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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
