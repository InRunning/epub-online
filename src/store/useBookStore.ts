// 导入Zustand状态管理库
import { create } from 'zustand';
// 导入类型定义
import { EpubBook, BookProgress, ReaderSettings } from '@/types/epub';

// 书店状态接口定义 ----
interface BookState {
  // 状态属性 ----
  // 已添加的所有书籍列表
  books: EpubBook[];
  // 当前正在阅读的书籍
  currentBook: EpubBook | null;
  // 阅读器设置
  settings: ReaderSettings;
  // 加载状态
  isLoading: boolean;
  // 错误信息
  error: string | null;

  // 操作方法 ----
  // 添加新书籍到书库
  addBook: (book: EpubBook) => void;
  // 从书库中移除书籍
  removeBook: (id: string) => void;
  // 设置当前阅读的书籍
  setCurrentBook: (book: EpubBook | null) => void;
  // 更新书籍阅读进度
  updateBookProgress: (id: string, progress: BookProgress) => void;
  // 更新阅读器设置
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  // 设置加载状态
  setLoading: (loading: boolean) => void;
  // 设置错误信息
  setError: (error: string | null) => void;
  // 清空所有书籍
  clearBooks: () => void;
}

// 默认阅读器设置 ----
const defaultSettings: ReaderSettings = {
  fontSize: 16,                    // 默认字体大小
  fontFamily: 'Georgia, serif',    // 默认字体
  theme: 'light',                  // 默认主题
  lineHeight: 1.6,                 // 默认行间距
  pageWidth: 800,                  // 默认页面宽度
  isFullscreen: false,             // 默认非全屏模式
  columnMode: 'single',            // 默认单栏模式
  readingMode: 'paginated',        // 默认分页模式
};

// 创建书店状态管理器 ----
export const useBookStore = create<BookState>()((set, get) => ({
  // 初始状态 ----
  books: [],                       // 初始书籍列表为空
  currentBook: null,               // 初始没有当前书籍
  settings: defaultSettings,        // 使用默认设置
  isLoading: false,                // 初始非加载状态
  error: null,                     // 初始无错误

  // 操作方法实现 ----
  
  // 添加书籍方法 ----
  addBook: (book) => {
    // 获取当前书籍列表
    const books = get().books;
    // 检查是否已存在相同ID的书籍
    const existingBook = books.find(b => b.id === book.id);
    // 如果不存在，则添加新书籍
    if (!existingBook) {
      set({ books: [...books, book] });
    }
  },

  // 移除书籍方法 ----
  removeBook: (id) => {
    // 过滤掉要移除的书籍
    const books = get().books.filter(book => book.id !== id);
    // 获取当前书籍
    const currentBook = get().currentBook;
    // 更新状态，如果要移除的是当前书籍，则将当前书籍设为null
    set({
      books,
      currentBook: currentBook?.id === id ? null : currentBook
    });
  },

  // 设置当前书籍方法 ----
  setCurrentBook: (book) => {
    // 直接设置当前书籍
    set({ currentBook: book });
  },

  // 更新书籍进度方法 ----
  updateBookProgress: (id, progress) => {
    // 更新书籍列表中的进度
    const books = get().books.map(book =>
      book.id === id ? { ...book, progress } : book
    );
    // 获取当前书籍
    const currentBook = get().currentBook;
    // 如果当前书籍是要更新的书籍，则同时更新当前书籍的进度
    const updatedCurrentBook = currentBook?.id === id
      ? { ...currentBook, progress }
      : currentBook;

    // 更新状态
    set({ books, currentBook: updatedCurrentBook });
  },

  // 更新设置方法 ----
  updateSettings: (newSettings) => {
    // 合并现有设置和新设置
    set({ settings: { ...get().settings, ...newSettings } });
  },

  // 设置加载状态方法 ----
  setLoading: (loading) => {
    // 更新加载状态
    set({ isLoading: loading });
  },

  // 设置错误信息方法 ----
  setError: (error) => {
    // 更新错误信息
    set({ error });
  },

  // 清空书籍方法 ----
  clearBooks: () => {
    // 清空书籍列表和当前书籍
    set({ books: [], currentBook: null });
  },
}));