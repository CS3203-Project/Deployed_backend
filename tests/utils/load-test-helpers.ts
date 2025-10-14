/**
 * Load testing helper utilities
 */

import { PerformanceMonitor } from './performance-monitor';

export interface LoadTestConfig {
  baseURL: string;
  duration: number; // in seconds
  rampUpTime: number; // in seconds
  targetRPS: number; // requests per second
  endpoints: EndpointConfig[];
}

export interface EndpointConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  weight: number; // 0-100, percentage of total requests
  headers?: Record<string, string>;
  body?: any;
}

export class LoadTestRunner {
  private monitor: PerformanceMonitor;
  private isRunning: boolean = false;
  private requestCount: number = 0;

  constructor() {
    this.monitor = new PerformanceMonitor();
  }

  /**
   * Run load test
   */
  async run(config: LoadTestConfig): Promise<void> {
    console.log(`Starting load test for ${config.duration}s at ${config.targetRPS} req/s`);
    
    this.monitor.start();
    this.isRunning = true;
    this.requestCount = 0;

    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);

    // Ramp up
    const rampUpEndTime = startTime + (config.rampUpTime * 1000);
    
    while (Date.now() < endTime && this.isRunning) {
      const currentTime = Date.now();
      
      // Calculate current RPS based on ramp-up
      let currentRPS = config.targetRPS;
      if (currentTime < rampUpEndTime) {
        const rampUpProgress = (currentTime - startTime) / (config.rampUpTime * 1000);
        currentRPS = Math.floor(config.targetRPS * rampUpProgress);
      }

      // Calculate delay between requests
      const delay = currentRPS > 0 ? 1000 / currentRPS : 1000;

      // Send request
      await this.sendRequest(config);
      
      // Wait before next request
      await this.sleep(delay);
    }

    this.isRunning = false;
    console.log(`Load test completed. Total requests: ${this.requestCount}`);
    this.monitor.printStats();
  }

  /**
   * Stop load test
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Get performance monitor
   */
  getMonitor(): PerformanceMonitor {
    return this.monitor;
  }

  /**
   * Send a single request
   */
  private async sendRequest(config: LoadTestConfig): Promise<void> {
    // Select endpoint based on weight
    const endpoint = this.selectEndpoint(config.endpoints);
    if (!endpoint) return;

    const url = `${config.baseURL}${endpoint.path}`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...endpoint.headers,
        },
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
      });

      const responseTime = Date.now() - startTime;
      this.requestCount++;

      this.monitor.record({
        endpoint: endpoint.path,
        method: endpoint.method,
        statusCode: response.status,
        responseTime,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.requestCount++;

      this.monitor.record({
        endpoint: endpoint.path,
        method: endpoint.method,
        statusCode: 0, // Network error
        responseTime,
      });
    }
  }

  /**
   * Select endpoint based on weights
   */
  private selectEndpoint(endpoints: EndpointConfig[]): EndpointConfig | null {
    if (endpoints.length === 0) return null;

    const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;

    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }

    return endpoints[0] ?? null;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a simple load test configuration
 */
export function createLoadTestConfig(
  baseURL: string,
  endpoints: string[],
  targetRPS: number = 10,
  duration: number = 60
): LoadTestConfig {
  const weight = 100 / endpoints.length;
  
  return {
    baseURL,
    duration,
    rampUpTime: Math.min(30, duration / 4),
    targetRPS,
    endpoints: endpoints.map(path => ({
      path,
      method: 'GET',
      weight,
    })),
  };
}

/**
 * Assert performance requirements
 */
export function assertPerformance(
  monitor: PerformanceMonitor,
  requirements: {
    maxErrorRate?: number;
    maxP95ResponseTime?: number;
    maxP99ResponseTime?: number;
    minRequestsPerSecond?: number;
  }
): void {
  const stats = monitor.getStats();

  if (requirements.maxErrorRate !== undefined) {
    if (stats.errorRate > requirements.maxErrorRate) {
      throw new Error(
        `Error rate ${(stats.errorRate * 100).toFixed(2)}% exceeds maximum ${(requirements.maxErrorRate * 100).toFixed(2)}%`
      );
    }
  }

  if (requirements.maxP95ResponseTime !== undefined) {
    if (stats.p95ResponseTime > requirements.maxP95ResponseTime) {
      throw new Error(
        `P95 response time ${stats.p95ResponseTime.toFixed(2)}ms exceeds maximum ${requirements.maxP95ResponseTime}ms`
      );
    }
  }

  if (requirements.maxP99ResponseTime !== undefined) {
    if (stats.p99ResponseTime > requirements.maxP99ResponseTime) {
      throw new Error(
        `P99 response time ${stats.p99ResponseTime.toFixed(2)}ms exceeds maximum ${requirements.maxP99ResponseTime}ms`
      );
    }
  }

  if (requirements.minRequestsPerSecond !== undefined) {
    if (stats.requestsPerSecond < requirements.minRequestsPerSecond) {
      throw new Error(
        `Requests per second ${stats.requestsPerSecond.toFixed(2)} is below minimum ${requirements.minRequestsPerSecond}`
      );
    }
  }

  console.log('✓ All performance requirements met');
}
