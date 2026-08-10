const { test } = require('../../src/fixtures/testFixtures');
const { buildPartner, buildPartnerUpdate, PARTNER_TYPE, FIXED_ADDRESS } = require('../../src/data/partner.factory');
const { createPartnerViaUI, updatePartnerViaUI } = require('../../src/utils/partnerActions');

test.describe('Partner lifecycle - update', () => {
  test(
    'an existing Partner can be updated and the changes persist @update',
    async ({ partnersListPage, partnerFormPage }) => {
      const originalPartner = buildPartner({ type: PARTNER_TYPE.SERVICE, address: FIXED_ADDRESS });
      const updates = buildPartnerUpdate();

      await test.step('Precondition: create a partner to edit', async () => {
        await createPartnerViaUI(partnersListPage, partnerFormPage, originalPartner);
        await partnersListPage.open();
        await partnersListPage.assertPartnerVisible(originalPartner.name);
      });

      await test.step('Update the partner', async () => {
        await updatePartnerViaUI(partnersListPage, partnerFormPage, originalPartner.name, updates);
      });

      await test.step('Validate the changes were persisted', async () => {
        await partnersListPage.open();
        await partnersListPage.assertPartnerVisible(updates.name);
        await partnersListPage.assertPartnerFieldValue(updates.name, updates.name);
      });
    }
  );
});
