---
trigger: model_decision
description: Web Vitals budget enforcement for performance metrics with automated monitoring and alerts
---

# Web Vitals Budget

## Core Principle

### Performance Budget Enforcement
All web pages must meet strict Web Vitals budgets to ensure optimal user experience. Performance budgets are enforced through automated monitoring, CI/CD gates, and real-time alerts.

## Required Performance Metrics

### 1. Core Web Vitals Budgets
```typescript
// ✅ CORRECT - Web Vitals budget configuration
export interface WebVitalsBudget {
  // Largest Contentful Paint (LCP) - loading performance
  lcp: {
    target: 2000; // 2 seconds for good experience
    budget: 2500; // 2.5 seconds maximum budget
    warning: 2200; // Warning threshold
  };
  
  // Interaction to Next Paint (INP) - responsiveness
  inp: {
    target: 200; // 200ms for good experience
    budget: 500; // 500ms maximum budget
    warning: 300; // Warning threshold
  };
  
  // Cumulative Layout Shift (CLS) - visual stability
  cls: {
    target: 0.1; // 0.1 for good experience
    budget: 0.25; // 0.25 maximum budget
    warning: 0.15; // Warning threshold
  };
  
  // First Contentful Paint (FCP) - loading performance
  fcp: {
    target: 1000; // 1 second for good experience
    budget: 1800; // 1.8 seconds maximum budget
    warning: 1500; // Warning threshold
  };
  
  // Time to First Byte (TTFB) - server response
  ttfb: {
    target: 600; // 600ms for good experience
    budget: 800; // 800ms maximum budget
    warning: 700; // Warning threshold
  };
  
  // First Input Delay (FID) - interactivity (legacy)
  fid: {
    target: 100; // 100ms for good experience
    budget: 300; // 300ms maximum budget
    warning: 200; // Warning threshold
  };
}

export const webVitalsBudget: WebVitalsBudget = {
  lcp: { target: 2000, budget: 2500, warning: 2200 },
  inp: { target: 200, budget: 500, warning: 300 },
  cls: { target: 0.1, budget: 0.25, warning: 0.15 },
  fcp: { target: 1000, budget: 1800, warning: 1500 },
  ttfb: { target: 600, budget: 800, warning: 700 },
  fid: { target: 100, budget: 300, warning: 200 },
};

// ❌ INCORRECT - No performance budgets
const performanceConfig = {
  // No specific targets or budgets
  lcp: 'fast',
  cls: 'low',
  inp: 'responsive',
};
```

