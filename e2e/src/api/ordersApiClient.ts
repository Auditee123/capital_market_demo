import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { OrderPayload } from '../types/order.types';

const ORDERS_PATH = '/api/v1/orders';

export interface CancelOptions {
  queryClientId?: string;
  bodyClientId?: string;
}

/** Thin typed wrapper over Playwright's APIRequestContext for the three OMS endpoints. */
export class OrdersApiClient {
  constructor(private readonly request: APIRequestContext) {}

  create(payload: OrderPayload): Promise<APIResponse> {
    return this.request.post(ORDERS_PATH, { data: payload });
  }

  /** Sends a raw, possibly-invalid JSON string body — for malformed-request edge cases. */
  createRaw(rawBody: string): Promise<APIResponse> {
    return this.request.post(ORDERS_PATH, {
      data: rawBody,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  get(orderId: string, clientId?: string): Promise<APIResponse> {
    const query = clientId !== undefined ? `?clientId=${encodeURIComponent(clientId)}` : '';
    return this.request.get(`${ORDERS_PATH}/${encodeURIComponent(orderId)}${query}`);
  }

  cancel(orderId: string, options: CancelOptions = {}): Promise<APIResponse> {
    const { queryClientId, bodyClientId } = options;
    const query = queryClientId !== undefined ? `?clientId=${encodeURIComponent(queryClientId)}` : '';
    const requestOptions = bodyClientId !== undefined ? { data: { clientId: bodyClientId } } : {};
    return this.request.post(`${ORDERS_PATH}/${encodeURIComponent(orderId)}/cancel${query}`, requestOptions);
  }
}
