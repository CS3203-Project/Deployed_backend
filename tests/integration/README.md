# Integration Tests - Important Information

## How Integration Tests Work

The integration tests in this project test the **running API server** rather than importing the application code directly. This approach was chosen because:

1. **Avoids ES Module Issues**: The main `index.ts` uses top-level `await` which Jest cannot handle
2. **Tests Real Behavior**: Tests the actual HTTP server as it runs in production  
3. **Simpler Setup**: No need to mock the entire application stack
4. **Realistic Testing**: Tests include network layer, middleware, etc.

## Running Integration Tests

###  **IMPORTANT: Start the Server First!**

Before running integration tests, you **MUST** start the API server:

```bash
# Terminal 1: Start the server
npm run dev
```

Then in a **separate terminal**:

```bash
# Terminal 2: Run integration tests
npm run test:integration
```

### Alternative: Quick Test (Without Server)

If you run integration tests without the server running, they will fail with connection errors. That's expected!

## Test Configuration

- **Server URL**: `http://localhost:5000` (default)
- **Custom URL**: Set `TEST_SERVER_URL` environment variable
  ```bash
  # Windows PowerShell
  $env:TEST_SERVER_URL="http://localhost:3000" ; npm run test:integration
  
  # Linux/Mac
  TEST_SERVER_URL=http://localhost:3000 npm run test:integration
  ```

## Available Integration Test Scripts

```bash
npm run test:integration        # All integration tests
npm run test:api               # API endpoint tests only  
npm run test:perf              # Performance tests only
```

## Troubleshooting

### Error: `ECONNREFUSED`
**Problem**: Server is not running  
**Solution**: Start server with `npm run dev` in another terminal

### Error: Tests timeout
**Problem**: Server is slow to respond or database is locked  
**Solution**: 
- Check server logs for errors
- Ensure database is not locked by OneDrive
- Increase timeout in `jest.config.cjs`

### Error: Random test failures
**Problem**: Rate limiting or concurrent test issues  
**Solution**: Run tests with `--runInBand` flag:
```bash
npx jest --testPathPatterns=integration --runInBand
```

## Test Structure

```
tests/integration/
├── test-server.ts                   # Server configuration
├── api.integration.test.ts          # API endpoint tests
├── performance.integration.test.ts   # Performance tests
└── auth.integration.test.ts          # Authentication tests
```

## What Gets Tested

✅ **API Endpoints**: All GET/POST/PUT/DELETE routes  
✅ **Response Formats**: JSON structure, status codes  
✅ **Error Handling**: 404s, validation errors  
✅ **Performance**: Response times, concurrent requests  
✅ **Security**: CORS headers, authentication  
✅ **Rate Limiting**: Request limits  

## Best Practices

1. **Always start server first**
2. **Seed database** for consistent test data: `npm run seed`
3. **Run tests in sequence** to avoid race conditions
4. **Check server logs** if tests fail
5. **Clean up test data** after tests (if needed)

## Example Workflow

```bash
# 1. Seed the database (optional but recommended)
npm run seed

# 2. Start the server
npm run dev

# 3. In another terminal, run tests
npm run test:integration

# 4. Or run specific test file
npx jest tests/integration/api.integration.test.ts
```

## CI/CD Considerations

For CI/CD pipelines, you can:

1. **Start server in background**:
   ```yaml
   - name: Start server
     run: npm run dev &
   
   - name: Wait for server
     run: sleep 5
   
   - name: Run tests
     run: npm run test:integration
   ```

2. **Or use a test database**:
   ```yaml
   env:
     DATABASE_URL: "file:./test.db"
     TEST_SERVER_URL: "http://localhost:5000"
   ```

---

**Note**: These integration tests are **end-to-end** tests that require a running server. For unit tests that don't require the server, use `npm test`.
