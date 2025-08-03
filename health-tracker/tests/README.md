# Health Tracker Test Suite

This directory contains comprehensive tests for the Health Tracker application using Playwright.

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── auth.spec.ts       # Authentication flows
│   ├── dashboard.spec.ts  # Dashboard functionality
│   ├── fasting.spec.ts    # Fasting tracker features
│   ├── weight.spec.ts     # Weight tracking
│   ├── health-metrics.spec.ts  # Blood pressure & sugar
│   ├── schedule.spec.ts   # Scheduled fasts
│   ├── analytics.spec.ts  # Analytics & reports
│   └── pwa.spec.ts       # PWA features
├── components/            # Component tests
│   └── ui.spec.ts        # UI component behaviors
├── fixtures/             # Test fixtures
└── helpers/             # Test utilities
    ├── auth.helper.ts   # Auth mocking utilities
    └── api.helper.ts    # API mocking utilities
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests with UI mode
npm run test:ui

# Run tests in debug mode
npm run test:debug

# Run only E2E tests
npm run test:e2e

# Run only component tests
npm run test:components

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests only in Chrome
npm run test:chrome

# Run mobile tests
npm run test:mobile

# View test report
npm run test:report
```

## Test Categories

### E2E Tests
- **Authentication**: Login flows, session management, profile setup
- **Fasting**: Start/stop fasting, timer functionality, history, statistics
- **Weight Tracking**: Add/edit/delete weights, charts, progress tracking
- **Health Metrics**: Blood pressure and sugar tracking, charts, history
- **Scheduling**: Create/manage scheduled fasts, recurring patterns, reminders
- **Analytics**: Data visualization, exports, summary statistics
- **Dashboard**: Overview functionality, quick actions, data display
- **PWA**: Offline support, mobile responsiveness, installability

### Component Tests
- UI components behavior
- Form validation
- Loading states
- Responsive design
- Dark mode support
- Accessibility features

## Test Patterns

### API Mocking
Tests use helper functions to mock API responses:
```typescript
await mockApiResponse(page, '**/api/endpoint', responseData, statusCode);
```

### Authentication
Tests use a mock authentication helper:
```typescript
await mockAuthSession(page, userObject);
```

### Mobile Testing
Tests include mobile viewport testing:
```typescript
await page.setViewportSize({ width: 375, height: 667 });
```

## CI/CD Integration

Tests are configured to run in CI environments with:
- Parallel execution disabled for CI
- Retry on failure (2 attempts)
- HTML report generation
- Screenshot on failure
- Trace on retry

## Development Tips

1. **Run specific test file**:
   ```bash
   npx playwright test tests/e2e/fasting.spec.ts
   ```

2. **Run test with specific title**:
   ```bash
   npx playwright test -g "should start a fasting session"
   ```

3. **Update snapshots**:
   ```bash
   npx playwright test --update-snapshots
   ```

4. **Generate test code**:
   ```bash
   npx playwright codegen localhost:3000
   ```

## Best Practices

1. **Test Isolation**: Each test runs in isolation with fresh browser context
2. **API Mocking**: Mock external API calls to ensure consistent test results
3. **Selectors**: Use semantic selectors (role, label, text) over CSS selectors
4. **Assertions**: Use Playwright's auto-waiting assertions
5. **Mobile Testing**: Test both desktop and mobile viewports
6. **Error States**: Test both success and error scenarios

## Debugging

1. **Debug mode**: `npm run test:debug`
2. **UI mode**: `npm run test:ui` - Interactive test runner
3. **Traces**: Automatically captured on retry
4. **Screenshots**: Captured on failure
5. **Videos**: Can be enabled in config for debugging