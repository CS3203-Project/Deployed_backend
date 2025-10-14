/**
 * Performance monitoring utility for API tests
 */

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
}

export interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private startTime: number = 0;

  constructor() {
    this.reset();
  }

  /**
   * Start monitoring
   */
  start(): void {
    this.reset();
    this.startTime = Date.now();
  }

  /**
   * Record a metric
   */
  record(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now(),
    });
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return this.getEmptyStats();
    }

    const responseTimes = this.metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const successfulRequests = this.metrics.filter(m => m.statusCode >= 200 && m.statusCode < 300).length;
    const totalRequests = this.metrics.length;
    const duration = (Date.now() - this.startTime) / 1000; // in seconds

    return {
      totalRequests,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      averageResponseTime: this.calculateAverage(responseTimes),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p50ResponseTime: this.calculatePercentile(responseTimes, 50),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      requestsPerSecond: duration > 0 ? totalRequests / duration : 0,
      errorRate: totalRequests > 0 ? (totalRequests - successfulRequests) / totalRequests : 0,
    };
  }

  /**
   * Get metrics by endpoint
   */
  getMetricsByEndpoint(endpoint: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.endpoint === endpoint);
  }

  /**
   * Get metrics by status code range
   */
  getMetricsByStatusCode(minStatus: number, maxStatus: number): PerformanceMetric[] {
    return this.metrics.filter(m => m.statusCode >= minStatus && m.statusCode <= maxStatus);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = [];
    this.startTime = Date.now();
  }

  /**
   * Print statistics to console
   */
  printStats(): void {
    const stats = this.getStats();
    console.log('\n=== Performance Statistics ===');
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Successful: ${stats.successfulRequests} | Failed: ${stats.failedRequests}`);
    console.log(`Error Rate: ${(stats.errorRate * 100).toFixed(2)}%`);
    console.log(`\nResponse Times (ms):`);
    console.log(`  Average: ${stats.averageResponseTime.toFixed(2)}`);
    console.log(`  Min: ${stats.minResponseTime.toFixed(2)}`);
    console.log(`  Max: ${stats.maxResponseTime.toFixed(2)}`);
    console.log(`  P50: ${stats.p50ResponseTime.toFixed(2)}`);
    console.log(`  P95: ${stats.p95ResponseTime.toFixed(2)}`);
    console.log(`  P99: ${stats.p99ResponseTime.toFixed(2)}`);
    console.log(`\nThroughput: ${stats.requestsPerSecond.toFixed(2)} req/sec`);
    console.log('============================\n');
  }

  /**
   * Export metrics to JSON
   */
  exportToJSON(): string {
    return JSON.stringify({
      stats: this.getStats(),
      metrics: this.metrics,
    }, null, 2);
  }

  /**
   * Get slow requests (above threshold)
   */
  getSlowRequests(threshold: number = 1000): PerformanceMetric[] {
    return this.metrics.filter(m => m.responseTime > threshold);
  }

  /**
   * Calculate average
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(sortedNumbers: number[], percentile: number): number {
    if (sortedNumbers.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedNumbers.length) - 1;
    return sortedNumbers[Math.max(0, index)] ?? 0;
  }

  /**
   * Get empty stats object
   */
  private getEmptyStats(): PerformanceStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsPerSecond: 0,
      errorRate: 0,
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
