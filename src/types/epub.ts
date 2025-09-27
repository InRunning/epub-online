// 书籍元数据接口定义 ----
// 包含EPUB文件的基本信息，如标题、作者、描述等
export interface BookMetadata {
  // 书籍标题
  title: string;
  // 作者姓名
  author: string;
  // 书籍描述
  description: string;
  // 封面图片URL（可选）
  cover?: string;
  // 书籍唯一标识符
  identifier: string;
  // 语言代码（如zh-CN、en-US等）
  language: string;
  // 出版社名称（可选）
  publisher?: string;
  // 出版日期（可选）
  pubdate?: string;
}

// 章节信息接口定义 ----
// 描述EPUB文件中的各个章节信息
export interface ChapterInfo {
  // 章节文件路径
  href: string;
  // 章节唯一标识符
  id: string;
  // 章节标题
  label: string;
  // 章节顺序号
  order: number;
}

// 阅读进度接口定义 ----
// 记录用户在书籍中的阅读位置和进度
export interface BookProgress {
  // 当前阅读位置（CFI格式）
  currentLocation: string;
  // 整体阅读进度（0-1之间的数值）
  progress: number;
  // 当前章节索引
  chapter: number;
}

// 阅读器设置接口定义 ----
// 定义阅读器的各种显示和交互设置
export interface ReaderSettings {
  // 字体大小（像素）
  fontSize: number;
  // 字体族名称
  fontFamily: string;
  // 阅读主题
  theme: 'light' | 'dark' | 'sepia';
  // 行间距倍数
  lineHeight: number;
  // 页面宽度（像素）
  pageWidth: number;
  // 是否全屏模式
  isFullscreen: boolean;
  // 阅读模式：单栏或双栏
  columnMode: 'single' | 'double';
  // 阅读方式：分页或滚动
  readingMode: 'paginated' | 'scrolled';
}

// EPUB书籍接口定义 ----
// 完整的EPUB书籍数据结构
export interface EpubBook {
  // 书籍唯一标识符
  id: string;
  // 原始EPUB文件对象
  file: File;
  // 书籍元数据
  metadata: BookMetadata;
  // 章节信息列表
  chapters: ChapterInfo[];
  // 阅读进度信息
  progress: BookProgress;
  // 缓存的ArrayBuffer（可选，用于避免重复转换）
  _arrayBuffer?: ArrayBuffer;
}