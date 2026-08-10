const { test, expect } = require('../../src/fixtures/testFixtures');
const { buildPartner, PARTNER_TYPE, FIXED_ADDRESS } = require('../../src/data/partner.factory');

test.describe('Partner creation', () => {
  test(
    'a region admin can create a new Partner with all required information @smoke @create',
    async ({ partnersListPage, partnerFormPage }) => {
      const partnerData = buildPartner({
        type: PARTNER_TYPE.SERVICE,
        address: FIXED_ADDRESS,
      });

      await test.step('Navigate to Партньори and open the create form', async () => {
        await partnersListPage.open();
        await partnersListPage.openNewPartnerForm();
        await partnerFormPage.waitUntilOpen();
      });

      await test.step('Populate all required fields', async () => {
        await partnerFormPage.fillNewPartner(partnerData);
      });

      await test.step('Save the partner', async () => {
        await partnerFormPage.submit();
        await partnerFormPage.waitForSaveConfirmation();
      });

      await test.step('Validate the partner was created successfully', async () => {
        await partnersListPage.open();
        await partnersListPage.assertPartnerVisible(partnerData.name);
        await partnersListPage.assertPartnerFieldValue(partnerData.name, /Sofia|София/i);
      });
    }
  );

  test('required fields are enforced - submitting an empty form is blocked', async ({
    partnersListPage,
    partnerFormPage,
  }) => {
    await partnersListPage.open();
    await partnersListPage.openNewPartnerForm();
    await partnerFormPage.waitUntilOpen();

    await partnerFormPage.submit();

    // A validation failure should keep the modal open (no save
    // confirmation), proving client-side required-field checks work.
    await expect(partnerFormPage.saveButton).toBeVisible();
  });
});
