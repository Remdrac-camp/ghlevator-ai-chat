export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface WebVitals {
  CLS: number; // Cumulative Layout Shift
  FID: number; // First Input Delay
  LCP: number; // Largest Contentful Paint
  FCP: number; // First Contentful Paint
  TTFB: number; // Time to First Byte
}

export interface ErrorTracking {
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  path?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
}

export interface AlertThresholds {
  errorRate: number; // Pourcentage d'erreurs acceptables
  responseTime: number; // Temps de réponse maximum en ms
  memoryUsage: number; // Utilisation maximale de la mémoire en MB
} 