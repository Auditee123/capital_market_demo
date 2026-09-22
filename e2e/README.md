# OMS End-to-End Automation (Playwright + TypeScript)

A standalone test-automation suite for the Capital Markets OMS demo — it
drives the real REST API (`/api/v1/orders...`) and the real bundled web UI
(`public/index.html` + `app.js`), and cross-checks the two against each
other. It exists to close the coverage gaps identified in
[`../docs/USER_STORY-order-lifecycle.md`](../docs/USER_STORY-order-lifecycle.md):
that repo's `test/order.test.js` never sends an actual HTTP request, has no
test at all for a successful order lookup, and never exercises router-level
behavior (like cancel accepting `clientId` from either the query string or
the request body).

This folder is intentionally self-contained (its own `package.json`,
`node_modules`, `tsconfig.json`) so it can be lifted into its own repo later
without disentangling anything from the app it tests.

## Structure

```
e2e/
├── playwright.config.ts     projects, webServer (auto-starts the app), reporters
├── src/
│   ├── types/                TS types: Side/OrderType/OrderStatus, OrderResponse, ErrorResponse
│   ├── data/orderRequestBuilder.ts   builder for create-order payloads (valid + deliberately invalid)
│   ├── api/ordersApiClient.ts        typed wrapper over Playwright's APIRequestContext
│   ├── ui/OrderManagementPage.ts     Page Object for the app's single HTML page
│   └── fixtures/fixtures.ts          merged `ordersApi` + `orderPage` fixtures used by every spec
└── tests/
    ├── api/            create / get / cancel — pure HTTP, no browser
    │   ├── create-order.spec.ts        positive + negative
    │   ├── create-order.edge.spec.ts   edge cases only
    │   ├── get-order.spec.ts           positive + negative
    │   ├── get-order.edge.spec.ts      edge cases only
    │   ├── cancel-order.spec.ts        positive + negative
    │   └── cancel-order.edge.spec.ts   edge cases only
    ├── ui/             create / get / cancel — real browser, drives the form
    │   ├── create-order.spec.ts        positive + negative
    │   ├── create-order.edge.spec.ts   edge cases only
    │   ├── get-order.spec.ts           positive + negative (no edge cases identified)
    │   └── cancel-order.spec.ts        positive + negative (no edge cases identified)
    └── integration/    hybrid: API used to arrange state, UI (or vice versa) used to verify it
        └── cross-channel.spec.ts       (no edge cases — this suite itself IS the edge/cross-check layer)

Every `*.spec.ts` file holds positive + negative scenarios; a matching
`*.edge.spec.ts` file (where one exists) holds only that endpoint's edge
cases, so edge coverage is visible directly in the file tree instead of
nested inside a `describe` block.
```

## Running it

```bash
cd e2e
npm install
npx playwright install --with-deps chromium
npm test              # runs both the "api" and "chromium" projects
```

The `webServer` block in `playwright.config.ts` starts the app (`npm start`
from the repo root) automatically before the suite runs and shuts it down
after — there's no need to start the server by hand.

Other scripts:

```bash
npm run test:api           # API-only
npm run test:ui            # UI-only
npm run test:integration   # cross-channel specs only
npm run test:headed        # UI/integration specs, visible browser
npm run typecheck          # tsc --noEmit
npm run report             # opens the last HTML report
```

From the repo root, `npm run test:e2e` runs the whole suite without `cd`-ing
into this folder.

## A note on test data

Orders live in one shared in-memory `Map` on the one running server, with a
single global counter for order IDs. Tests never assert an *exact* order ID
or assume isolation between spec files — only relative behavior (e.g. two
IDs created back-to-back differ and increase), and each test creates its own
order(s) with a distinct `clientId` to stay independent of whatever else is
running in parallel.

## Scenario coverage

Full positive/negative/edge tables (with which unit test in
`test/order.test.js` already covered a case, if any) are in
[`../docs/USER_STORY-order-lifecycle.md`](../docs/USER_STORY-order-lifecycle.md).
Summary of what this suite adds on top of that:

| Area | What's covered |
| --- | --- |
| Create order (API) | Valid Limit/Market × Buy/Sell, price rounding, unique IDs, all validation failures (missing/invalid clientId, symbol, side, orderType, quantity, price), ignored client-supplied `orderId`, ignored price on Market orders, unknown extra fields, malformed JSON body |
| Get order (API) | Valid lookup (previously **zero** coverage anywhere), missing clientId, unknown order, wrong owner, case-sensitive lookup, unmapped-route behavior |
| Cancel order (API) | Valid cancel via query string **and** via body (the previously-untested router fallback), missing clientId, unknown order, wrong owner, already-cancelled, both-given-at-once precedence |
| UI | Full create/get/cancel flows through the real form, price-field enable/disable on order-type toggle, native required-field validation, server-side validation errors rendered in the result panel |
| Integration | API-create → UI-verify, UI-create → API-verify, API-cancel → UI shows already-cancelled, full UI→API→UI lifecycle, ownership enforced across channels |

### Known product gaps this suite documents (not just test gaps)

Two tests assert *today's actual behavior* rather than the ideal behavior,
so a future intentional fix shows up as a deliberate, visible test change
rather than a silent regression:

- `tests/api/create-order.spec.ts` — a malformed JSON body currently returns
  a generic `500 INTERNAL_ERROR` instead of a `400 VALIDATION_ERROR`.
- `tests/api/get-order.spec.ts` — an unmapped route returns Express's
  default HTML 404 page instead of the app's `{ code, message }` shape.

## CI

`.github/workflows/e2e.yml` (repo root) installs both the app's and this
folder's dependencies, installs the Chromium browser, runs `npm test` here,
and uploads the HTML report as a build artifact on every push/PR to `main`
or `develop`.

## Reusable prompt

If you need to regenerate or extend this kind of suite elsewhere in the
codebase, this is the prompt that produced it:

> Generate a production-ready test automation framework using Playwright
> and TypeScript for `<app or repo>`. Cover positive, negative, and edge
> scenarios for every API endpoint, every UI flow, and hybrid scenarios that
> exercise the API and UI together (e.g. create via one channel, verify via
> the other). Base the scenario list on `<the existing unit/manual test
> file(s) and any known coverage gaps>`, structure the suite with a Page
> Object layer for the UI, a typed API client layer, reusable fixtures, and
> a data builder for request payloads, and make the whole suite runnable
> with a single command (auto-start/stop the app under test). Document any
> case where the test asserts a real, current product bug rather than ideal
> behavior, so a later fix is a visible, deliberate change.
