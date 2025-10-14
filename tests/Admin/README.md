# Admin Module Testing

This directory contains comprehensive unit and integration tests for the Admin module of the backend application.

## Test Structure

```
tests/
├── setup.ts                          # Global test setup and configuration
├── mocks/                            # Mock implementations
│   ├── prisma.mock.ts               # Prisma database mocks
│   ├── jwt.mock.ts                  # JWT token mocks
│   └── hash.mock.ts                 # Password hashing mocks
└── Admin/                           # Admin module tests
    ├── services/
    │   └── admin.service.test.ts    # Admin service unit tests
    ├── controllers/
    │   └── admin.controller.test.ts # Admin controller unit tests
    ├── middlewares/
    │   └── admin.middleware.test.ts # Admin middleware unit tests
    ├── validators/
    │   └── admin.validator.test.ts  # Admin validator unit tests
    └── routes/
        └── admin.route.test.ts      # Admin routes integration tests
```

## Test Coverage

### Services (`admin.service.test.ts`)
- ✅ Admin creation and registration
- ✅ Admin login and authentication
- ✅ Admin profile management (get, update)
- ✅ Service provider management and verification
- ✅ Customer management and analytics
- ✅ Payment statistics and analytics
- ✅ Revenue analytics and reporting
- ✅ Error handling and edge cases

### Controllers (`admin.controller.test.ts`)
- ✅ HTTP request/response handling
- ✅ Authentication and authorization
- ✅ Input validation and error responses
- ✅ Success responses and data formatting
- ✅ Error propagation and handling

### Middlewares (`admin.middleware.test.ts`)
- ✅ JWT token validation and verification
- ✅ Admin authentication middleware
- ✅ Optional authentication middleware
- ✅ Error handling for invalid tokens
- ✅ Role-based access control

### Validators (`admin.validator.test.ts`)
- ✅ Admin registration validation
- ✅ Admin login validation
- ✅ Admin profile update validation
- ✅ Service provider verification validation
- ✅ Input sanitization and error formatting

### Routes (`admin.route.test.ts`)
- ✅ Complete integration tests for all endpoints
- ✅ Authentication flow testing
- ✅ End-to-end request/response validation
- ✅ Route-level error handling

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Admin Module Tests Only
```bash
npm run test:admin
```

### Run Tests in Watch Mode
```bash
npm run test:watch
# or for admin only
npm run test:admin:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test Files
```bash
# Run service tests only
npx jest tests/Admin/services/admin.service.test.ts

# Run controller tests only
npx jest tests/Admin/controllers/admin.controller.test.ts

# Run middleware tests only
npx jest tests/Admin/middlewares/admin.middleware.test.ts

# Run validator tests only
npx jest tests/Admin/validators/admin.validator.test.ts

# Run route integration tests only
npx jest tests/Admin/routes/admin.route.test.ts
```

## Test Configuration

### Jest Configuration
The Jest configuration is located in `jest.config.cjs` with the following key settings:
- TypeScript support with ts-jest
- ESM module support
- Test environment: Node.js
- Coverage reporting enabled
- Setup file for global test configuration

### Mock Configuration
All mocks are configured in the `tests/setup.ts` file and include:
- Prisma database operations
- JWT token generation and verification
- Password hashing functions
- Environment variables for testing

## Key Testing Features

### Comprehensive Mocking
- Database operations are fully mocked to avoid dependencies
- JWT operations are mocked for consistent testing
- Hash functions are mocked for predictable testing

### Error Scenario Testing
- Database connection errors
- Invalid authentication tokens
- Validation failures
- Service unavailability scenarios

### Integration Testing
- Complete request/response cycle testing
- Middleware chain validation
- Route-level authentication testing

### Type Safety
- All tests are written in TypeScript
- Proper type checking for requests/responses
- Mock type safety with Jest

## Test Data

The tests use realistic mock data that mirrors the actual application structure:
- Admin user objects with proper field types
- Service provider data with relationships
- Payment and analytics data
- Validation error scenarios

## Continuous Integration

These tests are designed to run in CI/CD environments with:
- No external dependencies (all mocked)
- Deterministic results
- Fast execution times
- Comprehensive coverage reporting

## Adding New Tests

When adding new admin functionality:

1. Add service tests in `tests/Admin/services/`
2. Add controller tests in `tests/Admin/controllers/`
3. Add validator tests if new validation rules are added
4. Add middleware tests if new middleware is created
5. Add integration tests in `tests/Admin/routes/`

Follow the existing patterns for consistency and maintainability.