const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/**
 * Represents the "Партньори" / "Partners" list screen.
 *
 * IMPORTANT: this app's UI language is a per-account preference (not tied
 * to browser locale), and it was found NOT to persist reliably across
 * Playwright's cached storage state between the login-time browser
 * context and each test's browser context. Rather than fight that, every
 * locator below matches BOTH the Bulgarian and English copy via regex -
 * this makes the suite resilient regardless of which language happens to
 * be active for the test account when a run starts.
 */
class PartnersListPage extends BasePage {
  static ROUTE = '/partners';

  constructor(page) {
    super(page);
    this.heading = page.getByText(/^Партньори$|^Partners$/).and(page.locator(':not(#partners-menu-item)'));
    this.searchInput = page.getByPlaceholder(/Търсене по партньори|Search by partners/i);
    this.newPartnerButton = page.getByRole('button', { name: /Нов партньор|New partner/i });
    this.tableRows = page.locator('table tbody tr, [role="row"]');
  }

  async open() {
    await this.goto(PartnersListPage.ROUTE);
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async openViaSidebar() {
    this.logger.step('Navigating to Партньори/Partners via sidebar');
    // The sidebar is icon-only (collapsed by default); the text label
    // Playwright's actionability check ("is visible") blocks a normal
    const sidebarLink = this.page.locator('#partners-menu-item');
    const clickableAncestor = sidebarLink.locator('xpath=ancestor::*[self::a or self::li or self::div][1]');
    await clickableAncestor.first().click({ force: true });
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async search(term) {
    this.logger.step('Searching partners', { term });
    await this.searchInput.fill(term);
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(500); // small buffer for debounce/indexing
  }

  rowByPartnerName(name) {
    return this.page.locator('tr, [role="row"]').filter({ hasText: name }).first();
  }

  async assertPartnerVisible(name, timeout = 15_000) {
    await this.search(name);
    await expect(this.rowByPartnerName(name)).toBeVisible({ timeout });
  }

  async assertPartnerFieldValue(name, expectedText, timeout = 15_000) {
    const row = this.rowByPartnerName(name);
    await expect(row).toContainText(expectedText, { timeout });
  }

  async openNewPartnerForm() {
    this.logger.step('Opening "Нов партньор" / "New partner" form');
    await this.newPartnerButton.click();
  }

  async openRowActionsMenu(name) {
    const row = this.rowByPartnerName(name);
    const menuTrigger = row.getByRole('img', { name: 'dots-icon' });
    await menuTrigger.click({ force: true });
  }

  async openEditFor(name) {
    this.logger.step('Opening edit form for partner', { name });
    await this.openRowActionsMenu(name);
    const editOption = this.page.locator('div').filter({ hasText: /^Edit$/ });
    await editOption.first().waitFor({ state: 'visible', timeout: 5000 });
    await editOption.first().click();
  }
}

module.exports = { PartnersListPage };