// Test data factory for the Partner entity.
//
// Why a factory instead of static fixtures:
//  - Every test gets a *unique* partner name/phone, so tests can run
//    in parallel and repeatedly against a shared environment without
//    colliding on "already exists" validation or polluting search results
//    used by other tests.
//  - Domain rules (required fields, allowed Type values) live in one
//    place. If the app adds a new required field, we update it here
//    instead of hunting through every spec file.
//  - Assignment-mandated values (Address = "Sofia, Bulgaria",
//    Type = "Сервиз") are pinned as constants so they can't drift.

const path = require('node:path');

const PARTNER_TYPE = {
  SERVICE: 'Сервиз', // Required by the assignment ("Service / Сервиз")
};

const FIXED_ADDRESS = 'Sofia, Bulgaria'; // Assignment: content not validated, only presence.
const LOGO_FILE_PATH = path.join(__dirname, '..', '..', 'assets', 'test-logo.png');

/** Generates a Bulgarian-looking mobile number that's unlikely to collide. */
function randomBgPhoneNumber() {
  // 8-9 digits after the country code, avoiding leading zero.
  const subscriber = Math.floor(100000000 + Math.random() * 800000000);
  return String(subscriber);
}

function uniqueSuffix() {
  // timestamp + short random string keeps names sortable AND unique
  // even if two workers create a partner in the same millisecond.
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Builds a complete, valid "create partner" payload.
 * @param {Partial<PartnerData>} overrides - fields to override for specific scenarios.
 */
function buildPartner(overrides = {}) {
  const suffix = uniqueSuffix();

  const base = {
    name: `QA E2E Partner ${suffix}`,
    type: PARTNER_TYPE.SERVICE,
    // Left null on purpose: which exact service(s)/plan to pick is a UI
    // concern (e.g. "select first available option"), resolved in the
    // Page Object rather than hardcoded here, since option lists are
    // dynamic reference data that can change over time.
    address: FIXED_ADDRESS,
    phone: randomBgPhoneNumber(),
    contactPerson: `QA Contact ${suffix}`,
    description: `Automated test partner created by Playwright E2E suite. Run id: ${suffix}`,
    logoPath: LOGO_FILE_PATH,
  };

  return { ...base, ...overrides };
}

/** Builds the delta used to update an existing partner in the lifecycle test. */
function buildPartnerUpdate(overrides = {}) {
  const suffix = uniqueSuffix();
  return {
    name: `QA E2E Partner UPDATED ${suffix}`,
    contactPerson: `QA Contact UPDATED ${suffix}`,
    description: `Updated by Playwright E2E suite during lifecycle test. Run id: ${suffix}`,
    ...overrides,
  };
}

module.exports = {
  PARTNER_TYPE,
  FIXED_ADDRESS,
  buildPartner,
  buildPartnerUpdate,
};