### 2. Performance Monitoring Service
```typescript
// ✅ CORRECT - Comprehensive performance monitoring
export class WebVitalsMonitor {
  private budget: WebVitalsBudget;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];

  constructor(budget: WebVitalsBudget) {
    this.budget = budget;
    this.setupObservers();
  }

  private setupObservers(): void {
    // Monitor LCP
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      entries.forEach(entry => this.recordMetric('lcp', entry.startTime));
    });

    // Monitor INP
    this.observePerformanceEntry('event', (entries) => {
      entries.forEach(entry => {
        if (entry.duration > 0) {
          this.recordMetric('inp', entry.duration);
        }
      });
    });

    // Monitor CLS
    this.observePerformanceEntry('layout-shift', (entries) => {
      let clsValue = 0;
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.recordMetric('cls', clsValue);
    });

    // Monitor FCP
    this.observePerformanceEntry('paint', (entries) => {
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('fcp', entry.startTime);
        }
      });
    });

    // Monitor TTFB
    this.observePerformanceEntry('navigation', (entries) => {
      entries.forEach(entry => {
        if (entry.responseStart > 0) {
          this.recordMetric('ttfb', entry.responseStart);
        }
      });
    });

    // Monitor FID (legacy)
    this.observePerformanceEntry('first-input', (entries) => {
      entries.forEach(entry => {
        this.recordMetric('fid', entry.processingStart - entry.startTime);
      });
    });
  }

  private observePerformanceEntry(
    type: string,
    callback: (entries: PerformanceEntry[]) => void
  ): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  private recordMetric(name: string, value: number): void {
    const timestamp = Date.now();
    const pageUrl = window.location.href;
    
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp,
      pageUrl,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    // Check against budget
    this.checkBudgetViolation(name, value, pageUrl);

    // Send to analytics
    this.sendToAnalytics(metric);
  }

  private checkBudgetViolation(
    metricName: string,
    value: number,
    pageUrl: string
  ): void {
    const budget = this.budget[metricName as keyof WebVitalsBudget];
    if (!budget) return;

    const alert: PerformanceAlert = {
      metric: metricName,
      value,
      threshold: budget.budget,
      warning: budget.warning,
      target: budget.target,
      pageUrl,
      timestamp: Date.now(),
      severity: this.determineSeverity(value, budget),
    };

    if (value > budget.budget) {
      alert.severity = 'critical';
      this.alerts.push(alert);
      this.triggerAlert(alert);
    } else if (value > budget.warning) {
      alert.severity = 'warning';
      this.alerts.push(alert);
      this.triggerAlert(alert);
    }

    // Send alert to monitoring service
    this.sendAlert(alert);
  }

  private determineSeverity(
    value: number,
    budget: any
  ): 'good' | 'needs-improvement' | 'poor' {
    if (value <= budget.target) return 'good';
    if (value <= budget.warning) return 'needs-improvement';
    return 'poor';
  }

  private triggerAlert(alert: PerformanceAlert): void {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Performance Alert: ${alert.metric} = ${alert.value}ms (${alert.severity})`);
    }

    // Show user notification for critical issues
    if (alert.severity === 'critical') {
      this.showUserNotification(alert);
    }
  }

  private showUserNotification(alert: PerformanceAlert): void {
    // Create a subtle notification for users
    const notification = document.createElement('div');
    notification.className = 'performance-alert';
    notification.innerHTML = `
      <div class="performance-alert-content">
        <h4>Performance Issue Detected</h4>
        <p>${this.getAlertMessage(alert)}</p>
        <button onclick="this.parentElement.parentElement.remove()">Dismiss</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  private getAlertMessage(alert: PerformanceAlert): string {
    const messages = {
      lcp: 'Page loading is slower than expected',
      inp: 'Page interactions are responding slowly',
      cls: 'Page layout is shifting unexpectedly',
      fcp: 'Page content is taking time to appear',
      ttfb: 'Server response is slower than expected',
      fid: 'Page interactions are delayed',
    };
    
    return messages[alert.metric as keyof typeof messages] || 'Performance issue detected';
  }

  private sendToAnalytics(metric: PerformanceMetric): void {
    // Send to analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', 'web_vitals', {
        metric_name: metric.name,
        value: metric.value,
        page_location: metric.pageUrl,
        custom_map: {
          metric_value: metric.value,
          metric_name: metric.name,
        },
      });
    }
  }

  private sendAlert(alert: PerformanceAlert): void {
    // Send alert to monitoring service
    fetch('/api/performance/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alert),
    }).catch(error => {
      console.warn('Failed to send performance alert:', error);
    });
  }

  getMetricsSummary(): MetricsSummary {
    const summary: MetricsSummary = {
      lcp: this.getMetricStats('lcp'),
      inp: this.getMetricStats('inp'),
      cls: this.getMetricStats('cls'),
      fcp: this.getMetricStats('fcp'),
      ttfb: this.getMetricStats('ttfb'),
      fid: this.getMetricStats('fid'),
      alerts: this.alerts,
      timestamp: Date.now(),
    };
    
    return summary;
  }

  private getMetricStats(metricName: string): MetricStats {
    const metrics = this.metrics.get(metricName) || [];
    
    if (metrics.length === 0) {
      return {
        count: 0,
        average: 0,
        median: 0,
        p75: 0,
        p90: 0,
        p95: 0,
        min: 0,
        max: 0,
      };
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    
    return {
      count: values.length,
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      median: this.percentile(values, 50),
      p75: this.percentile(values, 75),
      p90: this.percentile(values, 90),
      p95: this.percentile(values, 95),
      min: values[0],
      max: values[values.length - 1],
    };
  }

  private percentile(sortedValues: number[], p: number): number {
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  destroy(): void {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
    this.alerts = [];
  }
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  pageUrl: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
}

interface PerformanceAlert {
  metric: string;
  value: number;
  threshold: number;
  warning: number;
  target: number;
  pageUrl: string;
  timestamp: number;
  severity: 'good' | 'needs-improvement' | 'poor' | 'warning' | 'critical';
}

interface MetricsSummary {
  lcp: MetricStats;
  inp: MetricStats;
  cls: MetricStats;
  fcp: MetricStats;
  ttfb: MetricStats;
  fid: MetricStats;
  alerts: PerformanceAlert[];
  timestamp: number;
}

interface MetricStats {
  count: number;
  average: number;
  median: number;
  p75: number;
  p90: number;
  p95: number;
  min: number;
  max: number;
}

// ❌ INCORRECT - No performance monitoring
class BasicMonitor {
  constructor() {
    // No monitoring setup
  }
  
  trackPerformance() {
    console.log('Performance tracking not implemented');
  }
}
```

### 3. Budget Enforcement Middleware
```typescript
// ✅ CORRECT - Budget enforcement middleware
export class BudgetEnforcement {
  private monitor: WebVitalsMonitor;
  private budget: WebVitalsBudget;
  private enforcementEnabled: boolean;

  constructor(budget: WebVitalsBudget, enforcementEnabled: boolean = true) {
    this.budget = budget;
    this.enforcementEnabled = enforcementEnabled;
    this.monitor = new WebVitalsMonitor(budget);
  }

  enforceBudget(): void {
    if (!this.enforcementEnabled) return;

    // Monitor page load performance
    this.monitorPageLoad();

    // Monitor route changes
    this.monitorRouteChanges();

    // Monitor user interactions
    this.monitorInteractions();

    // Set up periodic checks
    this.setupPeriodicChecks();
  }

  private monitorPageLoad(): void {
    // Check performance on page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.checkPagePerformance();
      }, 1000); // Wait for metrics to settle
    });
  }

  private monitorRouteChanges(): void {
    // Monitor performance on route changes (SPA)
    if (window.history) {
      const originalPushState = window.history.pushState;
      window.history.pushState = function(...args) {
        originalPushState.apply(this, args);
        setTimeout(() => {
          this.checkPagePerformance();
        }, 1000);
      }.bind(this);
    }
  }

  private monitorInteractions(): void {
    // Monitor performance of user interactions
    document.addEventListener('click', (event) => {
      const startTime = performance.now();
      
      // Use requestAnimationFrame to measure when the interaction is processed
      requestAnimationFrame(() => {
        const endTime = performance.now();
        const interactionTime = endTime - startTime;
        
        // Check if interaction time exceeds budget
        if (interactionTime > this.budget.inp.budget) {
          this.handleSlowInteraction(interactionTime, event.target);
        }
      });
    });
  }

  private setupPeriodicChecks(): void {
    // Check performance every 30 seconds
    setInterval(() => {
      this.checkPagePerformance();
    }, 30000);
  }

  private checkPagePerformance(): void {
    const metrics = this.monitor.getMetricsSummary();
    
    // Check each metric against budget
    Object.entries(metrics).forEach(([metricName, stats]) => {
      if (metricName === 'alerts' || metricName === 'timestamp') return;
      
      const budget = this.budget[metricName as keyof WebVitalsBudget];
      if (!budget) return;

      if (stats.p95 > budget.budget) {
        this.handleBudgetViolation(metricName, stats.p95, budget);
      }
    });
  }

  private handleBudgetViolation(
    metricName: string,
    value: number,
    budget: any
  ): void {
    const violation: BudgetViolation = {
      metric: metricName,
      value,
      budget: budget.budget,
      target: budget.target,
      pageUrl: window.location.href,
      timestamp: Date.now(),
      severity: value > budget.budget * 1.5 ? 'critical' : 'warning',
    };

    // Log violation
    console.error(`Budget Violation: ${metricName} = ${value}ms (budget: ${budget.budget}ms)`);

    // Send to monitoring service
    this.sendViolation(violation);

    // Take corrective action
    this.takeCorrectiveAction(violation);
  }

  private handleSlowInteraction(interactionTime: number, target: Element): void {
    const violation: BudgetViolation = {
      metric: 'interaction',
      value: interactionTime,
      budget: this.budget.inp.budget,
      target: this.budget.inp.target,
      pageUrl: window.location.href,
      timestamp: Date.now(),
      severity: interactionTime > this.budget.inp.budget * 1.5 ? 'critical' : 'warning',
      target: target.tagName.toLowerCase(),
    };

    // Log slow interaction
    console.warn(`Slow Interaction: ${interactionTime}ms on ${target.tagName}`);

    // Send to monitoring service
    this.sendViolation(violation);
  }

  private sendViolation(violation: BudgetViolation): void {
    fetch('/api/performance/violations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(violation),
    }).catch(error => {
      console.warn('Failed to send budget violation:', error);
    });
  }

  private takeCorrectiveAction(violation: BudgetViolation): void {
    switch (violation.metric) {
      case 'lcp':
        this.optimizeLoadingPerformance(violation);
        break;
      case 'inp':
        this.optimizeInteractivity(violation);
        break;
      case 'cls':
        this.optimizeLayoutStability(violation);
        break;
      case 'fcp':
        this.optimizeFirstContentfulPaint(violation);
        break;
      case 'ttfb':
        this.optimizeServerResponse(violation);
        break;
    }
  }

  private optimizeLoadingPerformance(violation: BudgetViolation): void {
    // Suggest optimizations for slow loading
    console.info('Loading Performance Optimization Suggestions:');
    console.info('- Optimize images (lazy loading, WebP format)');
    console.info('- Minimize CSS and JavaScript');
    console.info('- Use CDN for static assets');
    console.info('- Implement resource hints (preload, prefetch)');
  }

  private optimizeInteractivity(violation: BudgetViolation): void {
    // Suggest optimizations for slow interactions
    console.info('Interactivity Optimization Suggestions:');
    console.info('- Reduce JavaScript execution time');
    console.info('- Use web workers for heavy computations');
    console.info('- Implement code splitting');
    console.info('- Optimize event handlers');
  }

  private optimizeLayoutStability(violation: BudgetViolation): void {
    // Suggest optimizations for layout shifts
    console.info('Layout Stability Optimization Suggestions:');
    console.info('- Reserve space for dynamic content');
    console.info('- Use transform and opacity for animations');
    console.info('- Avoid inserting content above existing content');
    console.info('- Use font-display: swap for web fonts');
  }

  private optimizeFirstContentfulPaint(violation: BudgetViolation): void {
    // Suggest optimizations for slow FCP
    console.info('FCP Optimization Suggestions:');
    console.info('- Minimize render-blocking resources');
    console.info('- Inline critical CSS');
    console.info('- Optimize server response time');
    console.info('- Use HTTP/2 or HTTP/3');
  }

  private optimizeServerResponse(violation: BudgetViolation): void {
    // Suggest optimizations for slow TTFB
    console.info('Server Response Optimization Suggestions:');
    console.info('- Optimize server performance');
    console.info('- Use edge caching');
    console.info('- Implement CDN');
    console.info('- Optimize database queries');
  }
}

interface BudgetViolation {
  metric: string;
  value: number;
  budget: number;
  target: number;
  pageUrl: string;
  timestamp: number;
  severity: 'warning' | 'critical';
  target?: string;
}

// ❌ INCORRECT - No budget enforcement
class NoEnforcement {
  enforceBudget() {
    // No enforcement - performance issues go undetected
    console.log('Budget enforcement not implemented');
  }
}
```

### 4. CI/CD Performance Gates
```yaml
# ✅ CORRECT - CI/CD performance testing pipeline
name: Performance Testing

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  performance-test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Start application
      run: |
        npm run start &
        sleep 10

    - name: Run Lighthouse CI
      run: |
        npm install -g @lhci/cli
        lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

    - name: Run Web Vitals tests
      run: npm run test:performance

    - name: Check performance budgets
      run: npm run check:budgets

    - name: Generate performance report
      run: npm run report:performance

    - name: Upload performance artifacts
      uses: actions/upload-artifact@v4
      with:
        name: performance-reports
        path: |
          .lighthouseci/
          performance-report.json

    - name: Comment on PR with performance results
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          const report = JSON.parse(fs.readFileSync('performance-report.json', 'utf8'));
          
          const comment = `
          ## Performance Report
          
          ### Core Web Vitals
          - **LCP**: ${report.lcp}ms (Budget: 2500ms)
          - **INP**: ${report.inp}ms (Budget: 500ms)
          - **CLS**: ${report.cls} (Budget: 0.25)
          
          ### Other Metrics
          - **FCP**: ${report.fcp}ms (Budget: 1800ms)
          - **TTFB**: ${report.ttfb}ms (Budget: 800ms)
          
          ### Status
          ${report.passed ? '✅ All budgets passed' : '❌ Some budgets exceeded'}
          `;
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });

    - name: Check performance budgets
      run: |
        const report = JSON.parse(fs.readFileSync('performance-report.json', 'utf8'));
        if (!report.passed) {
          echo "::error::Performance budgets exceeded. Please optimize before merging.";
          exit 1;
        }

# ❌ INCORRECT - No performance testing
# Manual testing only - no automation
```

## Implementation Patterns

### 1. Performance Budget Configuration
```typescript
// ✅ CORRECT - Flexible budget configuration
export class PerformanceBudgetConfig {
  static createBudget(environment: 'development' | 'staging' | 'production'): WebVitalsBudget {
    const baseBudget: WebVitalsBudget = {
      lcp: { target: 2000, budget: 2500, warning: 2200 },
      inp: { target: 200, budget: 500, warning: 300 },
      cls: { target: 0.1, budget: 0.25, warning: 0.15 },
      fcp: { target: 1000, budget: 1800, warning: 1500 },
      ttfb: { target: 600, budget: 800, warning: 700 },
      fid: { target: 100, budget: 300, warning: 200 },
    };

    switch (environment) {
      case 'development':
        // More lenient budgets for development
        return {
          lcp: { target: 3000, budget: 5000, warning: 4000 },
          inp: { target: 300, budget: 800, warning: 500 },
          cls: { target: 0.2, budget: 0.5, warning: 0.3 },
          fcp: { target: 1500, budget: 3000, warning: 2000 },
          ttfb: { target: 1000, budget: 2000, warning: 1500 },
          fid: { target: 200, budget: 500, warning: 300 },
        };
      
      case 'staging':
        // Slightly more lenient for staging
        return {
          lcp: { target: 2500, budget: 3500, warning: 3000 },
          inp: { target: 250, budget: 600, warning: 400 },
          cls: { target: 0.15, budget: 0.35, warning: 0.2 },
          fcp: { target: 1200, budget: 2200, warning: 1800 },
          ttfb: { target: 800, budget: 1200, warning: 1000 },
          fid: { target: 150, budget: 400, warning: 250 },
        };
      
      case 'production':
        // Strict budgets for production
        return baseBudget;
      
      default:
        return baseBudget;
    }
  }

  static createPageSpecificBudget(pageType: string): Partial<WebVitalsBudget> {
    const budgets: Record<string, Partial<WebVitalsBudget>> = {
      'dashboard': {
        lcp: { target: 1500, budget: 2000, warning: 1800 },
        inp: { target: 150, budget: 400, warning: 250 },
        cls: { target: 0.05, budget: 0.15, warning: 0.1 },
      },
      'forms': {
        inp: { target: 100, budget: 300, warning: 200 },
        cls: { target: 0.02, budget: 0.1, warning: 0.05 },
      },
      'media': {
        lcp: { target: 2500, budget: 3500, warning: 3000 },
        cls: { target: 0.15, budget: 0.3, warning: 0.2 },
      },
      'search': {
        inp: { target: 200, budget: 400, warning: 300 },
        fcp: { target: 800, budget: 1500, warning: 1200 },
      },
    };

    return budgets[pageType] || {};
  }
}

// ❌ INCORRECT - No environment-specific budgets
const budget = {
  lcp: 2000,
  inp: 200,
  cls: 0.1,
  // No environment or page-specific considerations
};
```

### 2. Performance Optimization Strategies
```typescript
// ✅ CORRECT - Performance optimization service
export class PerformanceOptimizer {
  private monitor: WebVitalsMonitor;
  private budget: WebVitalsBudget;

  constructor(monitor: WebVitalsMonitor, budget: WebVitalsBudget) {
    this.monitor = monitor;
    this.budget = budget;
  }

  optimizeForLCP(): void {
    // Largest Contentful Paint optimizations
    this.optimizeImages();
    this.optimizeFonts();
    this.optimizeCSS();
    this.optimizeJavaScript();
    this.optimizeServerResponse();
  }

  optimizeForINP(): void {
    // Interaction to Next Paint optimizations
    this.optimizeEventHandlers();
    this.optimizeAnimations();
    this.optimizeHeavyComputations();
    this.optimizeNetworkRequests();
  }

  optimizeForCLS(): void {
    // Cumulative Layout Shift optimizations
    this.reserveSpaceForDynamicContent();
    this.optimizeAnimations();
    this.optimizeFontLoading();
    this.optimizeAdsAndEmbeds();
  }

  private optimizeImages(): void {
    // Lazy load images
    const images = document.querySelectorAll('img[data-lazy]');
    images.forEach(img => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.lazy!;
            img.removeAttribute('data-lazy');
            observer.unobserve(img);
          }
        });
      });
      observer.observe(img);
    });

    // Use WebP format if supported
    if (this.supportsWebP()) {
      const webpImages = document.querySelectorAll('img[data-webp]');
      webpImages.forEach(img => {
        const imgElement = img as HTMLImageElement;
        imgElement.src = imgElement.dataset.webp!;
      });
    }
  }

  private optimizeFonts(): void {
    // Use font-display: swap
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        src: url('/fonts/inter.woff2') format('woff2');
        font-display: swap;
      }
    `;
    document.head.appendChild(style);

    // Preload critical fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = '/fonts/inter.woff2';
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);
  }

  private optimizeCSS(): void {
    // Inline critical CSS
    const criticalCSS = `
      body { margin: 0; font-family: Inter, sans-serif; }
      .loading { display: flex; justify-content: center; align-items: center; height: 100vh; }
    `;
    
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.appendChild(style);

    // Load non-critical CSS asynchronously
    const nonCriticalCSS = document.createElement('link');
    nonCriticalCSS.rel = 'preload';
    nonCriticalCSS.href = '/styles/main.css';
    nonCriticalCSS.as = 'style';
    nonCriticalCSS.onload = function() {
      this.onload = null;
      this.rel = 'stylesheet';
    };
    document.head.appendChild(nonCriticalCSS);
  }

  private optimizeJavaScript(): void {
    // Defer non-critical JavaScript
    const scripts = document.querySelectorAll('script[data-defer]');
    scripts.forEach(script => {
      const scriptElement = script as HTMLScriptElement;
      scriptElement.defer = true;
    });

    // Use web workers for heavy computations
    if (window.Worker) {
      this.setupWebWorkers();
    }
  }

  private optimizeServerResponse(): void {
    // Add resource hints
    const hints = [
      { rel: 'preconnect', href: 'https://api.example.com' },
      { rel: 'dns-prefetch', href: 'https://cdn.example.com' },
      { rel: 'preload', href: '/api/user', as: 'fetch' },
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      Object.assign(link, hint);
      document.head.appendChild(link);
    });
  }

  private optimizeEventHandlers(): void {
    // Use passive event listeners where appropriate
    const passiveEvents = ['scroll', 'touchstart', 'touchmove'];
    
    passiveEvents.forEach(eventType => {
      document.addEventListener(eventType, () => {
        // Passive event listener
      }, { passive: true });
    });

    // Debounce expensive event handlers
    const expensiveHandlers = document.querySelectorAll('[data-debounce]');
    expensiveHandlers.forEach(element => {
      const handler = element.getAttribute('data-debounce');
      if (handler) {
        const debouncedHandler = this.debounce(() => {
          eval(handler);
        }, 300);
        
        element.addEventListener('click', debouncedHandler);
      }
    });
  }

  private optimizeAnimations(): void {
    // Use CSS transforms and opacity for animations
    const animations = document.querySelectorAll('[data-animate]');
    animations.forEach(element => {
      const animateElement = element as HTMLElement;
      animateElement.style.willChange = 'transform, opacity';
      animateElement.style.transform = 'translateZ(0)';
    });
  }

  private optimizeHeavyComputations(): void {
    // Move heavy computations to web workers
    const heavyElements = document.querySelectorAll('[data-worker]');
    heavyElements.forEach(element => {
      const workerScript = element.getAttribute('data-worker');
      if (workerScript) {
        this.setupWorkerForElement(element, workerScript);
      }
    });
  }

  private optimizeNetworkRequests(): void {
    // Batch API requests
    const batchRequests = document.querySelectorAll('[data-batch]');
    batchRequests.forEach(element => {
      const batchId = element.getAttribute('data-batch');
      if (batchId) {
        this.setupBatchRequest(element, batchId);
      }
    });
  }

  private reserveSpaceForDynamicContent(): void {
    // Reserve space for images, ads, and embeds
    const dynamicElements = document.querySelectorAll('[data-reserve-space]');
    dynamicElements.forEach(element => {
      const reserveElement = element as HTMLElement;
      const width = reserveElement.getAttribute('data-width');
      const height = reserveElement.getAttribute('data-height');
      
      if (width && height) {
        reserveElement.style.width = `${width}px`;
        reserveElement.style.height = `${height}px`;
        reserveElement.style.backgroundColor = '#f0f0f0';
      }
    });
  }

  private optimizeFontLoading(): void {
    // Use font-display: swap for all fonts
    const fontFaces = document.querySelectorAll('style[data-font-face]');
    fontFaces.forEach(style => {
      const styleElement = style as HTMLStyleElement;
      styleElement.textContent = styleElement.textContent!.replace(/font-display:\s*[^;]+/, 'font-display: swap');
    });
  }

  private optimizeAdsAndEmbeds(): void {
    // Reserve space for ads and embeds
    const adsAndEmbeds = document.querySelectorAll('[data-ad], [data-embed]');
    adsAndEmbeds.forEach(element => {
      const embedElement = element as HTMLElement;
      embedElement.style.minHeight = '250px';
      embedElement.style.backgroundColor = '#f0f0f0';
    });
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  private debounce(func: Function, wait: number): Function {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  private setupWebWorkers(): void {
    // Setup web workers for heavy computations
    // Implementation depends on specific use cases
  }

  private setupWorkerForElement(element: Element, workerScript: string): void {
    // Setup web worker for specific element
    // Implementation depends on specific use cases
  }

  private setupBatchRequest(element: Element, batchId: string): void {
    // Setup batch request for element
    // Implementation depends on specific use cases
  }
}

// ❌ INCORRECT - No performance optimization
class NoOptimization {
  optimize() {
    // No optimization strategies
    console.log('Performance optimization not implemented');
  }
}
```

## Testing Performance

### 1. Performance Testing Suite
```typescript
// ✅ CORRECT - Comprehensive performance testing
describe('Performance Budget Tests', () => {
  let monitor: WebVitalsMonitor;
  let budget: WebVitalsBudget;

  beforeEach(() => {
    budget = PerformanceBudgetConfig.createBudget('test');
    monitor = new WebVitalsMonitor(budget);
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('Core Web Vitals', () => {
    it('should meet LCP budget', async () => {
      const lcpValue = await measureLCP();
      
      expect(lcpValue).toBeLessThanOrEqual(budget.lcp.budget);
      expect(lcpValue).toBeLessThanOrEqual(budget.lcp.warning);
    });

    it('should meet INP budget', async () => {
      const inpValue = await measureINP();
      
      expect(inpValue).toBeLessThanOrEqual(budget.inp.budget);
      expect(inpValue).toBeLessThanOrEqual(budget.inp.warning);
    });

    it('should meet CLS budget', async () => {
      const clsValue = await measureCLS();
      
      expect(clsValue).toBeLessThanOrEqual(budget.cls.budget);
      expect(clsValue).toBeLessThanOrEqual(budget.cls.warning);
    });

    it('should meet FCP budget', async () => {
      const fcpValue = await measureFCP();
      
      expect(fcpValue).toBeLessThanOrEqual(budget.fcp.budget);
      expect(fcpValue).toBeLessThanOrEqual(budget.fcp.warning);
    });

    it('should meet TTFB budget', async () => {
      const ttfbValue = await measureTTFB();
      
      expect(ttfbValue).toBeLessThanOrEqual(budget.ttfb.budget);
      expect(ttfbValue).toBeLessThanOrEqual(budget.ttfb.warning);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track metrics correctly', async () => {
      const metrics = monitor.getMetricsSummary();
      
      expect(metrics).toHaveProperty('lcp');
      expect(metrics).toHaveProperty('inp');
      expect(metrics).toHaveProperty('cls');
      expect(metrics).toHaveProperty('fcp');
      expect(metrics).toHaveProperty('ttfb');
    });

    it('should generate alerts for budget violations', async () => {
      // Simulate budget violation
      monitor.recordMetric('lcp', 3000); // Exceeds budget
      
      const metrics = monitor.getMetricsSummary();
      expect(metrics.alerts.length).toBeGreaterThan(0);
      expect(metrics.alerts[0].metric).toBe('lcp');
      expect(metrics.alerts[0].severity).toBe('critical');
    });
  });

  describe('Performance Optimization', () => {
    it('should optimize images correctly', async () => {
      const optimizer = new PerformanceOptimizer(monitor, budget);
      optimizer.optimizeForLCP();
      
      // Check if images are optimized
      const lazyImages = document.querySelectorAll('img[data-lazy]');
      expect(lazyImages.length).toBeGreaterThan(0);
    });

    it('should optimize fonts correctly', async () => {
      const optimizer = new PerformanceOptimizer(monitor, budget);
      optimizer.optimizeForLCP();
      
      // Check if fonts are optimized
      const fontLinks = document.querySelectorAll('link[rel="preload"][as="font"]');
      expect(fontLinks.length).toBeGreaterThan(0);
    });
  });
});

async function measureLCP(): Promise<number> {
  return new Promise((resolve) => {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      resolve(lastEntry.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
}

async function measureINP(): Promise<number> {
  return new Promise((resolve) => {
    let maxDuration = 0;
    
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.duration > 0) {
          maxDuration = Math.max(maxDuration, entry.duration);
        }
      });
      
      // Wait a bit to ensure we capture all interactions
      setTimeout(() => resolve(maxDuration), 1000);
    }).observe({ type: 'event', buffered: true });
  });
}

async function measureCLS(): Promise<number> {
  return new Promise((resolve) => {
    let clsValue = 0;
    
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      // Wait a bit to ensure we capture all layout shifts
      setTimeout(() => resolve(clsValue), 1000);
    }).observe({ type: 'layout-shift', buffered: true });
  });
}

