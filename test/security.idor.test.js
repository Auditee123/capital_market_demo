const test = require('node:test');
const assert = require('node:assert/strict');

const OrderRepository = require('../src/repository/OrderRepository');
const OrderService = require('../src/services/OrderService');

// Proof-of-concept for SECURITY_FINDINGS.md Finding 1 (Broken access control / IDOR).
//
// This test does NOT weaken the app. It documents existing behavior: authorization
// relies solely on a self-asserted `clientId` string with no authentication. Anyone
// who learns a victim's clientId (passed in plaintext on every request, and guessable
// alongside sequential order IDs) gains full read/cancel access to that client's orders.
//
// It is written to PASS against the current code, so the failing *security posture* is
// visible and runnable rather than hypothetical.
function createService() {
  return new OrderService(new OrderRepository());
}

test('IDOR: knowing a victim clientId grants full access (no real auth)', () => {
  const service = createService();

  // Victim creates an order.
  const victimOrder = service.createOrder({
    clientId: 'VICTIM-001',
    symbol: 'AAPL',
    side: 'BUY',
    orderType: 'MARKET',
    quantity: 10,
  });

  // Attacker learns the victim's clientId (not a secret) and the sequential order ID.
  const stolenClientId = 'VICTIM-001';

  // Finding: the "ownership" check is satisfied by merely asserting the victim's id.
  const read = service.getOrder(victimOrder.orderId, stolenClientId);
  assert.equal(read.orderId, victimOrder.orderId, 'attacker reads victim order unimpeded');

  const cancelled = service.cancelOrder(victimOrder.orderId, stolenClientId);
  assert.equal(cancelled.status, 'CANCELLED', 'attacker cancels victim order unimpeded');
});
