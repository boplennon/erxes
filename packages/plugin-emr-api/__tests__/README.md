# EMR Plugin Tests

This directory contains tests for the EMR plugin's Stringee integration.

## Test Structure

- `integration/` - End-to-end tests for API endpoints
- `unit/` - Unit tests for individual functions and services

## Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run specific test file
yarn test stringee.e2e.test.ts

# Run tests with coverage
yarn test --coverage
```

## Test Files

### Integration Tests
- `stringee.e2e.test.ts` - Tests for Stringee API endpoints:
  - GET `/stringee` - Health check
  - POST `/stringee/generate-token` - Token generation
  - ALL `/stringee/answer_url` - Call routing

### Unit Tests
- `stringeeService.test.ts` - Tests for Stringee service functions:
  - `generateStringeeSDKToken()` - JWT token generation for SDK
  - `generateStringeeRestToken()` - JWT token generation for REST API
  - `getOnlineUsers()` - Fetching online users

- `initApp.test.ts` - Tests for helper functions:
  - Customer resolution and creation
  - Custom data building
  - Online user management

## Test Environment

Tests use mocked dependencies to avoid external API calls and database connections. The test environment is configured in `jest.setup.js`.

## Mocking Strategy

- **External APIs**: Stringee API calls are mocked
- **Database**: Customer operations are mocked
- **Message Broker**: Core service communication is mocked
- **Environment**: Required environment variables are set

## Adding New Tests

1. Create test file in appropriate directory (`integration/` or `unit/`)
2. Follow naming convention: `*.test.ts`
3. Mock external dependencies
4. Test both success and error scenarios
5. Use descriptive test names
