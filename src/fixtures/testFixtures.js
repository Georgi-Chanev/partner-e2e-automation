// Custom fixtures layer.
//
// Instead of every spec doing `new PartnersListPage(page)` and wiring
// things up manually, tests import `test`/`expect` from here and receive
// ready-to-use Page Objects as fixtures. This is the standard Playwright
// pattern for scaling a Page Object Model: it keeps spec files focused on
// *business steps*, and centralizes Page Object construction/teardown in
// one place.

const base = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { PartnersListPage } = require('../pages/PartnersListPage');
const { PartnerFormPage } = require('../pages/PartnerFormPage');

const test = base.test.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  partnersListPage: async ({ page }, use) => {
    await use(new PartnersListPage(page));
  },
  partnerFormPage: async ({ page }, use) => {
    await use(new PartnerFormPage(page));
  },
});

module.exports = { test, expect: base.expect };
