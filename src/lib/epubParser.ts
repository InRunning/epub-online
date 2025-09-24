// EPUB解析器模块 ----
// 负责解析EPUB文件，提取元数据、章节信息和封面图像

import ePub from 'epubjs';
import { BookMetadata, ChapterInfo, EpubBook } from '@/types/epub';
import { BookCacheManager } from './bookCache';

// EPUB文件解析器类 ----
// 提供EPUB文件的解析、验证和内容提取功能
export class EpubParser {
  // 解析EPUB文件 ----
  // 将EPUB文件解析为可用的EpubBook对象，包含元数据、章节和进度信息
  // @param file - 要解析的EPUB文件
  // @returns 解析后的EpubBook对象
  static async parseEpubFile(file: File): Promise<EpubBook> {
    console.log('Starting EPUB file parsing:', file.name);
    
    // 生成书籍唯一ID
    const bookId = this.generateBookId(file);
    console.log('Generated book ID:', bookId);
    
    // 检查缓存中是否已有该书籍
    const cachedArrayBuffer = BookCacheManager.getCachedBook(bookId);
    let arrayBuffer: ArrayBuffer;
    
    if (cachedArrayBuffer) {
      console.log('Using cached ArrayBuffer for book:', bookId);
      arrayBuffer = cachedArrayBuffer;
    } else {
      // 设置解析超时处理（减少超时时间到15秒）
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('EPUB文件解析超时'));
        }, 15000); // 15秒超时
      });

      try {
        // 将文件转换为ArrayBuffer以供epubjs使用
        console.log('Converting file to ArrayBuffer...');
        const arrayBufferPromise = file.arrayBuffer();
        arrayBuffer = await Promise.race([arrayBufferPromise, timeoutPromise]);
        console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
        
        // 缓存ArrayBuffer以供后续使用
        BookCacheManager.cacheBook(bookId, arrayBuffer);
      } catch (error) {
        if (error instanceof Error && error.message === 'EPUB文件解析超时') {
          throw new Error('转换EPUB文件超时，请检查文件是否损坏或尝试使用其他文件');
        }
        throw error;
      }
    }
    
    try {
      // 创建epubjs书籍实例
      console.log('Creating epubjs instance...');
      const book = ePub(arrayBuffer);

      // 等待书籍准备就绪，设置超时
      console.log('Waiting for book to be ready...');
      const readyPromise = book.ready;
      await Promise.race([readyPromise, new Promise((_, reject) => {
        setTimeout(() => reject(new Error('书籍准备就绪超时')), 10000);
      })]);
      console.log('Book is ready');

      // 并行执行元数据、章节和封面的提取
      console.log('Extracting book data in parallel...');
      const [metadata, chapters, coverUrl] = await Promise.all([
        this.extractMetadata(book).catch(err => {
          console.warn('Metadata extraction failed:', err);
          return this.getDefaultMetadata();
        }),
        this.extractChapters(book).catch(err => {
          console.warn('Chapters extraction failed:', err);
          return this.getDefaultChapters();
        }),
        this.extractCover(book).catch(err => {
          console.warn('Cover extraction failed:', err);
          return null;
        })
      ]);

      // 如果有封面URL，添加到元数据
      if (coverUrl) {
        metadata.cover = coverUrl;
        console.log('Cover extracted');
      }

      console.log('Metadata extracted:', metadata);
      console.log('Chapters extracted:', chapters.length);

      // 构建并返回完整的书籍对象，同时保存ArrayBuffer以避免重复转换
      console.log('EPUB parsing completed successfully');
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
        // 保存ArrayBuffer以避免在阅读器中重复转换
        _arrayBuffer: arrayBuffer,
      };
    } catch (error) {
      console.error('Error parsing EPUB file:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        fileName: file.name,
        fileSize: file.size
      });
      
      if (error instanceof Error && error.message === 'EPUB文件解析超时') {
        throw new Error('解析EPUB文件超时，请检查文件是否损坏或尝试使用其他文件');
      }
      
      throw new Error('解析EPUB文件失败，请确保文件格式正确');
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
    try {
      console.log('Extracting metadata from book...');
      
      if (!book.package || !book.package.metadata) {
        console.warn('Book package or metadata not found');
        return this.getDefaultMetadata();
      }
      
      const metadata = book.package.metadata;
      console.log('Raw metadata:', metadata);

      // 处理并返回标准化的元数据，确保每个字段都有默认值
      const result = {
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
      
      console.log('Processed metadata:', result);
      return result;
    } catch (error) {
      console.error('Error extracting metadata:', error);
      return this.getDefaultMetadata();
    }
  }

  // 获取默认元数据 ----
  // 当元数据提取失败时返回默认值
  // @returns 默认的BookMetadata对象
  private static getDefaultMetadata(): BookMetadata {
    return {
      title: 'Unknown Title',
      author: 'Unknown Author',
      description: '',
      identifier: '',
      language: 'en',
      publisher: '',
      pubdate: '',
    };
  }

  // 提取章节信息 ----
  // 从EPUB文件的目录(TOC)或spine中提取章节结构
  // @param book - epubjs书籍实例
  // @returns 章节信息数组
  private static async extractChapters(book: any): Promise<ChapterInfo[]> {
    try {
      console.log('Extracting chapters...');
      const chapters: ChapterInfo[] = [];

      // 检查导航对象
      if (!book.navigation) {
        console.warn('Book navigation not found');
        return this.getDefaultChapters();
      }

      const navigation = book.navigation;
      console.log('Navigation object found');

      // 优先使用目录(TOC)结构
      if (navigation && navigation.toc && Array.isArray(navigation.toc)) {
        console.log('Found TOC with', navigation.toc.length, 'items');
        navigation.toc.forEach((item: any, index: number) => {
          if (item && item.href) {
            chapters.push({
              href: item.href,
              id: item.id || `chapter-${index}`,
              label: item.label || `Chapter ${index + 1}`,
              order: index,
            });
          } else {
            console.warn('Invalid TOC item at index', index, ':', item);
          }
        });
      } else {
        console.warn('No valid TOC found');
      }

      // 如果没有找到目录，使用spine项目作为备选方案
      if (chapters.length === 0 && book.spine && book.spine.spineItems) {
        console.log('Using spine items as fallback, found', book.spine.spineItems.length, 'items');
        book.spine.spineItems.forEach((item: any, index: number) => {
          if (item && item.href) {
            chapters.push({
              href: item.href,
              id: item.id || `spine-${index}`,
              label: `Section ${index + 1}`,
              order: index,
            });
          } else {
            console.warn('Invalid spine item at index', index, ':', item);
          }
        });
      }

      console.log('Extracted', chapters.length, 'chapters');
      
      // 如果没有任何章节，返回默认章节
      if (chapters.length === 0) {
        console.warn('No chapters found, returning default chapters');
        return this.getDefaultChapters();
      }

      return chapters;
    } catch (error) {
      console.error('Error extracting chapters:', error);
      return this.getDefaultChapters();
    }
  }

  // 获取默认章节 ----
  // 当章节提取失败时返回默认章节
  // @returns 默认的ChapterInfo数组
  private static getDefaultChapters(): ChapterInfo[] {
    return [{
      href: '',
      id: 'default-chapter',
      label: '开始阅读',
      order: 0,
    }];
  }

  // 提取封面图像 ----
  // 从EPUB文件中提取封面图像并转换为data URL格式
  // @param book - epubjs书籍实例
  // @returns 封面图像的data URL或null（如果没有封面）
  private static async extractCover(book: any): Promise<string | null> {
    try {
      console.log('Extracting cover image...');
      
      // 检查book对象是否有coverUrl方法
      if (typeof book.coverUrl !== 'function') {
        console.warn('Book does not have coverUrl method');
        return null;
      }

      // 获取封面URL
      const coverUrl = await book.coverUrl();
      if (coverUrl) {
        console.log('Cover URL found:', coverUrl);
        
        // 将blob URL转换为data URL以便持久化存储
        const response = await fetch(coverUrl);
        if (!response.ok) {
          console.warn('Failed to fetch cover image:', response.status, response.statusText);
          return null;
        }
        
        const blob = await response.blob();
        console.log('Cover blob created, size:', blob.size);
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => {
            console.error('Error reading cover blob');
            reject(new Error('Failed to read cover image'));
          };
          reader.readAsDataURL(blob);
        });
      } else {
        console.log('No cover URL found');
        return null;
      }
    } catch (error) {
      console.error('Error extracting cover image:', error);
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