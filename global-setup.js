// Playwright global setup.
//
// Why this exists: the assignment's business workflow starts with "Log in
// to the platform", and we DO test that flow explicitly and end-to-end in
// tests/auth/login.spec.js. But re-running a full UI login before every
// single Partner test would be slow and adds an extra point of flakiness
// (network, animations, etc.) to tests that aren't about login at all.
//
// Standard practice (and what we do here) is: log in once via the real
// browser UI, persist the authenticated storage state to disk, and let
// every other spec start already-authenticated by loading that state.
// This keeps the "real" login flow covered by its own test while keeping
// all other tests fast, focused, and independent of the login UI.

const { chromium } = require('@playwright/test');
const path = require('node:path');
const { env } = require('./src/config/env');
const { LoginPage } = require('./src/pages/LoginPage');

const STORAGE_STATE_PATH = path.join(__dirname, 'playwright', '.auth', 'user.json');

module.exports = async function globalSetup() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: env.baseUrl, locale: 'bg-BG' });
  const page = await context.newPage();

  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(env.user.email, env.user.password);
  await loginPage.assertLoginSucceeded();
  

  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
};

module.exports.STORAGE_STATE_PATH = STORAGE_STATE_PATH;
