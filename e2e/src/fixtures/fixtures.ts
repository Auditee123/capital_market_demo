import { test as base } from '@playwright/test';
import { OrdersApiClient } from '../api/ordersApiClient';
import { OrderManagementPage } from '../ui/OrderManagementPage';

interface Fixtures {
  ordersApi: OrdersApiClient;
  orderPage: OrderManagementPage;
}

/**
 * Single merged fixture set used by every spec (api / ui / integration).
 * A fixture is only instantiated if a test actually asks for it, so api-only
 * specs never spin up a page and ui-only specs never touch `orderPage` unless
 * they want it for fast API-based setup.
 */
export const test = base.extend<Fixtures>({
  ordersApi: async ({ request }, use) => {
    await use(new OrdersApiClient(request));
  },

  orderPage: async ({ page }, use) => {
    const orderPage = new OrderManagementPage(page);
    await orderPage.goto();
    await use(orderPage);
  },
});

export { expect } from '@playwright/test';
