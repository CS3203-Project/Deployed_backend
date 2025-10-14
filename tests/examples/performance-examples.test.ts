/// <reference types="jest" />
/**
 * Example: Using performance monitoring in tests
 * This demonstrates how to use the performance utilities
 */

import { performanceMonitor } from '../utils/performance-monitor';
import { createLoadTestConfig, LoadTestRunner, assertPerformance } from '../utils/load-test-helpers';

describe('Performance Monitoring Examples', () => {
  beforeEach(() => {
    performanceMonitor.reset();
  });

  it('should track and report performance metrics', () => {
    performanceMonitor.start();

    // Simulate some API calls
    performanceMonitor.record({
      endpoint: '/api/category',
      method: 'GET',
      statusCode: 200,
      responseTime: 123,
    });

    performanceMonitor.record({
      endpoint: '/api/services',
      method: 'GET',
      statusCode: 200,
      responseTime: 234,
    });

    performanceMonitor.record({
      endpoint: '/api/providers',
      method: 'GET',
      statusCode: 200,
      responseTime: 156,
    });

    // Get statistics
    const stats = performanceMonitor.getStats();

    expect(stats.totalRequests).toBe(3);
    expect(stats.successfulRequests).toBe(3);
    expect(stats.failedRequests).toBe(0);
    expect(stats.errorRate).toBe(0);
    expect(stats.averageResponseTime).toBeGreaterThan(0);

    // Print stats (useful for debugging)
    performanceMonitor.printStats();
  });

  it('should calculate percentiles correctly', () => {
    performanceMonitor.start();

    // Add more measurements to ensure proper percentile distribution
    const responseTimes = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    
    responseTimes.forEach((time) => {
      performanceMonitor.record({
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: time,
      });
    });

    const stats = performanceMonitor.getStats();

    expect(stats.minResponseTime).toBe(10);
    expect(stats.maxResponseTime).toBe(1000);
    expect(stats.p50ResponseTime).toBeLessThan(stats.p95ResponseTime);
    expect(stats.p95ResponseTime).toBeLessThanOrEqual(stats.p99ResponseTime);
  });

  it('should track errors correctly', () => {
    performanceMonitor.start();

    // Successful request
    performanceMonitor.record({
      endpoint: '/api/test',
      method: 'GET',
      statusCode: 200,
      responseTime: 100,
    });

    // Failed requests
    performanceMonitor.record({
      endpoint: '/api/test',
      method: 'GET',
      statusCode: 404,
      responseTime: 50,
    });

    performanceMonitor.record({
      endpoint: '/api/test',
      method: 'POST',
      statusCode: 500,
      responseTime: 75,
    });

    const stats = performanceMonitor.getStats();

    expect(stats.totalRequests).toBe(3);
    expect(stats.successfulRequests).toBe(1);
    expect(stats.failedRequests).toBe(2);
    expect(stats.errorRate).toBeCloseTo(2/3, 2);
  });

  it('should identify slow requests', () => {
    performanceMonitor.start();

    performanceMonitor.record({
      endpoint: '/api/fast',
      method: 'GET',
      statusCode: 200,
      responseTime: 50,
    });

    performanceMonitor.record({
      endpoint: '/api/slow',
      method: 'GET',
      statusCode: 200,
      responseTime: 1500, // Slow!
    });

    performanceMonitor.record({
      endpoint: '/api/very-slow',
      method: 'GET',
      statusCode: 200,
      responseTime: 2000, // Very slow!
    });

    // Get requests slower than 1000ms
    const slowRequests = performanceMonitor.getSlowRequests(1000);

    expect(slowRequests).toHaveLength(2);
    expect(slowRequests[0]).toBeDefined();
    expect(slowRequests[0]?.endpoint).toBe('/api/slow');
    expect(slowRequests[1]).toBeDefined();
    expect(slowRequests[1]?.endpoint).toBe('/api/very-slow');
  });

  it('should export metrics to JSON', () => {
    performanceMonitor.start();

    performanceMonitor.record({
      endpoint: '/api/test',
      method: 'GET',
      statusCode: 200,
      responseTime: 123,
    });

    const json = performanceMonitor.exportToJSON();
    const data = JSON.parse(json);

    expect(data).toHaveProperty('stats');
    expect(data).toHaveProperty('metrics');
    expect(data.stats.totalRequests).toBe(1);
    expect(data.metrics).toHaveLength(1);
  });
});

describe('Load Test Helper Examples', () => {
  it('should create load test configuration', () => {
    const config = createLoadTestConfig(
      'http://localhost:5000',
      ['/api/category', '/api/services', '/api/providers'],
      10,  // 10 RPS
      60   // 60 seconds
    );

    expect(config.baseURL).toBe('http://localhost:5000');
    expect(config.targetRPS).toBe(10);
    expect(config.duration).toBe(60);
    expect(config.endpoints).toHaveLength(3);
    expect(config.rampUpTime).toBe(15); // 60/4 = 15
  });

  it('should validate performance requirements', () => {
    performanceMonitor.start();

    // Add good metrics
    for (let i = 0; i < 100; i++) {
      performanceMonitor.record({
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 100 + Math.random() * 100, // 100-200ms
      });
    }

    // This should pass
    expect(() => {
      assertPerformance(performanceMonitor, {
        maxErrorRate: 0.01,
        maxP95ResponseTime: 500,
      });
    }).not.toThrow();
  });

  it('should fail when requirements not met', () => {
    performanceMonitor.start();

    // Add bad metrics (slow responses)
    for (let i = 0; i < 10; i++) {
      performanceMonitor.record({
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 1000 + Math.random() * 500, // 1000-1500ms
      });
    }

    // This should fail
    expect(() => {
      assertPerformance(performanceMonitor, {
        maxP95ResponseTime: 500, // Requirement: P95 < 500ms
      });
    }).toThrow(/P95 response time.*exceeds maximum/);
  });
});
