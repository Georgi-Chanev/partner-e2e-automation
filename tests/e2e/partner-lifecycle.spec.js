// This spec mirrors the assignment's business scenario end-to-end, as a
// single continuous journey, in addition to the more granular/focused
// specs under tests/partners/. Keeping both is a deliberate choice:
//   - Granular specs (partner-create.spec.js, partner-update.spec.js) are
//     fast, independent, and pinpoint exactly what broke.
//   - This lifecycle spec demonstrates the full real-world user journey
//     as described in the assignment, and is the one most representative
//     of "does the whole thing work end-to-end".
// In a real project this file would typically be tagged and run as part
// of a smoke/regression gate before release, while the granular specs
// run on every PR.

const { test } = require('../../src/fixtures/testFixtures');
const { env } = require('../../src/config/env');
const { buildPartner, buildPartnerUpdate, PARTNER_TYPE, FIXED_ADDRESS } = require('../../src/data/partner.factory');
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Partner E2E business workflow', () => {
  test('log in, create a Partner, validate it, then update and re-validate it @e2e @regression', async ({
    loginPage,
    partnersListPage,
    partnerFormPage,
  }) => {
    const partner = buildPartner({ type: PARTNER_TYPE.SERVICE, address: FIXED_ADDRESS });
    const updates = buildPartnerUpdate();

    await test.step('1. Log in to the platform', async () => {
      await loginPage.open();
      await loginPage.login(env.user.email, env.user.password);
      await loginPage.assertLoginSucceeded();
    });

    await test.step('2. Navigate to the Partners section', async () => {
      await partnersListPage.openViaSidebar();
    });

    await test.step('3-4. Create a new Partner and populate all required information', async () => {
      await partnersListPage.openNewPartnerForm();
      await partnerFormPage.fillNewPartner(partner);
    });

    await test.step('5. Successfully save the Partner', async () => {
      await partnerFormPage.submit();
      await partnerFormPage.waitForSaveConfirmation();
    });

    await test.step('6. Validate that the Partner has been created successfully', async () => {
      await partnersListPage.open();
      await partnersListPage.assertPartnerVisible(partner.name);
    });

    await test.step('7. Update the existing Partner', async () => {
      await partnersListPage.openEditFor(partner.name);
      await partnerFormPage.applyUpdate(updates);
      await partnerFormPage.submit();
      await partnerFormPage.waitForSaveConfirmation();
    });

    await test.step('8. Validate that the changes have been persisted', async () => {
      await partnersListPage.open();
      await partnersListPage.assertPartnerVisible(updates.name);
    });
  });
});
