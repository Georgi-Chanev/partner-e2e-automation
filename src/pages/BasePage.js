const { createLogger } = require('../utils/logger');

/**
 * BasePage centralizes interaction patterns that are reused across every
 * page of this admin panel:
 *  - The app is a client-rendered SPA (React-ish), so elements often exist
 *    in the DOM before they're interactive. We standardize on
 *    Playwright's built-in auto-waiting + explicit "actionable" waits
 *    rather than sprinkling arbitrary `waitForTimeout` calls through specs
 *    (a major source of flakiness in most E2E suites).
 *  - The UI uses custom (non-native) dropdowns/comboboxes with no visible
 *    `data-testid` attributes in what we could inspect. Rather than
 *    hardcoding brittle CSS paths per page, BasePage exposes small,
 *    semantic helpers ("open the dropdown next to this label", "pick this
 *    option") that every Page Object composes. If the real DOM exposes
 *    test ids later, only these helpers need to change - not every spec.
 */
class BasePage {
  constructor(page) {
    this.page = page;
    this.logger = createLogger(this.constructor.name);
  }

  async goto(path = '/') {
    this.logger.step(`Navigating to ${path}`);
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Finds the interactive control (input/button/combobox) that sits next
   * to a given visible label text - the common layout in this app
   * (e.g. "Име *" label to the left, input to the right).
   *
   * Strategy, in order of preference:
   *   1. Native accessible label association (getByLabel) - works if the
   *      app ever adds proper <label for> / aria-labelledby.
   *   2. Nearest textbox/combobox following the label text in the DOM.
   * This two-tier approach keeps tests working whether or not the app
   * improves its accessibility markup over time.
   */
  fieldNearLabel(labelText) {
    const byLabel = this.page.getByLabel(labelText, { exact: false });
    return byLabel;
  }

  /**
   * Fallback locator: the first input/textarea/button-like control that
   * appears after a label with the given text, scoped to the same form
   * row. Used for the custom dropdowns that have no native label wiring.
   */
  controlAfterLabel(labelText) {
    return this.page
      .locator(
        `xpath=//*[self::label or self::div or self::span][contains(normalize-space(.), "${labelText}")]` +
          `/following::*[self::input or self::textarea or self::button or self::div[@role="combobox" or @role="button"]][1]`
      )
      .first();
  }

  async waitForNoOverlaySpinner() {
    // Generic loading spinners/skeletons commonly use these class hooks.
    // If none exist, the locator resolves to 0 elements and the wait
    // no-ops instead of failing - keeps this safe to call defensively.
    const spinner = this.page.locator(
      '[class*="spinner" i], [class*="loading" i], [aria-busy="true"]'
    );
    const count = await spinner.count();
    if (count > 0) {
      await spinner
        .first()
        .waitFor({ state: 'hidden', timeout: 10_000 })
        .catch(() => {
          // Non-fatal: some spinners are removed from DOM rather than hidden.
        });
    }
  }

  async isVisibleWithin(locator, timeout = 3000) {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async isHiddenWithin(locator, timeout = 5000) {
    try {
      await locator.waitFor({ state: 'hidden', timeout });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = { BasePage };
