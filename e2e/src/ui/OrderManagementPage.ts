import { type Locator, type Page, expect } from '@playwright/test';

export interface CreateOrderFormFields {
  clientId?: string;
  symbol?: string;
  side?: 'BUY' | 'SELL';
  orderType?: 'LIMIT' | 'MARKET';
  quantity?: string;
  price?: string;
}

export interface ViewOrderFormFields {
  orderId?: string;
  clientId?: string;
}

/**
 * Page Object for the single-page app in public/index.html + public/app.js.
 * Each action waits for the matching network response and confirms the result
 * panel rendered it exactly (the app does `JSON.stringify(data, null, 2)`),
 * so a test gets both the real API payload and proof the UI displayed it
 * faithfully. Return type is intentionally `any`: the payload can be a
 * success (OrderResponse) or an error ({ code, message }) shape.
 */
export class OrderManagementPage {
  readonly page: Page;

  readonly clientIdInput: Locator;
  readonly symbolInput: Locator;
  readonly sideSelect: Locator;
  readonly orderTypeSelect: Locator;
  readonly quantityInput: Locator;
  readonly priceInput: Locator;
  readonly createOrderButton: Locator;

  readonly viewOrderIdInput: Locator;
  readonly viewClientIdInput: Locator;
  readonly getOrderButton: Locator;
  readonly cancelOrderButton: Locator;

  readonly resultPanel: Locator;

  constructor(page: Page) {
    this.page = page;

    this.clientIdInput = page.locator('#create-clientId');
    this.symbolInput = page.locator('#create-symbol');
    this.sideSelect = page.locator('#create-side');
    this.orderTypeSelect = page.locator('#create-orderType');
    this.quantityInput = page.locator('#create-quantity');
    this.priceInput = page.locator('#create-price');
    this.createOrderButton = page.locator('#create-form button[type="submit"]');

    this.viewOrderIdInput = page.locator('#order-orderId');
    this.viewClientIdInput = page.locator('#order-clientId');
    this.getOrderButton = page.locator('#view-form button[type="submit"]');
    this.cancelOrderButton = page.locator('#cancel-btn');

    this.resultPanel = page.locator('#result');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async fillCreateForm(fields: CreateOrderFormFields): Promise<void> {
    if (fields.clientId !== undefined) await this.clientIdInput.fill(fields.clientId);
    if (fields.symbol !== undefined) await this.symbolInput.fill(fields.symbol);
    if (fields.side !== undefined) await this.sideSelect.selectOption(fields.side);
    if (fields.orderType !== undefined) await this.orderTypeSelect.selectOption(fields.orderType);
    if (fields.quantity !== undefined) await this.quantityInput.fill(fields.quantity);
    if (fields.price !== undefined) await this.priceInput.fill(fields.price);
  }

  async fillViewForm(fields: ViewOrderFormFields): Promise<void> {
    if (fields.orderId !== undefined) await this.viewOrderIdInput.fill(fields.orderId);
    if (fields.clientId !== undefined) await this.viewClientIdInput.fill(fields.clientId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createOrder(fields: CreateOrderFormFields): Promise<any> {
    return this.submitAndCapture(
      async () => {
        await this.fillCreateForm(fields);
        await this.createOrderButton.click();
      },
      (url, method) => method === 'POST' && new URL(url).pathname === '/api/v1/orders',
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOrder(fields: Required<ViewOrderFormFields>): Promise<any> {
    return this.submitAndCapture(
      async () => {
        await this.fillViewForm(fields);
        await this.getOrderButton.click();
      },
      (url, method) => method === 'GET' && /^\/api\/v1\/orders\/[^/]+$/.test(new URL(url).pathname),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async cancelOrder(fields?: ViewOrderFormFields): Promise<any> {
    return this.submitAndCapture(
      async () => {
        if (fields) await this.fillViewForm(fields);
        await this.cancelOrderButton.click();
      },
      (url, method) => method === 'POST' && /^\/api\/v1\/orders\/[^/]+\/cancel$/.test(new URL(url).pathname),
    );
  }

  /** Reads whatever is currently in the result panel without triggering any action. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async currentResult(): Promise<any> {
    const text = await this.resultPanel.textContent();
    return JSON.parse(text ?? '{}');
  }

  private async submitAndCapture(
    action: () => Promise<void>,
    matches: (url: string, method: string) => boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const [response] = await Promise.all([
      this.page.waitForResponse((res) => matches(res.url(), res.request().method())),
      action(),
    ]);
    const data = await response.json();
    await expect(this.resultPanel).toHaveText(JSON.stringify(data, null, 2));
    return data;
  }
}
