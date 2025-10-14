# Load Testing README

This directory contains load testing configurations for the backend API using multiple testing frameworks.

## Directory Structure

```
load-tests/
├── artillery/              # Artillery (YAML-based) load tests
│   ├── config.yml         # Base configuration
│   ├── api-load-test.yml  # Standard load test
│   ├── stress-test.yml    # Stress test
│   └── spike-test.yml     # Spike test
└── k6/                    # k6 (JavaScript-based) load tests
    ├── load-test.js       # Comprehensive load test
    ├── stress-test.js     # Stress test
    ├── spike-test.js      # Spike test
    └── soak-test.js       # Soak/endurance test
```

## Quick Start

### Artillery Tests

```bash
# Run standard load test
npm run load:artillery

# Run stress test
npm run load:artillery:stress

# Run spike test
npm run load:artillery:spike

# Generate HTML report
npm run load:artillery:report
```

### k6 Tests

```bash
# Run load test
npm run load:k6

# Run stress test
npm run load:k6:stress

# Run spike test
npm run load:k6:spike

# Run soak test (30 min)
npm run load:k6:soak
```

## Test Types

### Load Test
- **Purpose:** Verify system handles expected traffic
- **Duration:** ~5 minutes
- **Load:** 10-100 concurrent users
- **Use Case:** Regular performance validation

### Stress Test
- **Purpose:** Find system breaking point
- **Duration:** ~10 minutes
- **Load:** Gradually increases from 50 to 400+ users
- **Use Case:** Capacity planning

### Spike Test
- **Purpose:** Test response to sudden traffic surge
- **Duration:** ~3 minutes
- **Load:** Sudden jump from 10 to 500 users
- **Use Case:** Marketing campaigns, viral content

### Soak Test
- **Purpose:** Detect memory leaks and degradation
- **Duration:** 30+ minutes
- **Load:** Sustained 50 concurrent users
- **Use Case:** Production readiness

## Prerequisites

1. **API must be running:**
   ```bash
   npm run dev
   ```

2. **Database seeded (optional but recommended):**
   ```bash
   npm run seed
   ```

3. **k6 installed (for k6 tests):**
   - Download from [k6.io](https://k6.io/docs/get-started/installation/)
   - Or install via package manager:
     ```bash
     # Windows (Chocolatey)
     choco install k6
     
     # macOS
     brew install k6
     
     # Linux
     sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
     echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
     sudo apt-get update
     sudo apt-get install k6
     ```

## Customization

### Artillery

Edit YAML files to change:
- Target URL
- Test duration
- Arrival rate (users/second)
- Test scenarios

Example:
```yaml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60        # 60 seconds
      arrivalRate: 10     # 10 new users/second
```

### k6

Edit JavaScript files to change:
- Stages (load pattern)
- Thresholds (success criteria)
- Custom metrics
- Request logic

Example:
```javascript
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp to 20 users
    { duration: '1m', target: 50 },   // Ramp to 50 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],  // 95% under 500ms
  },
};
```

## Monitoring During Tests

### Watch server logs:
```bash
# In a separate terminal
npm run dev
```

### Monitor system resources:
```powershell
# Windows PowerShell
Get-Process -Name node | Format-Table -AutoSize

# Or use Task Manager / Resource Monitor
```

## Understanding Results

### Good Results ✓
- P95 response time < 500ms
- Error rate < 1%
- No timeouts or connection errors
- Stable memory usage

### Warning Signs ⚠
- P95 response time 500-1000ms
- Error rate 1-5%
- Some 429 (rate limit) responses
- Gradually increasing response times

### Critical Issues ✗
- P95 response time > 1000ms
- Error rate > 5%
- Connection timeouts
- Memory leaks (increasing over time)
- Database connection errors

## Common Issues

### Rate Limiting Triggered
```
Status 429: Too many requests
```
**Solution:** Reduce `arrivalRate` or increase rate limit in `index.ts`

### Connection Refused
```
Error: connect ECONNREFUSED
```
**Solution:** Ensure API server is running (`npm run dev`)

### Database Errors
```
Error: SQLITE_BUSY: database is locked
```
**Solution:** 
- Stop OneDrive sync
- Move project outside OneDrive
- Run tests with less concurrency

## Best Practices

1. **Start Small**
   - Begin with 5-10 concurrent users
   - Gradually increase load

2. **Test Incrementally**
   - Run load test first
   - Then stress test
   - Finally spike/soak tests

3. **Monitor Everything**
   - Watch server logs
   - Monitor CPU/memory
   - Check database connections

4. **Set Baselines**
   - Record results from successful tests
   - Compare against baselines regularly

5. **Test Realistic Scenarios**
   - Mix read/write operations
   - Include authentication
   - Simulate user behavior (think time)

## Further Reading

- [Artillery Documentation](https://www.artillery.io/docs)
- [k6 Documentation](https://k6.io/docs/)
- [Load Testing Best Practices](https://k6.io/docs/test-types/introduction/)
- Main Testing Guide: `../TESTING_GUIDE.md`

---

**Note:** Always test in a non-production environment first!
