# Partner E2E Automation

End-to-end automation for the Partner management workflow of the
Avtoikonom admin panel (`dev.admin.avtoikonom.com`), built with
**Playwright + JavaScript**.

Covers: login → navigate to Partners → create a Partner with all
required fields → validate creation → update the Partner → validate the
update persisted.

---

## 1. Installation & running

### Prerequisites
- Node.js 18+
- Network access to `dev.admin.avtoikonom.com`

### Setup

```bash
npm install
npx playwright install --with-deps chromium
copy .env.example .env
```

`.env` (already pre-filled with the assignment's test account):

BASE_URL=https://dev.admin.avtoikonom.com
TEST_USER_EMAIL=test_qa_ex@example.com
TEST_USER_PASSWORD=test_qa_ex@example.com

### Running the suite

```bash
npm test                # full suite, headless
npm run test:headed     # watch the browser while it runs
npm run test:ui         # Playwright's interactive UI mode - best for debugging
npm run test:debug      # step through with the Playwright inspector

npm run test:create     # only the create-partner spec
npm run test:update     # only the update-partner spec
npm run test:lifecycle  # the full login->create->validate->update->validate journey

npm run report           # open the last HTML report
```

On the first test run, `global-setup.js` logs in once through the real
UI and caches the authenticated session to
`playwright/.auth/user.json`. All specs except `tests/auth/login.spec.js`
(which deliberately runs unauthenticated, since it's testing login
itself) reuse that session instead of re-logging-in every test.

### CI

`.github/workflows/e2e-tests.yml` runs the suite on every push/PR to
`main`, on demand, and nightly. It expects three GitHub Actions secrets:
`E2E_BASE_URL`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`. The HTML report
and JUnit results are uploaded as artifacts on every run (pass or fail).

---

## 2. Project structure

playwright.config.js Environment-driven Playwright config (projects, reporters, tracing)
global-setup.js One-time UI login -> cached storage state
src/
config/env.js Centralized, fail-fast env var loading
pages/ Page Object Model
BasePage.js Shared, resilient interaction helpers
LoginPage.js
PartnersListPage.js
PartnerFormPage.js Shared by both Create and Edit (same fields/footer)
fixtures/testFixtures.js Custom Playwright fixtures exposing Page Objects to specs
data/partner.factory.js Unique, valid test data generation
utils/
partnerActions.js Reusable business flows (createPartnerViaUI, updatePartnerViaUI)
logger.js Lightweight structured step logging
tests/
auth/login.spec.js Login flow, run unauthenticated
partners/
partner-create.spec.js
partner-update.spec.js
e2e/
partner-lifecycle.spec.js Full journey mirroring the assignment scenario 1:1
assets/test-logo.png Test image used for the required Лого/Logo upload
---

## 3. Assumptions made during implementation

The application under test had no documented selectors, no
`data-testid` attributes, and no available API/Swagger docs, so the
suite was built by iteratively probing the live UI. A few things are
worth calling out explicitly rather than leaving implicit in the code:

- **Partners route** is `/partners`, confirmed against the live app.
- **Edit form reuses the Create form's fields and footer** (`Отказ`/`Cancel`,
  `Запази`/`Save`) - confirmed; `PartnerFormPage` serves both flows.
- **Услуги (Services) selection**: the assignment only mandates specific
  values for `Type` (Сервиз/Service) and `Address` (Sofia, Bulgaria). For
  Services and Subscription plan, the suite selects a small, representative
  set (3 services) rather than the bare minimum, so generated test data
  looks similar to real partner records rather than sparse edge cases.
- **Test partner naming**: names are prefixed `QA E2E Partner <timestamp>-<random>`
  to guarantee uniqueness against the shared dev database (which already
  contained 1000+ partner records at the time of writing), enabling safe
  parallel/repeated execution without name collisions.
- **Verification method**: no API endpoint was discoverable for this
  environment (not publicly documented, and this was a fully black-box
  UI-testing exercise), so all verification goes through the UI - searching
  the Партньори/Partners list by the unique generated name. The action layer
  (`partnerActions.js`, `PartnersListPage`) is isolated enough that swapping
  in API-based verification/cleanup later is a contained change.
- **Test logo image**: `assets/test-logo.png` must be a real, reasonably
  sized image (not a 1x1 placeholder - see "Known technical quirks" below
  for why). Replace it with any valid PNG/JPG if you want a different
  visual; the suite doesn't validate its content.

---

## 4. Known technical quirks of the application under test

These were discovered empirically while building the suite and are
encoded as comments in the relevant Page Object files. Documented here
for anyone maintaining this suite later:

1. **UI language is a per-account preference, not browser locale.** Setting
   Playwright's `locale` option has no effect - the app renders in whichever
   language (Bulgarian/English/German) was last selected for that account,
   and this preference did not reliably persist across Playwright's cached
   `storageState` between the login-time browser context and each test's
   context. Rather than fight this, **every text-based locator in
   `PartnersListPage.js` and `PartnerFormPage.js` is bilingual** (matches
   both Bulgarian and English copy via regex), which makes the suite
   resilient regardless of which language happens to be active.

2. **Sidebar labels are visually hidden when collapsed.** Text like
   "Партньори"/"Partners" exists in the DOM (`#partners-menu-item`) but
   fails Playwright's visibility check when the sidebar is in its default
   icon-only state. `openViaSidebar()` clicks the icon container instead
   of the (invisible) text label.

3. **Duplicate "Логин"/"Save" text on the same screen.** Several screens
   render the same word as both a heading and a button label (e.g. the
   login screen's "Логин" title *and* submit button). Locators disambiguate
   with `.first()`/`.last()` or stable `id` attributes where available
   (e.g. `#current-user-email`, `#current-user-role`) rather than plain
   text matches.

4. **Dropdowns are Ant Design components, not native `<select>`.** They
   render an `<input role="combobox">` with a search overlay that
   intercepts pointer events on the visible label text, and open their
   option panels in a portal (`.ant-select-dropdown`) outside the modal's
   own DOM subtree. Options are selected via keyboard (`ArrowDown` +
   `Enter`) rather than mouse clicks, which proved far more reliable than
   clicking individual `.ant-select-item` elements (which can shift/re-render
   during Ant Design's list virtualization).

5. **Row-level Edit action** is an image-role "..." icon
   (`getByRole('img', { name: 'dots-icon' })`) rather than a `<button>`,
   opening a menu whose "Edit" option is a plain `<div>` with no ARIA role.

6. **Uploading a Лого/Logo opens a second, nested "Edit photo" modal**
   (an image crop/preview dialog) with its own Save/Cancel buttons stacked
   on top of the main form modal. It must be confirmed
   (`.ant-modal-content` last-in-DOM = topmost dialog) before the main
   form's own Save button becomes unambiguous and submittable.

7. **A degenerate (1x1 pixel) test image breaks the crop widget silently.**
   The original placeholder logo caused the "Edit photo" dialog's confirm
   button to never actually complete processing, leading to a backend
   "Something went wrong" error on final submit with no client-side
   validation message. `assets/test-logo.png` was replaced with a real,
   reasonably-sized (200x200) generated PNG to avoid this.

8. **Google Places address autocomplete** renders its suggestion panel
   as `.pac-container .pac-item`, appended to `<body>` - a stable, globally
   recognizable class regardless of the host site's own markup, used
   directly rather than guessing at app-specific selectors.

---

## 5. Key architectural decisions

- **Page Object Model**, kept deliberately thin: pages expose
  *business-meaningful* methods (`fillNewPartner`, `assertPartnerVisible`),
  not raw locator getters, so specs read like a checklist of the actual
  workflow rather than DOM plumbing.
- **One shared `PartnerFormPage`** for Create and Edit instead of two
  near-duplicate classes, since the fields and save mechanism are
  confirmed identical between both flows.
- **Fail loudly over silent pass.** `waitForSaveConfirmation` throws
  a descriptive error instead of proceeding if it can't detect success
  (checks modal closure first, falls back to a toast/alert element,
  never assumes success from a stale/unrelated signal).
- **Data factory over static fixtures** (`partner.factory.js`): every
  run generates unique names/phone numbers, which is what makes the
  suite safe to run repeatedly and in parallel against a shared,
  persistent dev database without name collisions or accumulating
  unremovable "fixture" rows that shadow real data.
- **Global setup + cached storage state** rather than logging in inside
  every test: keeps the dedicated login test as the single source of
  truth for "does login work," while every other test starts fast and
  isolated from login-page flakiness.
- **Two-project Playwright config** (`auth` vs `partners`) so the login
  spec runs with a clean, unauthenticated context while everything else
  reuses the cached session - enforced by config, not by convention.
- **Environment config centralized and fail-fast** (`src/config/env.js`):
  a missing/misnamed env var throws immediately with a clear message
  instead of surfacing as a confusing test failure three layers down.
- **Observability by default**: trace/video/screenshot are captured
  `on-failure` (not on every run, to keep CI artifacts lean), plus
  lightweight step-level console logging via `logger.js` and Playwright's
  own `test.step()` blocks, so a failing CI run is diagnosable from the
  reporter output alone, before even opening the trace viewer.
- **CI-ready from day one**: JUnit output for test-result reporting
  integrations, HTML report as a downloadable artifact, `forbidOnly` in
  CI to catch stray `.only()`, and retries enabled only in CI (not
  locally, where a flaky pass should not be trusted).

---

## 6. What I'd improve or extend with more time

1. **Push for `data-testid` attributes** on the app's custom form controls
   (dropdowns, the row-level "..." menu, the address autocomplete) -
   this is the single biggest reliability upgrade available. All current
   text/role/positional locators are isolated to the Page Object layer
   specifically to make that swap mechanical when/if those attributes
   are added.
2. **API-backed setup/teardown.** If a REST/GraphQL API becomes available,
   creating precondition data (e.g., the partner in
   `partner-update.spec.js`) via API instead of the UI would make that
   test faster and decouple it from the create-flow's own correctness.
   The same API could delete test-created partners after each run,
   keeping the shared dev database clean - right now, test partners are
   left behind, mirroring the many pre-existing test-data rows already
   visible in the environment.
3. **Investigate why the account's UI-language preference doesn't persist
   across Playwright's cached storage state** - this is currently worked
   around (bilingual locators) rather than root-caused, and understanding
   it might simplify the locator strategy significantly.
4. **Visual/accessibility checks** (e.g. `axe-core` integration) on the
   Partner form, given its multiple custom form controls with unclear
   semantics for assistive tech.
5. **Cross-browser & mobile viewport projects** (Firefox/WebKit, and a
   narrow-viewport project) - currently scoped to desktop Chromium to
   match the assignment's time-box.
6. **Contract/negative test expansion**: invalid phone formats, an
   already-taken partner name, file-type/size validation on the Лого
   upload, and boundary values for text fields.
7. **Test data cleanup job**: a scheduled or teardown-hook process that
   removes partners matching the `QA E2E Partner *` naming convention,
   independent of individual test runs, so a suite run that crashes
   mid-way doesn't leave orphaned data.
8. **Parallelization tuning** once real timing data exists from CI runs -
   `workers` and `retries` in `playwright.config.js` are reasonable
   starting defaults, not measured values.