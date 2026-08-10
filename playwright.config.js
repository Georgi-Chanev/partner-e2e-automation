const { defineConfig, devices } = require('@playwright/test');
const { env } = require('./src/config/env');
const { STORAGE_STATE_PATH } = require('./global-setup');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,

  // Fail the CI build if someone accidentally leaves `.only` in a spec.
  forbidOnly: env.ciMode,

  // Flaky UI (custom dropdowns, autocomplete, animated modals) benefits
  // from a couple of retries in CI without masking real regressions -
  // locally we want failures to surface immediately.
  retries: env.ciMode ? 2 : 0,

  // Avoid oversubscribing a CI runner; use available cores locally.
  workers: env.ciMode ? 2 : undefined,

  globalSetup: require.resolve('./global-setup.js'),

  reporter: env.ciMode
    ? [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['junit', { outputFile: 'reports/junit-results.xml' }],
      ]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL: env.baseUrl,
    headless: env.headless,
    storageState: STORAGE_STATE_PATH,
    locale: 'bg-BG',

    // Observability: capture just enough to debug a failure without
    // bloating every green run.
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',

    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      // Login must be verified WITHOUT any pre-authenticated storage
      // state, since it's the flow that produces that state in the
      // first place.
      name: 'auth',
      testMatch: /tests\/auth\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
    },
    {
      name: 'partners',
      testMatch: /tests\/(partners|e2e)\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE_PATH,
      },
    },
  ],
});