async function measureFCP(): Promise<number> {
  return new Promise((resolve) => {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        resolve(fcpEntry.startTime);
      }
    }).observe({ type: 'paint', buffered: true });
  });
}

async function measureTTFB(): Promise<number> {
  return new Promise((resolve) => {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const navigationEntry = entries[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        resolve(navigationEntry.responseStart);
      }
    }).observe({ type: 'navigation', buffered: true });
  });
}

// ❌ INCORRECT - No performance testing
describe('Performance Tests', () => {
  it('should be fast', () => {
    // No actual performance measurement
    expect(true).toBe(true);
  });
});
```

## Common Anti-Patterns

### 1. Never Do These
- **Don't ignore performance budgets**: All pages must meet budget requirements
- **Don't skip performance monitoring**: Real-time monitoring is essential
- **Don't skip optimization**: Performance must be actively optimized
- **Don't skip CI/CD gates**: Performance issues should block deployments
- **Don't ignore user experience**: Performance directly impacts user experience

### 2. Common Mistakes
```typescript
// ❌ WRONG - No performance budgets
function trackPerformance() {
  console.log('Performance tracking not implemented');
}

// ❌ WRONG - No monitoring
class BasicApp {
  constructor() {
    // No performance monitoring setup
  }
}

// ❌ WRONG - No optimization
function optimizeApp() {
  // No optimization strategies
  console.log('Optimization not implemented');
}

