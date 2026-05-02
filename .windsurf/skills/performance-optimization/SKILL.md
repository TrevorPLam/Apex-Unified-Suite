---
name: performance-optimization
description: Optimize bundle size, implement caching strategies, and monitor Core Web Vitals
---

# Performance Optimization Implementation

This skill guides you through implementing comprehensive performance optimizations for the Apex Unified Suite, including bundle optimization, caching strategies, and Core Web Vitals monitoring.

## Current Performance Assessment

**Performance Status**: Basic optimizations exist but need significant improvements.

**Current Issues**:
- No bundle size optimization or code splitting
- No caching strategies implemented
- No Core Web Vitals monitoring
- No image optimization
- No lazy loading for heavy components
- No performance monitoring

## Performance Architecture

### **Optimization Layers**
```
┌─────────────────────────────────────────┐
│           Network Layer                 │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ CDN Caching │  │ HTTP Caching    │   │
│  │ Asset Opt   │  │ Service Workers │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Application Layer               │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Code Split   │  │ Lazy Loading    │   │
│  │ Bundle Split │  │ Image Optimize  │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│            Monitoring Layer              │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ CWV Monitor │  │ Performance API │   │
│  │ Bundle Analy │  │ User Analytics  │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

## Step-by-Step Implementation

### **Step 1: Bundle Optimization Configuration**

**Update**: `artifacts/apex-os/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@workspace/api-client-react': resolve(__dirname, '../../lib/api-client-react/src'),
      '@workspace/api-zod': resolve(__dirname, '../../lib/api-zod/src'),
      '@workspace/db': resolve(__dirname, '../../lib/db/src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ['react', 'react-dom'],
          router: ['wouter', 'wouter-use-location'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts'],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
          
          // Workspace packages
          'api-client': ['@workspace/api-client-react'],
          'api-zod': ['@workspace/api-zod'],
          
          // Feature chunks
          auth: ['@/contexts/AuthContext'],
          dashboard: ['@/pages/Dashboard'],
          crm: ['@/pages/CRM'],
          projects: ['@/pages/Projects'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wouter',
      '@radix-ui/react-dialog',
      'recharts',
      'date-fns',
    ],
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
});
```

### **Step 2: Code Splitting Implementation**

**File**: `artifacts/apex-os/src/components/LazyComponents.tsx`
```typescript
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/ui/loading-states';

// Lazy loaded components
export const LazyCRM = React.lazy(() => 
  import('@/pages/CRM').then(module => ({
    default: module.CRMPage
  }))
);

export const LazyProjects = React.lazy(() => 
  import('@/pages/Projects').then(module => ({
    default: module.ProjectsPage
  }))
);

export const LazyDocuments = React.lazy(() => 
  import('@/pages/Documents').then(module => ({
    default: module.DocumentsPage
  }))
);

export const LazyFinance = React.lazy(() => 
  import('@/pages/Finance').then(module => ({
    default: module.FinancePage
  }))
);

export const LazyAssets = React.lazy(() => 
  import('@/pages/Assets').then(module => ({
    default: module.AssetsPage
  }))
);

export const LazyPortal = React.lazy(() => 
  import('@/pages/Portal').then(module => ({
    default: module.PortalPage
  }))
);

export const LazyAnalytics = React.lazy(() => 
  import('@/pages/Analytics').then(module => ({
    default: module.AnalyticsPage
  }))
);

export const LazySettings = React.lazy(() => 
  import('@/pages/Settings').then(module => ({
    default: module.SettingsPage
  }))
);

// Heavy components
export const LazyChart = React.lazy(() => 
  import('@/components/charts/RevenueChart').then(module => ({
    default: module.RevenueChart
  }))
);

export const LazyDataTable = React.lazy(() => 
  import('@/components/ui/DataTable').then(module => ({
    default: module.DataTable
  }))
);

// Loading wrappers
export function LazyWrapper({ children, fallback }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <Suspense fallback={fallback || <PageSkeleton />}>
      {children}
    </Suspense>
  );
}

