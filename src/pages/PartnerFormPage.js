const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/**
 * Represents the "Нов партньор" / "New partner" modal (shared with Edit).
 *
 * All text-based locators are bilingual (BG/EN regex) - see the note in
 * PartnersListPage.js for why: the UI language is an account preference
 * that doesn't reliably survive Playwright's storage-state caching
 * between the login-time context and each test's context.
 */
class PartnerFormPage extends BasePage {
  constructor(page) {
    super(page);

    this.nameInput = page.getByPlaceholder(/Напиши име на партньор|Write partner name/i);
    this.typeTrigger = page.getByText(/Избери тип на партньора|Select partner type/i);
    this.servicesTrigger = page.getByText(/Избери услуги|Select service types/i);
    this.planTrigger = page.getByText(/Избери абонаментен план|Select subscription tier/i);
    this.addressInput = page.getByPlaceholder(/Въведи локация|Enter a location/i);
    this.contactPersonInput = page.getByPlaceholder(/Имена на лицето за контакт|Names of contact person/i);
    this.descriptionInput = page.getByPlaceholder(/Напиши описание|Write description/i);
    this.logoFileInput = page.locator('input[type="file"]');
    this.hideInMobileCheckbox = page.getByText(/Скрий в мобилното приложение|Hide in mobile app/i);

    this.saveButton = page.getByRole('button', { name: /Запази|Save/i }).first();
    this.cancelButton = page.getByRole('button', { name: /Отказ|Cancel/i }).first();

    // Google Places autocomplete - stable global class regardless of site language.
    this.addressSuggestion = page.locator('.pac-container .pac-item').first();
  }

  async isOpen() {
    return this.isVisibleWithin(this.saveButton, 5000);
  }

  async waitUntilOpen() {
    await expect(this.saveButton).toBeVisible({ timeout: 10_000 });
    await expect(this.nameInput).toBeVisible({ timeout: 10_000 });
  }

  /** The phone number input follows the "Телефон"/"Telephone" label - try both. */
  phoneNumberField() {
    const bg = this.controlAfterLabel('Телефон');
    const en = this.controlAfterLabel('Telephone');
    return bg.or(en);
  }

  /** Ant Design renders the open dropdown panel with this class, appended to <body>. */
  openAntDropdownOptions() {
    return this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item');
  }

  async openDropdownAndPickFirst(triggerLocator) {
    await triggerLocator.click({ force: true });
    await this.page.waitForTimeout(300); // let the dropdown panel animate open
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
    await this.nameInput.click({ force: true }).catch(() => {});
  }

  async openDropdownAndPickByText(triggerLocator, optionPattern) {
    await triggerLocator.click({ force: true });
    const options = this.openAntDropdownOptions();
    await expect(options.first()).toBeVisible({ timeout: 5000 });
    const option = options.filter({ hasText: optionPattern });
    await option.first().waitFor({ state: 'visible', timeout: 5000 });
    await option.first().click({ force: true });
    await this.nameInput.click({ force: true }).catch(() => {});
  }

  async fillName(name) {
    this.logger.step('Filling Name/Име', { name });
    await this.nameInput.fill(name);
  }

  /** Selects the "Сервиз" / "Service" partner type, as required by the assignment. */
  async selectServiceType() {
    this.logger.step('Selecting Type = Сервиз/Service');
    await this.openDropdownAndPickByText(this.typeTrigger, /^Сервиз$|^Service$/i);
  }


   //Selects multiple services (not just one) so created test partners
  async selectAvailableServices(count = 3) {
    this.logger.step('Selecting available Услуги/Services', { count });
    await this.servicesTrigger.click({ force: true });
    await this.page.waitForTimeout(300);

    for (let i = 0; i < count; i++) {
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
    }

    await this.nameInput.click({ force: true }).catch(() => {});
  }

  async selectFirstAvailablePlan() {
    this.logger.step('Selecting first available Абонаментен план/Subscription plan');
    await this.openDropdownAndPickFirst(this.planTrigger);
  }

  async fillAddress(address) {
    this.logger.step('Filling Адрес/Address', { address });
    await this.addressInput.click();
    await this.addressInput.fill(address);
    await expect(this.addressSuggestion).toBeVisible({ timeout: 7000 });
    await this.addressSuggestion.click();
  }

