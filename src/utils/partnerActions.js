// High-level, reusable business actions built on top of the Page Objects.
//
// Both partner-create.spec.js and partner-update.spec.js need to create a
// partner (the latter needs one to then edit). Rather than duplicating
// "open form -> fill -> submit -> confirm" in every spec, that sequence
// lives once here. Specs read as business steps; this module is the only
// place that needs to change if the creation flow itself changes.

const { createLogger } = require('./logger');

const logger = createLogger('partnerActions');

/**
 * Creates a partner end-to-end through the UI: opens the list, opens the
 * create form, fills it, submits, and confirms the save.
 * @returns the partnerData that was submitted, for use in assertions.
 */
async function createPartnerViaUI(partnersListPage, partnerFormPage, partnerData) {
  logger.step('Creating partner via UI', { name: partnerData.name });

  await partnersListPage.open();
  await partnersListPage.openNewPartnerForm();
  await partnerFormPage.fillNewPartner(partnerData);
  await partnerFormPage.submit();
  await partnerFormPage.waitForSaveConfirmation();

  return partnerData;
}

/**
 * Updates an existing partner: opens its edit form from the list,
 * applies the given field updates, submits, and confirms the save.
 */
async function updatePartnerViaUI(partnersListPage, partnerFormPage, existingName, updates) {
  logger.step('Updating partner via UI', { existingName, updates });

  await partnersListPage.open();
  await partnersListPage.assertPartnerVisible(existingName);
  await partnersListPage.openEditFor(existingName);
  await partnerFormPage.applyUpdate(updates);
  await partnerFormPage.submit();
  await partnerFormPage.waitForSaveConfirmation();

  return updates;
}

module.exports = { createPartnerViaUI, updatePartnerViaUI };
