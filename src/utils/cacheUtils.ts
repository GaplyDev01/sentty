// Simple in-memory cache for API responses
type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
};

class QueryCache {
  private cache: Record<string, CacheEntry<any>> = {};
  
  // Get data from cache if it exists and hasn't expired
  public get<T>(key: string): T | null {
    const entry = this.cache[key];
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > entry.expiresIn) {
      // Cache expired, clean it up
      delete this.cache[key];
      return null;
    }
    
    return entry.data;
  }
  
  // Store data in cache
  public set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      expiresIn
    };
  }
  
  // Check if a key exists in cache and is valid
  public has(key: string): boolean {
    const entry = this.cache[key];
    
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > entry.expiresIn) {
      // Cache expired, clean it up
      delete this.cache[key];
      return false;
    }
    
    return true;
  }
  
  // Clear entire cache or by specific key
  public clear(key?: string): void {
    if (key) {
      delete this.cache[key];
    } else {
      this.cache = {};
    }
  }
}

// Create a singleton instance
export const articleCache = new QueryCache();

// Generate a cache key from request parameters
export const generateCacheKey = (params: Record<string, any>): string => {
  const sortedParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  
  return sortedParams.map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}=[${value.sort().join(',')}]`;
    }
    return `${key}=${value}`;
  }).join('&');
};

// Debounce function to prevent rapid filter changes
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}