  async fillPhone(phoneNumber) {
    this.logger.step('Filling Телефон/Telephone', { phoneNumber });
    await this.phoneNumberField().fill(phoneNumber);
  }

  async fillContactPerson(name) {
    this.logger.step('Filling Лице за контакти/Contact person', { name });
    await this.contactPersonInput.fill(name);
  }

  async fillDescription(text) {
    this.logger.step('Filling Описание/Description');
    await this.descriptionInput.fill(text);
  }

  async uploadLogo(filePath) {
    this.logger.step('Uploading Лого/Logo', { filePath });
    await this.logoFileInput.setInputFiles(filePath);

    const editPhotoModal = this.page.getByText(/Edit photo|Редактирай снимка/i);
    const hasEditPhotoModal = await this.isVisibleWithin(editPhotoModal, 3000);

    if (hasEditPhotoModal) {
      this.logger.step('Confirming logo in "Edit photo" dialog');

      // Scope strictly to the topmost modal panel - the crop dialog is a
      // nested Ant Design modal rendered on top of the main form modal,
      // so it's the LAST ".ant-modal-content" in the DOM. This avoids
      // ambiguity with the main form's own Save button.
      const editPhotoDialog = this.page.locator('.ant-modal-content').last();
      const editPhotoSaveButton = editPhotoDialog.getByRole('button', { name: /^Save$|^Запази$/i });

      await editPhotoSaveButton.waitFor({ state: 'visible', timeout: 5000 });
      await this.page.waitForTimeout(500); // let the crop widget finish rendering
      await editPhotoSaveButton.click();

      const closed = await editPhotoModal
        .waitFor({ state: 'hidden', timeout: 10_000 })
        .then(() => true)
        .catch(() => false);

      if (!closed) {
        this.logger.warn('Edit photo dialog still open, retrying Save click with force');
        await editPhotoSaveButton.click({ force: true });
        await editPhotoModal.waitFor({ state: 'hidden', timeout: 10_000 });
      }

      
      await this.page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
      await this.page.waitForTimeout(500);
    }
  }

  async fillNewPartner(partnerData) {
    await this.waitUntilOpen();
    await this.fillName(partnerData.name);
    await this.selectServiceType();
    await this.selectAvailableServices(3);
    await this.selectFirstAvailablePlan();
    await this.fillAddress(partnerData.address);
    await this.fillPhone(partnerData.phone);
    await this.fillContactPerson(partnerData.contactPerson);
    await this.fillDescription(partnerData.description);
    await this.uploadLogo(partnerData.logoPath);
  }

  async applyUpdate(updates) {
    await this.waitUntilOpen();
    if (updates.name) await this.fillName(updates.name);
    if (updates.contactPerson) await this.fillContactPerson(updates.contactPerson);
    if (updates.description) await this.fillDescription(updates.description);
  }

  async submit() {
    this.logger.step('Submitting form (Запази/Save)');
    await this.saveButton.click({ force: true });
  }

  async waitForSaveConfirmation(timeout = 15_000) {
    // Prioritize the modal actually closing (saveButton disappearing) as
    // the primary success signal - it's unambiguous. A generic toast
    // element is used only as a fallback, since a stale toast from an
    // earlier step (e.g. confirming the Лого/Logo "Edit photo" dialog)
    // can still be in the DOM and would otherwise give a false positive.
    const modalClosed = await this.saveButton
      .waitFor({ state: 'hidden', timeout })
      .then(() => true)
      .catch(() => false);

    if (modalClosed) {
      this.logger.info('Save confirmed', { signal: 'modal-closed' });
      return 'modal-closed';
    }

    const toast = this.page.locator(
      '[role="alert"], [class*="toast" i], [class*="notification" i], [class*="snackbar" i]'
    );
    const toastVisible = await this.isVisibleWithin(toast.first(), 3000);

    if (toastVisible) {
      this.logger.info('Save confirmed', { signal: 'toast' });
      return 'toast';
    }

    throw new Error(
      'Neither modal closure nor a success toast was detected after submitting the ' +
        'Partner form. Inspect the trace/screenshot for this test run.'
    );
  }
}

module.exports = { PartnerFormPage };