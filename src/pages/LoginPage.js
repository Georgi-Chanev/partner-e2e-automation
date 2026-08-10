const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    // Selectors observed directly on the login screen:
    // "Имейл" / "Парола" labels, plain text inputs, "Логин" submit button.
    this.heading = page.getByText('Логин', { exact: true }).first();
    this.loginButton = page.getByRole('button', { name: 'Логин' });
  }

  async open() {
    await this.goto('/');
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  /**
   * The email/password inputs have no placeholder text and no
   * data-testid in what we could inspect - only a label above each
   * ("Имейл", "Парола"). We resolve them positionally: the first text
   * input on the form is email, the one directly below labeled "Парола"
   * is the password. This is intentionally isolated here so if the app
   * adds proper name/id/data-testid attributes later, only this file
   * needs updating.
   */
  emailField() {
    return this.page.locator('form input, div:has-text("Имейл") input').first();
  }

  passwordField() {
    return this.page.locator('input[type="password"]').first();
  }

  async login(email, password) {
    this.logger.step('Logging in', { email });
    await this.emailField().fill(email);
    await this.passwordField().fill(password);
    await this.loginButton.click();
  }

  async assertLoginSucceeded() {
    // A successful login navigates away from the login screen into the
    // authenticated shell (sidebar + top bar with the logged-in email).
    await expect(this.heading).toBeHidden({ timeout: 15_000 });
    await expect(this.page.locator('#current-user-role')).toBeVisible({ timeout: 15_000 });
  }
  async switchLanguageToBulgarian() {
    this.logger.step('Ensuring UI language is Bulgarian');

    // Open the account/profile dropdown (top-right corner). This id is
    // stable regardless of the currently active UI language.
    await this.page.locator('#current-user-email').first().click();

    // Click the language row inside the panel - stable id, doesn't
    // depend on whether the label currently reads "български" or
    // "bulgarian".
    await this.page.locator('#language-option').click();

    // Select Bulgarian specifically by its stable id (confirmed via
    // Playwright Inspector's Pick Locator tool against the live app).
    const bulgarianOption = this.page.locator('#bulgarian-language-item');
    await bulgarianOption.waitFor({ state: 'visible', timeout: 5000 });
    await bulgarianOption.click();

    // Close the dropdown and give the app a moment to re-render.
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }
}

module.exports = { LoginPage };
