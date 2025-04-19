import { WebVitals, PerformanceMetrics, ErrorTracking, AlertThresholds } from '@/types/monitoring';
import { logger } from './logger';

class MonitoringService {
  private static instance: MonitoringService;
  private vitals: WebVitals = {
    CLS: 0,
    FID: 0,
    LCP: 0,
    FCP: 0,
    TTFB: 0,
  };
  private metrics: PerformanceMetrics = {
    pageLoadTime: 0,
    apiResponseTime: 0,
    renderTime: 0,
    memoryUsage: 0,
  };
  private errorCount = 0;
  private requestCount = 0;
  private thresholds: AlertThresholds = {
    errorRate: 5, // 5% d'erreurs maximum
    responseTime: 2000, // 2 secondes maximum
    memoryUsage: 500, // 500MB maximum
  };

  private constructor() {
    this.initializePerformanceMonitoring();
    this.initializeErrorTracking();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initializePerformanceMonitoring(): void {
    if (typeof window !== 'undefined') {
      // Mesure des Core Web Vitals
      const measureWebVitals = () => {
        // CLS (Cumulative Layout Shift)
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.name === 'layout-shift') {
              this.vitals.CLS = (entry as any).value;
              this.checkThresholds();
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });

        // FID (First Input Delay)
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.entryType === 'first-input') {
              this.vitals.FID = entry.processingStart - entry.startTime;
              this.checkThresholds();
            }
          }
        }).observe({ entryTypes: ['first-input'] });

        // LCP (Largest Contentful Paint)
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              this.vitals.LCP = entry.startTime;
              this.checkThresholds();
            }
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      };

      measureWebVitals();
    }
  }

  private initializeErrorTracking(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError({
          message: event.message,
          stack: event.error?.stack,
          path: window.location.pathname,
          timestamp: new Date().toISOString(),
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackError({
          message: event.reason?.message || 'Unhandled promise rejection',
          stack: event.reason?.stack,
          path: window.location.pathname,
          timestamp: new Date().toISOString(),
        });
      });
    }
  }

  public trackError(error: ErrorTracking): void {
    this.errorCount++;
    this.requestCount++;
    
    logger.error('Erreur utilisateur', new Error(error.message), {
      component: error.component,
      path: error.path,
      userId: error.userId,
      metadata: error.metadata,
    });

    this.checkThresholds();
  }

  public trackPerformance(metrics: Partial<PerformanceMetrics>): void {
    this.metrics = { ...this.metrics, ...metrics };
    this.checkThresholds();
  }

  private checkThresholds(): void {
    const errorRate = (this.errorCount / this.requestCount) * 100;
    
    if (errorRate > this.thresholds.errorRate) {
      this.triggerAlert('errorRate', `Taux d'erreur élevé: ${errorRate.toFixed(2)}%`);
    }

    if (this.metrics.apiResponseTime > this.thresholds.responseTime) {
      this.triggerAlert('responseTime', `Temps de réponse élevé: ${this.metrics.apiResponseTime}ms`);
    }

    if (this.metrics.memoryUsage > this.thresholds.memoryUsage) {
      this.triggerAlert('memoryUsage', `Utilisation mémoire élevée: ${this.metrics.memoryUsage}MB`);
    }
  }

  private triggerAlert(type: keyof AlertThresholds, message: string): void {
    logger.warn(`Alerte de performance: ${message}`, {
      alertType: type,
      currentValue: this.getCurrentValue(type),
      threshold: this.thresholds[type],
    });
  }

  private getCurrentValue(type: keyof AlertThresholds): number {
    switch (type) {
      case 'errorRate':
        return (this.errorCount / this.requestCount) * 100;
      case 'responseTime':
        return this.metrics.apiResponseTime;
      case 'memoryUsage':
        return this.metrics.memoryUsage;
      default:
        return 0;
    }
  }

  public getMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  public getVitals(): WebVitals {
    return this.vitals;
  }

  public setThresholds(thresholds: Partial<AlertThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
}

export const monitoringService = MonitoringService.getInstance(); 