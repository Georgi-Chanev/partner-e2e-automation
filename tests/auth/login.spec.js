const { test, expect } = require('../../src/fixtures/testFixtures');
const { env } = require('../../src/config/env');

test.describe('Authentication', () => {
  test('a valid user can log in to the platform @smoke', async ({ loginPage, page }) => {
    await test.step('Open the login screen', async () => {
      await loginPage.open();
    });

    await test.step('Submit valid credentials', async () => {
      await loginPage.login(env.user.email, env.user.password);
    });

    await test.step('Land on the authenticated dashboard', async () => {
      await loginPage.assertLoginSucceeded();
      await expect(page.locator('#current-user-email')).toBeVisible();
    });
  });

  test('an invalid password is rejected with an error, not a silent failure', async ({
    loginPage,
    page,
  }) => {
    await loginPage.open();
    await loginPage.login(env.user.email, 'clearly-wrong-password');

    // We assert the negative outcome two ways: the app should NOT
    // navigate to the authenticated shell, AND it should surface some
    // visible error feedback. Exact error copy wasn't confirmed against
    // the live app, so we assert broadly rather than pin exact wording.
    await expect(loginPage.heading).toBeVisible();
    const anyErrorSignal = page
      .locator('[role="alert"], [class*="error" i]')
      .or(page.getByText(/грешен|невалид|incorrect|invalid/i));
    await expect(anyErrorSignal.first()).toBeVisible({ timeout: 10_000 });
  });
});