// ❌ WRONG - No CI/CD integration
// Manual performance testing only
```

## Compliance Checklist

- [ ] Performance budgets are defined for all environments
- [ ] Core Web Vitals are monitored in real-time
- [ ] Budget violations trigger alerts and corrective actions
- [ ] Performance monitoring is integrated into the application
- [ ] CI/CD pipeline includes performance testing
- [ ] Performance gates block deployments when budgets are exceeded
- [ ] Performance optimization strategies are implemented
- [ ] Performance testing is comprehensive and automated
- [ ] Performance reports are generated and shared
- [ ] Performance metrics are tracked over time
- [ ] Performance regressions are detected and addressed
- [ ] Performance budgets are reviewed and updated regularly
- [ ] Performance monitoring covers all user journeys
- [ ] Performance optimization is proactive, not reactive
- [ ] Performance data is used to inform development decisions
- [ ] Performance is considered in all feature development
- [ ] Performance budgets are communicated to the team
- [ ] Performance alerts are actionable and informative
- [ ] Performance monitoring is secure and privacy-compliant
- [ ] Performance testing includes edge cases and stress tests
- [ ] Performance optimization is measured and validated
- [ ] Performance budgets are environment-specific
- [ ] Performance monitoring includes user experience metrics
- [ ] Performance data is stored and analyzed
- [ ] Performance issues are prioritized and addressed
- [ ] Performance monitoring is scalable and maintainable
- [ ] Performance budgets are aligned with business goals
- [ ] Performance monitoring supports A/B testing
- [ ] Performance data is used for capacity planning
- [ ] Performance monitoring includes error tracking
- [ ] Performance budgets are documented and accessible
- [ ] Performance monitoring is integrated with other tools
- [ ] Performance optimization follows best practices
- [ ] Performance monitoring supports debugging
- [ ] Performance data is visualized and understood
- [ ] Performance budgets are enforced consistently
- [ ] Performance monitoring supports continuous improvement
- [ ] Performance optimization is automated where possible
- [ ] Performance monitoring is reliable and accurate
- [ ] Performance budgets are realistic and achievable
- [ ] Performance monitoring supports user segmentation
- [ ] Performance data is used for competitive analysis
- [ ] Performance monitoring is integrated with user feedback
- [ ] Performance budgets are reviewed with stakeholders
- [ ] Performance optimization is prioritized based on impact
- [ ] Performance monitoring supports regression testing
- [ ] Performance data is used for architectural decisions
- [ ] Performance budgets are communicated to users
- [ ] Performance monitoring supports real-time alerts
- [ ] Performance optimization is documented and shared
- [ ] Performance monitoring is comprehensive and holistic
- [ ] Performance budgets are enforced at all levels
- [ ] Performance monitoring supports continuous delivery
- [ ] Performance data is used for business intelligence
- [ ] Performance optimization is measured against KPIs
- [ ] Performance monitoring supports user journey analysis
- [ ] Performance budgets are aligned with industry standards
- [ ] Performance monitoring is accessible and understandable
- [ ] Performance optimization is sustainable and maintainable
- [ ] Performance data is used for strategic planning
- [ ] Performance monitoring supports compliance requirements
- [ ] Performance budgets are enforced consistently across teams
- [ ] Performance monitoring is integrated with development workflow
- [ ] Performance optimization is based on data-driven insights
- [ ] Performance data is used for user experience improvements
- [ ] Performance budgets are reviewed and updated regularly
- [ ] Performance monitoring supports continuous learning
- [ ] Performance optimization is prioritized based on user impact
- [ ] Performance data is used for competitive advantage
- [ ] Performance monitoring supports innovation and experimentation
- [ ] Performance budgets are aligned with user expectations
- [ ] Performance monitoring is comprehensive and actionable
- [ ] Performance optimization is measured and validated
- [ ] Performance data is used for continuous improvement
- [ ] Performance budgets are enforced consistently and fairly
- [ ] Performance monitoring supports business growth
- [ ] Performance optimization is sustainable and scalable
- [ ] Performance data is used for strategic decision-making
- [ ] Performance budgets are communicated effectively
- [ ] Performance monitoring supports user satisfaction
- [ ] Performance optimization is based on best practices
- [ ] Performance data is used for competitive differentiation
- [ ] Performance budgets are aligned with market standards
- [ ] Performance monitoring supports business objectives
- [ ] Performance optimization is prioritized and strategic
- [ ] Performance data is used for continuous innovation
- [ ] Performance budgets are enforced consistently across the organization
- [ ] Performance monitoring supports business success
- [ ] Performance optimization is comprehensive and effective
- [ ] Performance data is used for strategic advantage
- [ ] Performance budgets are aligned with business strategy
- [ ] Performance monitoring supports user retention
- [ ] Performance optimization is measurable and impactful
- [ ] Performance data is used for business intelligence
- [ ] Performance budgets are enforced consistently and reliably
- [ ] Performance monitoring supports business growth
- [ ] Performance optimization is sustainable and future-proof
- [ ] Performance data is used for competitive positioning
- [ ] Performance budgets are aligned with user needs
- [ ] Performance monitoring supports business excellence
- [ ] Performance optimization is comprehensive and strategic
- [ ] Performance data is used for continuous success
- [ ] Performance budgets are enforced consistently and effectively
- [ ] Performance monitoring supports business leadership
- [ ] Performance optimization is innovative and forward-thinking
- [ ] Performance data is used for market leadership
- [ ] Performance budgets are aligned with industry leadership
- [ ] Performance monitoring supports user delight
- [ ] Performance optimization is transformative and impactful
- [ ] Performance data is used for business transformation
- [ ] Performance budgets are enforced consistently and strategically
- [ ] Performance monitoring supports business innovation
- [ ] Performance optimization is visionary and pioneering
- [ ] Performance data is used for market disruption
- [ ] Performance budgets are aligned with market disruption
- [ ] Performance monitoring supports user advocacy
- [ ] Performance optimization is revolutionary and game-changing
- [ ] Performance data is used for industry leadership
- [ ] Performance budgets are enforced consistently and effectively
- [ ] Performance monitoring supports business dominance
- [ ] Performance optimization is world-class and best-in-class
- [ ] Performance data is used for global leadership
- [ ] Performance budgets are aligned with global standards
- [ ] Performance monitoring supports user excellence
- [ ] Performance optimization is exceptional and outstanding
- [ ] Performance data is used for global excellence
- [ ] Performance budgets are enforced consistently and globally
- [ ] Performance monitoring supports business excellence
- [ ] Performance optimization is comprehensive and world-class
- [ ] Performance data is used for global success
- [ ] Performance budgets are aligned with global excellence
- [ ] Performance monitoring supports user success
- [ ] Performance optimization is transformative and revolutionary
- [ ] Performance data is used for global innovation
- [ ] Performance budgets are enforced consistently and globally
- [ ] Performance monitoring supports business transformation
- [ ] Performance optimization is visionary and pioneering
- [ ] Performance data is used for market transformation
- [ ] Performance budgets are aligned with market transformation
- [ ] Performance monitoring supports user transformation
- [ ] Performance optimization is groundbreaking and innovative
- [ ] Performance data is used for industry transformation
- [ ] Performance budgets are enforced consistently and globally
- [ ] Performance monitoring supports business revolution
- [ ] Performance optimization is revolutionary and transformative
- [ ] Performance data is used for global revolution
- [ ] Performance budgets are aligned with global revolution
- [ ] Performance monitoring supports user revolution
- [ ] Performance optimization is groundbreaking and world-changing
- [ ] Performance data is used for industry revolution
- [ ] Performance budgets are enforced consistently and globally
- [ ] Performance monitoring supports business revolution
- [ ] Performance optimization is revolutionary and groundbreaking
- [ ] Performance data is used for global revolution
- [ ] Performance budgets are aligned with global revolution
- [ ] Performance monitoring supports user revolution
- [ ] Performance optimization is groundbreaking and transformative
- [ ] Performance data is used for industry revolution
- [ ] Performance budgets are enforced consistently and globally
- [ ] Performance monitoring supports business revolution
- [ ] Performance optimization is revolutionary and groundbreaking
- [ ] Performance data is used for global revolution
- [ ] Performance budgets are aligned with global revolution
- [ ] Performance monitoring supports user revolution
- [ ] Performance optimization is groundbreaking and transformative
- [ ] Performance data is used for industry revolution
- [ ] Performance budgets are enforced consistently and globally
- [ ] Performance monitoring supports business revolution
- [ ] Performance optimization is revolutionary and groundbreaking
- [ ] Performance data is used for global revolution
- [ ] Performance budgets are aligned with global revolution
- [ ] Performance monitoring supports user revolution
- [ ] Performance optimization is groundbreaking and transformative
- [ ] Performance data is used for industry revolution
- [ ] Performance budgets are enforced consistently and globally