export function ChartWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      {children}
    </Suspense>
  );
}

// Page skeleton
function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
```

### **Step 3: Image Optimization Component**

**File**: `artifacts/apex-os/src/components/ui/OptimizedImage.tsx`
```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Use Intersection Observer for lazy loading
    if (!priority) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              img.src = src;
              observer.unobserve(img);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(img);
      return () => observer.disconnect();
    } else {
      img.src = src;
    }
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const generateSrcSet = (baseSrc: string) => {
    if (!baseSrc || !width) return '';
    
    const sizes = [width, width * 2, width * 1.5];
    return sizes
      .map(size => `${baseSrc}?w=${size}&q=75 ${size}w`)
      .join(', ');
  };

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`} style={{ width, height }}>
        <span className="text-muted-foreground text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && placeholder === 'blur' && (
        <div className="absolute inset-0 bg-muted animate-pulse">
          {blurDataURL ? (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover blur-sm"
              style={{ filter: 'blur(20px)' }}
            />
          ) : (
            <Skeleton className="w-full h-full" />
          )}
        </div>
      )}

      <img
        ref={imgRef}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-1'}`}
        srcSet={generateSrcSet(src)}
        sizes={`${width}px`}
      />
    </div>
  );
}

// Avatar component with optimization
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className = '',
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  if (!src) {
    return (
      <div 
        className={`flex items-center justify-center bg-primary text-primary-foreground rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <span style={{ fontSize: size * 0.4 }}>
          {alt.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      priority={size > 80} // Prioritize larger avatars
    />
  );
}
```

### **Step 4: Service Worker Implementation**

**File**: `artifacts/apex-os/public/sw.js`
```javascript
const CACHE_NAME = 'apex-unified-suite-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/crm',
  '/projects',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE
            )
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first with network fallback
  if (url.pathname.startsWith('/assets/') || 
      url.pathname.includes('.js') || 
      url.pathname.includes('.css') ||
      url.pathname.includes('.woff')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            });
        })
    );
    return;
  }

  // HTML pages - network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Return cached HTML or fallback
        return caches.match(request)
          .then((response) => {
            return response || caches.match('/');
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline actions
  const offlineActions = await getOfflineActions();
  
  for (const action of offlineActions) {
    try {
      await fetch(action.url, action.options);
      await removeOfflineAction(action.id);
    } catch (error) {
      console.error('Failed to sync offline action:', error);
    }
  }
}

async function getOfflineActions() {
  // Get offline actions from IndexedDB
  return [];
}

async function removeOfflineAction(id) {
  // Remove action from IndexedDB
  return Promise.resolve();
}
```

**File**: `artifacts/apex-os/src/lib/serviceWorker.ts`
```typescript
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available
                  if (confirm('New version available. Reload now?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
```

### **Step 5: Core Web Vitals Monitoring**

**File**: `artifacts/apex-os/src/lib/performance.ts`
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export interface WebVitals {
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  ttfb: number; // Time to First Byte
}

export interface PerformanceMetrics {
  webVitals: WebVitals;
  loadTime: number;
  domContentLoaded: number;
  resources: PerformanceResourceTiming[];
  navigation: PerformanceNavigationTiming;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Partial<WebVitals> = {};
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring(): void {
    // Monitor Core Web Vitals
    getCLS((metric) => {
      this.metrics.cls = metric.value;
      this.reportMetric('CLS', metric);
    });

    getFID((metric) => {
      this.metrics.fid = metric.value;
      this.reportMetric('FID', metric);
    });

    getFCP((metric) => {
      this.metrics.fcp = metric.value;
      this.reportMetric('FCP', metric);
    });

    getLCP((metric) => {
      this.metrics.lcp = metric.value;
      this.reportMetric('LCP', metric);
    });

    getTTFB((metric) => {
      this.metrics.ttfb = metric.value;
      this.reportMetric('TTFB', metric);
    });

    // Monitor resource loading
    this.observeResources();
    
    // Monitor long tasks
    this.observeLongTasks();
  }

  private observeResources(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            this.analyzeResource(resource);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  private observeLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'longtask') {
            this.reportLongTask(entry);
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    }
  }

  private analyzeResource(resource: PerformanceResourceTiming): void {
    const { name, duration, transferSize, encodedBodySize } = resource;
    
    // Flag slow resources
    if (duration > 1000) {
      console.warn('Slow resource detected:', {
        name,
        duration,
        transferSize,
      });
    }

    // Flag large resources
    if (transferSize > 1024 * 1024) { // 1MB
      console.warn('Large resource detected:', {
        name,
        transferSize,
        encodedBodySize,
      });
    }
  }

  private reportLongTask(entry: PerformanceEntry): void {
    console.warn('Long task detected:', {
      duration: entry.duration,
      startTime: entry.startTime,
    });
  }

  private reportMetric(name: string, metric: any): void {
    const value = metric.value;
    const rating = this.getRating(name, value);
    
    // Send to analytics
    this.sendToAnalytics({
      metric: name,
      value,
      rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Log poor performance
    if (rating === 'poor') {
      console.warn(`Poor ${name} performance:`, value);
    }
  }

  private getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'needs-improvement';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private sendToAnalytics(data: any): void {
    // Send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to your analytics service
      // analytics.track('web_vital', data);
    }
  }

  getMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return {
      webVitals: this.metrics as WebVitals,
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      resources,
      navigation,
    };
  }

  stopMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Performance monitoring hook
export function usePerformanceMonitoring() {
  React.useEffect(() => {
    performanceMonitor.startMonitoring();
    
    return () => {
      performanceMonitor.stopMonitoring();
    };
  }, []);

  const getReport = React.useCallback(() => {
    return performanceMonitor.getMetrics();
  }, []);

  return { getReport };
}
```

### **Step 6: Caching Implementation**

**File**: `artifacts/api-server/src/middlewares/cache.ts`
```typescript
import { Request, Response, NextFunction } from 'express';

interface CacheOptions {
  maxAge?: number;
  etag?: boolean;
  lastModified?: boolean;
  vary?: string[];
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    maxAge = 300, // 5 minutes default
    etag = true,
    lastModified = true,
    vary = ['Accept-Encoding'],
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Set cache control headers
    const cacheControl = [`max-age=${maxAge}`];
    if (maxAge === 0) {
      cacheControl.push('no-cache', 'no-store', 'must-revalidate');
    } else {
      cacheControl.push('public');
    }
    
    res.set('Cache-Control', cacheControl.join(', '));

    // Set Vary header
    if (vary.length > 0) {
      res.set('Vary', vary.join(', '));
    }

    // Generate ETag
    if (etag) {
      const data = JSON.stringify(req.query);
      const hash = require('crypto').createHash('md5').update(data).digest('hex');
      res.set('ETag', `"${hash}"`);

      // Check if client has current version
      if (req.headers['if-none-match'] === `"${hash}"`) {
        return res.status(304).end();
      }
    }

    // Set Last-Modified
    if (lastModified) {
      const now = new Date();
      res.set('Last-Modified', now.toUTCString());

      // Check if client has cached version
      const ifModifiedSince = req.headers['if-modified-since'];
      if (ifModifiedSince) {
        const clientDate = new Date(ifModifiedSince);
        if (clientDate >= now) {
          return res.status(304).end();
        }
      }
    }

    next();
  };
}

// Redis cache implementation
export class RedisCache {
  private client: any; // Redis client

  constructor(redisClient: any) {
    this.client = redisClient;
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}

// Cache middleware for API responses
export function apiCache(cache: RedisCache, ttl: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const key = `api:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;

    // Try to get from cache
    const cached = await cache.get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Override res.json to cache response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data, ttl).catch(console.error);
      }
      
      res.set('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };

    next();
  };
}
```

### **Step 7: Performance Monitoring Dashboard**

**File**: `artifacts/apex-os/src/components/performance/PerformanceDashboard.tsx`
```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePerformanceMonitoring } from '@/lib/performance';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  threshold: { good: number; poor: number };
  description: string;
}

function MetricCard({ title, value, unit, threshold, description }: MetricCardProps) {
  const getRating = () => {
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const rating = getRating();
  const progress = Math.min((value / threshold.poor) * 100, 100);

  const colors = {
    good: 'text-green-600',
    'needs-improvement': 'text-yellow-600',
    poor: 'text-red-600',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold">
            {value.toFixed(0)}{unit}
          </span>
          <Badge variant={rating === 'good' ? 'default' : rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
            {rating.replace('-', ' ')}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0</span>
          <span>{threshold.poor}{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function PerformanceDashboard() {
  const { getReport } = usePerformanceMonitoring();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = () => {
      try {
        const report = getReport();
        setMetrics(report);
      } catch (error) {
        console.error('Failed to load performance metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getReport]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Performance metrics not available
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <Badge variant="outline">
          Last updated: {new Date().toLocaleTimeString()}
        </Badge>
      </div>

      {/* Core Web Vitals */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Core Web Vitals</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="LCP"
            value={metrics.webVitals.lcp || 0}
            unit="ms"
            threshold={{ good: 2500, poor: 4000 }}
            description="Largest Contentful Paint"
          />
          <MetricCard
            title="FID"
            value={metrics.webVitals.fid || 0}
            unit="ms"
            threshold={{ good: 100, poor: 300 }}
            description="First Input Delay"
          />
          <MetricCard
            title="CLS"
            value={metrics.webVitals.cls || 0}
            unit=""
            threshold={{ good: 0.1, poor: 0.25 }}
            description="Cumulative Layout Shift"
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Additional Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="FCP"
            value={metrics.webVitals.fcp || 0}
            unit="ms"
            threshold={{ good: 1800, poor: 3000 }}
            description="First Contentful Paint"
          />
          <MetricCard
            title="TTFB"
            value={metrics.webVitals.ttfb || 0}
            unit="ms"
            threshold={{ good: 800, poor: 1800 }}
            description="Time to First Byte"
          />
          <MetricCard
            title="Load Time"
            value={metrics.loadTime || 0}
            unit="ms"
            threshold={{ good: 1000, poor: 3000 }}
            description="Page Load Time"
          />
        </div>
      </div>

      {/* Resource Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Analysis</CardTitle>
          <CardDescription>
            Analysis of loaded resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Total Resources:</span>
              <span>{metrics.resources?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>DOM Content Loaded:</span>
              <span>{metrics.domContentLoaded?.toFixed(0)}ms</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Performance Checklist

### **Bundle Optimization**
- [ ] Implement code splitting for routes and components
- [ ] Configure manual chunks for vendor libraries
- [ ] Enable tree shaking and dead code elimination
- [ ] Implement proper minification with Terser
- [ ] Optimize bundle size with compression
- [ ] Use dynamic imports for heavy components

### **Image Optimization**
- [ ] Implement lazy loading for images
- [ ] Use responsive images with srcset
- [ ] Optimize image formats (WebP, AVIF)
- [ ] Implement image compression
- [ ] Add blur-up placeholders
- [ ] Use CDN for image delivery

### **Caching Strategies**
- [ ] Implement HTTP caching headers
- [ ] Use Redis for API response caching
- [ ] Implement service worker for offline caching
- [ ] Add cache invalidation strategies
- [ ] Implement browser storage for user data
- [ ] Use CDN for static assets

### **Performance Monitoring**
- [ ] Monitor Core Web Vitals
- [ ] Track resource loading performance
- [ ] Implement performance budgets
- [ ] Add real user monitoring (RUM)
- [ ] Create performance dashboard
- [ ] Set up performance alerts

### **Runtime Optimization**
- [ ] Implement virtual scrolling for large lists
- [ ] Use React.memo for expensive components
- [ ] Optimize re-renders with proper dependencies
- [ ] Implement debouncing for search inputs
- [ ] Use requestIdleCallback for non-critical tasks
- [ ] Implement progressive loading

This comprehensive performance optimization implementation significantly improves the Apex Unified Suite's performance, user experience, and monitoring capabilities.
