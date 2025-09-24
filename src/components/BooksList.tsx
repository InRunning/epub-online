// 书籍列表组件 ----
// 显示用户上传的所有书籍，支持选择、删除和查看进度

'use client';

import React from 'react';
import { BookOpen, User, Calendar, Trash2, Play } from 'lucide-react';
import { useBookStore } from '@/store/useBookStore';
import { EpubBook } from '@/types/epub';

// 组件属性接口 ----
interface BooksListProps {
  onBookSelect?: (book: EpubBook) => void; // 书籍选择回调函数
}

// 书籍列表组件 ----
// 展示所有已上传的书籍，包括封面、元数据、阅读进度和操作按钮
export const BooksList: React.FC<BooksListProps> = ({ onBookSelect }) => {
  // 从全局状态获取书籍数据和操作方法
  const { books, currentBook, setCurrentBook, removeBook } = useBookStore();

  // 书籍选择处理 ----
  // 设置当前选中的书籍并触发回调函数
  const handleBookSelect = (book: EpubBook) => {
    setCurrentBook(book);
    onBookSelect?.(book);
  };

  // 书籍删除处理 ----
  // 从库中移除指定的书籍，需要用户确认
  const handleRemoveBook = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发书籍选择
    if (window.confirm('Are you sure you want to remove this book?')) {
      removeBook(bookId);
    }
  };

  // 空状态显示 ----
  // 当没有书籍时显示提示信息
  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No books uploaded yet</h3>
        <p className="text-gray-500">Upload your first EPUB file to get started</p>
      </div>
    );
  }

  // 书籍网格列表 ----
  // 使用响应式网格布局展示所有书籍
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {books.map((book) => (
        <div
          key={book.id}
          className={`
            bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer
            transition-all duration-200 hover:shadow-md hover:border-gray-300
            ${currentBook?.id === book.id ? 'ring-2 ring-blue-500 border-blue-300' : ''}
          `}
          onClick={() => handleBookSelect(book)}
        >
          {/* 书籍封面和操作按钮 ---- */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {/* 显示书籍封面或默认图标 */}
              {book.metadata.cover ? (
                <img
                  src={book.metadata.cover}
                  alt={book.metadata.title}
                  className="w-12 h-16 object-cover rounded shadow-sm mb-3"
                />
              ) : (
                <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>

            {/* 操作按钮：阅读和删除 */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookSelect(book);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Read book"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleRemoveBook(e, book.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Remove book"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 书籍元数据信息 ---- */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">
              {book.metadata.title}
            </h3>

            {/* 作者信息 */}
            <div className="flex items-center text-gray-600 text-xs">
              <User className="w-3 h-3 mr-1" />
              <span className="truncate">{book.metadata.author}</span>
            </div>

            {/* 出版日期 */}
            {book.metadata.pubdate && (
              <div className="flex items-center text-gray-500 text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{new Date(book.metadata.pubdate).getFullYear()}</span>
              </div>
            )}

            {/* 书籍描述 */}
            {book.metadata.description && (
              <p className="text-gray-600 text-xs line-clamp-2 mt-2">
                {book.metadata.description}
              </p>
            )}

            {/* 阅读进度条 */}
            {book.progress.progress > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(book.progress.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${book.progress.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 底部信息栏 ---- */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
            <span>{book.chapters.length} chapters</span>
            {currentBook?.id === book.id && (
              <span className="text-blue-600 font-medium">Currently reading</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};