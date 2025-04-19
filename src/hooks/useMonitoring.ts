import { useEffect, useCallback } from 'react';
import { monitoringService } from '@/lib/monitoring';
import { PerformanceMetrics, ErrorTracking } from '@/types/monitoring';

export const useMonitoring = (componentName: string) => {
  const trackError = useCallback((error: Error, metadata?: Record<string, any>) => {
    monitoringService.trackError({
      message: error.message,
      stack: error.stack,
      component: componentName,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }, [componentName]);

  const trackPerformance = useCallback((metrics: Partial<PerformanceMetrics>) => {
    monitoringService.trackPerformance(metrics);
  }, []);

  useEffect(() => {
    // Mesure du temps de rendu du composant
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      trackPerformance({
        renderTime: endTime - startTime,
      });
    };
  }, [trackPerformance]);

  return {
    trackError,
    trackPerformance,
  };
}; 