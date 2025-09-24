// 书籍缓存管理器 ----
// 提供EPUB书籍的缓存和预加载功能，优化加载性能

interface CachedBook {
  id: string;
  arrayBuffer: ArrayBuffer;
  timestamp: number;
  lastAccessed: number;
}

// 缓存配置
const CACHE_CONFIG = {
  MAX_CACHE_SIZE: 5, // 最大缓存书籍数量
  MAX_CACHE_AGE: 24 * 60 * 60 * 1000, // 缓存有效期24小时
  PRELOAD_TIMEOUT: 10000, // 预加载超时时间10秒
};

// 缓存存储
const bookCache = new Map<string, CachedBook>();

// 书籍缓存管理器类
export class BookCacheManager {
  /**
   * 检查书籍是否已缓存
   * @param bookId 书籍ID
   * @returns 是否已缓存
   */
  static isBookCached(bookId: string): boolean {
    const cached = bookCache.get(bookId);
    if (!cached) return false;
    
    // 检查缓存是否过期
    const now = Date.now();
    if (now - cached.timestamp > CACHE_CONFIG.MAX_CACHE_AGE) {
      bookCache.delete(bookId);
      return false;
    }
    
    return true;
  }

  /**
   * 获取缓存的书籍ArrayBuffer
   * @param bookId 书籍ID
   * @returns 缓存的ArrayBuffer或null
   */
  static getCachedBook(bookId: string): ArrayBuffer | null {
    const cached = bookCache.get(bookId);
    if (!cached) return null;
    
    // 检查缓存是否过期
    const now = Date.now();
    if (now - cached.timestamp > CACHE_CONFIG.MAX_CACHE_AGE) {
      bookCache.delete(bookId);
      return null;
    }
    
    // 更新最后访问时间
    cached.lastAccessed = now;
    return cached.arrayBuffer;
  }

  /**
   * 缓存书籍ArrayBuffer
   * @param bookId 书籍ID
   * @param arrayBuffer 书籍ArrayBuffer
   */
  static cacheBook(bookId: string, arrayBuffer: ArrayBuffer): void {
    // 清理过期缓存
    this.cleanExpiredCache();
    
    // 如果缓存已满，删除最久未使用的缓存
    if (bookCache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
      let oldestKey = '';
      let oldestTime = Date.now();
      
      for (const [key, cached] of bookCache) {
        if (cached.lastAccessed < oldestTime) {
          oldestTime = cached.lastAccessed;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        bookCache.delete(oldestKey);
      }
    }
    
    // 添加新缓存
    const now = Date.now();
    bookCache.set(bookId, {
      id: bookId,
      arrayBuffer,
      timestamp: now,
      lastAccessed: now,
    });
    
    console.log(`Book ${bookId} cached successfully`);
  }

  /**
   * 预加载书籍（在后台解析并缓存）
   * @param file 书籍文件
   * @param bookId 书籍ID
   */
  static async preloadBook(file: File, bookId: string): Promise<void> {
    if (this.isBookCached(bookId)) {
      console.log(`Book ${bookId} already cached, skipping preload`);
      return;
    }
    
    console.log(`Preloading book ${bookId}...`);
    
    try {
      // 设置预加载超时
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Book preload timeout'));
        }, CACHE_CONFIG.PRELOAD_TIMEOUT);
      });
      
      // 转换文件为ArrayBuffer
      const arrayBufferPromise = file.arrayBuffer();
      const arrayBuffer = await Promise.race([arrayBufferPromise, timeoutPromise]);
      
      // 缓存书籍
      this.cacheBook(bookId, arrayBuffer);
      console.log(`Book ${bookId} preloaded successfully`);
      
    } catch (error) {
      console.warn(`Failed to preload book ${bookId}:`, error);
    }
  }

  /**
   * 清理过期缓存
   */
  static cleanExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, cached] of bookCache) {
      if (now - cached.timestamp > CACHE_CONFIG.MAX_CACHE_AGE) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      bookCache.delete(key);
    });
    
    if (expiredKeys.length > 0) {
      console.log(`Cleaned ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * 清除所有缓存
   */
  static clearAllCache(): void {
    bookCache.clear();
    console.log('All book cache cleared');
  }

  /**
   * 获取缓存统计信息
   */
  static getCacheStats(): {
    totalCached: number;
    totalSize: number;
    oldestCache: number;
    newestCache: number;
  } {
    let totalSize = 0;
    let oldestTime = Date.now();
    let newestTime = 0;
    
    for (const cached of bookCache.values()) {
      totalSize += cached.arrayBuffer.byteLength;
      oldestTime = Math.min(oldestTime, cached.timestamp);
      newestTime = Math.max(newestTime, cached.timestamp);
    }
    
    return {
      totalCached: bookCache.size,
      totalSize,
      oldestCache: oldestTime,
      newestCache: newestTime,
    };
  }
}

// 定期清理过期缓存（每小时一次）
if (typeof window !== 'undefined') {
  setInterval(() => {
    BookCacheManager.cleanExpiredCache();
  }, 60 * 60 * 1000);
}