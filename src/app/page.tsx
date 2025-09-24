// 主页面组件 ----
// 应用程序的主入口页面，负责管理图书馆视图和阅读器视图的切换

'use client';

import React, { useState } from 'react';
import { BookOpen, Upload, Settings } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { BooksList } from '@/components/BooksList';
import { EpubReader } from '@/components/EpubReader';
import { ReaderSettings } from '@/components/ReaderSettings';
import { useBookStore } from '@/store/useBookStore';
import { EpubBook } from '@/types/epub';

// 主页面组件 ----
// 管理应用程序的主要视图状态，包括图书馆视图和阅读器视图
export default function Home() {
  // 视图状态管理 ----
  const [currentView, setCurrentView] = useState<'library' | 'reader'>('library'); // 当前视图：图书馆或阅读器
  const [showSettings, setShowSettings] = useState(false); // 是否显示设置面板

  // 从全局状态获取书籍数据
  const { currentBook, books } = useBookStore();

  // 书籍选择处理 ----
  // 当用户选择一本书籍时，切换到阅读器视图
  const handleBookSelect = (book: EpubBook) => {
    setCurrentView('reader');
  };

  // 返回图书馆处理 ----
  // 当用户从阅读器返回时，切换到图书馆视图
  const handleBackToLibrary = () => {
    setCurrentView('library');
  };

  // 阅读器视图 ----
  // 当当前视图为阅读器且有选中的书籍时，显示阅读器组件
  if (currentView === 'reader' && currentBook) {
    return (
      <>
        <EpubReader
          book={currentBook}
          onClose={handleBackToLibrary}
        />
        <ReaderSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </>
    );
  }

  // 图书馆视图 ----
  // 显示书籍库、上传功能和设置选项
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 ---- */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 应用标题和描述 */}
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">EPUB阅读器</h1>
                <p className="text-sm text-gray-600">本地EPUB文件阅读管理</p>
              </div>
            </div>

            {/* 书籍计数和设置按钮 */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {books.length} 本书籍
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="打开设置"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 ---- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {books.length === 0 ? (
          // 空状态 - 显示上传提示
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Upload className="w-16 h-16 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                欢迎使用EPUB阅读器
              </h2>
              <p className="text-gray-600 mb-8">
                上传您的第一本EPUB文件开始阅读之旅
              </p>
              <FileUpload />
            </div>
          </div>
        ) : (
          // 显示图书馆和上传选项
          <div className="space-y-8">
            {/* 上传区域 ---- */}
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                添加新书籍
              </h2>
              <FileUpload />
            </section>

            {/* 图书馆区域 ---- */}
            <section className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  我的图书馆
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  点击书籍开始阅读
                </p>
              </div>
              <BooksList onBookSelect={handleBookSelect} />
            </section>
          </div>
        )}
      </main>

      {/* 全局设置面板 ---- */}
      <ReaderSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}