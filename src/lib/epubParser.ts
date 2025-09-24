// EPUB解析器模块 ----
// 负责解析EPUB文件，提取元数据、章节信息和封面图像

import ePub from 'epubjs';
import { BookMetadata, ChapterInfo, EpubBook } from '@/types/epub';

// EPUB文件解析器类 ----
// 提供EPUB文件的解析、验证和内容提取功能
export class EpubParser {
  // 解析EPUB文件 ----
  // 将EPUB文件解析为可用的EpubBook对象，包含元数据、章节和进度信息
  // @param file - 要解析的EPUB文件
  // @returns 解析后的EpubBook对象
  static async parseEpubFile(file: File): Promise<EpubBook> {
    try {
      // 生成书籍唯一ID
      const bookId = this.generateBookId(file);
      // 将文件转换为ArrayBuffer以供epubjs使用
      const arrayBuffer = await file.arrayBuffer();
      // 创建epubjs书籍实例
      const book = ePub(arrayBuffer);

      // 等待书籍准备就绪
      await book.ready;

      // 提取书籍元数据
      const metadata = await this.extractMetadata(book);

      // 提取章节和导航信息
      const chapters = await this.extractChapters(book);

      // 获取封面图像
      const coverUrl = await this.extractCover(book);
      if (coverUrl) {
        metadata.cover = coverUrl;
      }

      // 构建并返回完整的书籍对象
      return {
        id: bookId,
        file,
        metadata,
        chapters,
        progress: {
          currentLocation: '',
          progress: 0,
          chapter: 0,
        },
      };
    } catch (error) {
      console.error('Error parsing EPUB file:', error);
      throw new Error('Failed to parse EPUB file. Please make sure it\'s a valid EPUB file.');
    }
  }

  // 生成书籍唯一ID ----
  // 基于文件名和时间戳生成唯一的书籍标识符
  // @param file - EPUB文件对象
  // @returns 生成的唯一ID字符串
  private static generateBookId(file: File): string {
    const timestamp = Date.now();
    // 清理文件名，移除特殊字符，只保留字母和数字
    const fileName = file.name.replace(/[^a-zA-Z0-9]/g, '');
    return `${fileName}-${timestamp}`;
  }

  // 提取书籍元数据 ----
  // 从EPUB文件中提取标题、作者、描述等基本信息
  // @param book - epubjs书籍实例
  // @returns 标准化的BookMetadata对象
  private static async extractMetadata(book: any): Promise<BookMetadata> {
    const metadata = book.package.metadata;

    // 处理并返回标准化的元数据，确保每个字段都有默认值
    return {
      title: metadata.title || 'Unknown Title',
      // 处理作者信息，可能是字符串、数组或对象
      author: Array.isArray(metadata.creator)
        ? metadata.creator.map((c: any) => typeof c === 'string' ? c : c._).join(', ')
        : (typeof metadata.creator === 'string' ? metadata.creator : metadata.creator?._ || 'Unknown Author'),
      description: metadata.description || '',
      identifier: metadata.identifier || '',
      language: metadata.language || 'en',
      publisher: metadata.publisher || '',
      pubdate: metadata.pubdate || '',
    };
  }

  // 提取章节信息 ----
  // 从EPUB文件的目录(TOC)或spine中提取章节结构
  // @param book - epubjs书籍实例
  // @returns 章节信息数组
  private static async extractChapters(book: any): Promise<ChapterInfo[]> {
    const navigation = book.navigation;
    const chapters: ChapterInfo[] = [];

    // 优先使用目录(TOC)结构
    if (navigation && navigation.toc) {
      navigation.toc.forEach((item: any, index: number) => {
        chapters.push({
          href: item.href,
          id: item.id || `chapter-${index}`,
          label: item.label || `Chapter ${index + 1}`,
          order: index,
        });
      });
    }

    // 如果没有找到目录，使用spine项目作为备选方案
    if (chapters.length === 0 && book.spine) {
      book.spine.spineItems.forEach((item: any, index: number) => {
        chapters.push({
          href: item.href,
          id: item.id || `spine-${index}`,
          label: `Section ${index + 1}`,
          order: index,
        });
      });
    }

    return chapters;
  }

  // 提取封面图像 ----
  // 从EPUB文件中提取封面图像并转换为data URL格式
  // @param book - epubjs书籍实例
  // @returns 封面图像的data URL或null（如果没有封面）
  private static async extractCover(book: any): Promise<string | null> {
    try {
      // 获取封面URL
      const coverUrl = await book.coverUrl();
      if (coverUrl) {
        // 将blob URL转换为data URL以便持久化存储
        const response = await fetch(coverUrl);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
      return null;
    } catch (error) {
      console.warn('Could not extract cover image:', error);
      return null;
    }
  }

  // 验证EPUB文件 ----
  // 验证文件是否为有效的EPUB格式
  // @param file - 要验证的文件
  // @returns 是否为有效EPUB文件的布尔值
  static async validateEpubFile(file: File): Promise<boolean> {
    try {
      // 检查文件扩展名
      if (!file.name.toLowerCase().endsWith('.epub')) {
        return false;
      }

      // 尝试解析文件以验证其有效性
      const arrayBuffer = await file.arrayBuffer();
      const book = ePub(arrayBuffer);
      await book.ready;

      return true;
    } catch (error) {
      // 任何解析错误都表明文件无效
      return false;
    }
  }
}