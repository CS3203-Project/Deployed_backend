# Backend Testing Guide

## Overview
This directory contains comprehensive Jest tests for the backend application. Tests are organized by module type (controllers, services, middlewares, utilities, validators).

## Test Structure

```
tests/
├── setup.ts                          # Global test setup and mocks
├── controllers/                      # Controller tests
│   ├── user.controller.test.ts
│   ├── payment.controller.test.ts
│   ├── category.controller.test.ts
│   ├── company.controller.test.ts
│   ├── provider.controller.test.ts
│   ├── services.controller.test.ts
│   ├── review.controller.test.ts
│   ├── notification.controller.test.ts
│   └── serviceRequest.controller.test.ts
├── services/                         # Service layer tests
│   ├── user.service.test.ts
│   └── category.service.test.ts
├── middlewares/                      # Middleware tests
│   ├── auth.middleware.test.ts
│   └── validation.middleware.test.ts
├── utils/                           # Utility tests
│   └── hash.test.ts
└── Admin/                           # Admin module tests
    └── (existing admin tests)
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test -- user.controller.test
```

### Run tests for a specific module
```bash
# Controllers
npm test -- controllers/

# Services
npm test -- services/

# Middlewares
npm test -- middlewares/

# Utilities
npm test -- utils/
```

## Test Coverage

The test suite covers:

### Controllers (9+ files)
- ✅ User Controller - Registration, login, profile management
- ✅ Payment Controller - Payment intents, confirmations, history
- ✅ Category Controller - CRUD operations for categories
- ✅ Company Controller - Company management
- ✅ Provider Controller - Provider profile management
- ✅ Services Controller - Service CRUD operations
- ✅ Review Controller - Review creation and management
- ✅ Notification Controller - User notifications
- ✅ ServiceRequest Controller - Service request lifecycle

### Services (2+ files)
- ✅ User Service - User registration, authentication, profile operations
- ✅ Category Service - Category management with hierarchical support

### Middlewares (2 files)
- ✅ Auth Middleware - JWT token validation
- ✅ Validation Middleware - Request validation

### Utilities (1 file)
- ✅ Hash Utility - Password hashing and comparison

## Test Configuration

### Jest Config (`jest.config.cjs`)
```javascript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  testTimeout: 10000
}
```

### Global Mocks (`tests/setup.ts`)
The setup file provides global mocks for:
- **Prisma Client** - All database models (User, Service, Payment, etc.)
- **bcrypt** - Password hashing functions
- **jsonwebtoken** - JWT operations
- **S3 Utilities** - File upload/download operations
- **Stripe** - Payment processing
- **Environment Variables** - Test-specific values

## Writing Tests

### Controller Test Example
```typescript
import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import * as controller from '../../src/controllers/example.controller.js';
import * as service from '../../src/services/example.service.js';

jest.mock('../../src/services/example.service.js');

describe('Example Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should handle request successfully', async () => {
    (service.someFunction as jest.Mock).mockResolvedValue({ data: 'test' });
    
    await controller.someController(req as Request, res as Response, next);
    
    expect(service.someFunction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
```

### Service Test Example
```typescript
import { jest } from '@jest/globals';
import { someService } from '../../src/services/example.service.js';
import { prisma } from '../../src/utils/database.js';

jest.mock('../../src/utils/database.js');

describe('Example Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should perform operation successfully', async () => {
    (prisma.model.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
    
    const result = await someService();
    
    expect(prisma.model.findUnique).toHaveBeenCalled();
    expect(result).toHaveProperty('id');
  });
});
```

## Best Practices

### 1. Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Clear all mocks between tests

### 2. Mocking
- Mock external dependencies (database, APIs, file system)
- Use `jest.mock()` for module-level mocks
- Reset mocks with `jest.clearAllMocks()`

### 3. Test Coverage
- Aim for >80% code coverage
- Test happy paths and error cases
- Test edge cases and boundary conditions

### 4. Assertions
- Use descriptive test names
- Test one thing per test case
- Use appropriate matchers (`toBe`, `toEqual`, `toHaveBeenCalledWith`)

### 5. Async Testing
- Always use `async/await` for async operations
- Test both resolved and rejected promises
- Handle errors appropriately

## Common Issues

### TypeScript Errors in Tests
The lint errors you see (e.g., "Cannot find name 'describe'") are normal and won't affect test execution. Jest provides these globals at runtime.

### Mock Not Working
- Ensure mocks are defined before importing the module
- Use `jest.clearAllMocks()` in `beforeEach`
- Check that mock paths are correct

### Test Timeout
- Increase timeout in jest.config.cjs
- Or use `jest.setTimeout(ms)` in individual tests

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

## Coverage Reports

After running tests with coverage, view the report:
```bash
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

Coverage reports show:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing TypeScript](https://jestjs.io/docs/getting-started#using-typescript)
- [Mocking Guide](https://jestjs.io/docs/mock-functions)
- [Matchers Reference](https://jestjs.io/docs/expect)

## Contributing

When adding new features:
1. Write tests alongside your code
2. Ensure all tests pass before committing
3. Maintain test coverage above 80%
4. Follow existing test patterns and structure

## Test Files Created

### Controllers
- ✅ `user.controller.test.ts` - Complete user controller tests
- ✅ `payment.controller.test.ts` - Payment operations tests
- ✅ `category.controller.test.ts` - Category CRUD tests
- ✅ `company.controller.test.ts` - Company management tests
- ✅ `provider.controller.test.ts` - Provider operations tests
- ✅ `services.controller.test.ts` - Service management tests
- ✅ `review.controller.test.ts` - Review system tests
- ✅ `notification.controller.test.ts` - Notification tests
- ✅ `serviceRequest.controller.test.ts` - Service request tests

### Services
- ✅ `user.service.test.ts` - Complete user service tests
- ✅ `category.service.test.ts` - Category service with hierarchy tests

### Middlewares
- ✅ `auth.middleware.test.ts` - JWT authentication tests
- ✅ `validation.middleware.test.ts` - Request validation tests

### Utilities
- ✅ `hash.test.ts` - Password hashing utilities tests

---

**Total Test Files**: 15+ comprehensive test suites covering major backend functionality
