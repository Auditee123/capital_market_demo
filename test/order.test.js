const test = require('node:test');
const assert = require('node:assert/strict');

const OrderRepository = require('../src/repository/OrderRepository');
const OrderService = require('../src/services/OrderService');
const { OrderAlreadyCancelledError, ValidationError, ForbiddenError } = require('../src/errors/AppError');

function createService() {
  return new OrderService(new OrderRepository());
}

test('creates a valid LIMIT order', () => {
  const service = createService();
  const order = service.createOrder({
    clientId: 'CLIENT001',
    symbol: 'AAPL',
    side: 'BUY',
    orderType: 'LIMIT',
    quantity: 100,
    price: 225.5,
  });

  assert.equal(order.status, 'NEW');
  assert.equal(order.price, 225.5);
  assert.match(order.orderId, /^ORD-\d+$/);
});

test('rejects an order with invalid quantity', () => {
  const service = createService();
  assert.throws(
    () => service.createOrder({
      clientId: 'CLIENT001',
      symbol: 'AAPL',
      side: 'BUY',
      orderType: 'MARKET',
      quantity: 0,
    }),
    ValidationError,
  );
});

test('rejects a LIMIT order without a price', () => {
  const service = createService();
  assert.throws(
    () => service.createOrder({
      clientId: 'CLIENT001',
      symbol: 'AAPL',
      side: 'SELL',
      orderType: 'LIMIT',
      quantity: 10,
    }),
    ValidationError,
  );
});

test('creates a valid MARKET order without a price', () => {
  const service = createService();
  const order = service.createOrder({
    clientId: 'CLIENT001',
    symbol: 'MSFT',
    side: 'BUY',
    orderType: 'MARKET',
    quantity: 50,
  });

  assert.equal(order.price, null);
  assert.equal(order.status, 'NEW');
});

test('cancels a NEW order successfully', () => {
  const service = createService();
  const order = service.createOrder({
    clientId: 'CLIENT001',
    symbol: 'AAPL',
    side: 'BUY',
    orderType: 'MARKET',
    quantity: 10,
  });

  const cancelled = service.cancelOrder(order.orderId, 'CLIENT001');
  assert.equal(cancelled.status, 'CANCELLED');
});

test('rejects cancelling an already cancelled order', () => {
  const service = createService();
  const order = service.createOrder({
    clientId: 'CLIENT001',
    symbol: 'AAPL',
    side: 'BUY',
    orderType: 'MARKET',
    quantity: 10,
  });

  service.cancelOrder(order.orderId, 'CLIENT001');
  assert.throws(
    () => service.cancelOrder(order.orderId, 'CLIENT001'),
    OrderAlreadyCancelledError,
  );
});

test('enforces client ownership on get and cancel', () => {
  const service = createService();
  const order = service.createOrder({
    clientId: 'CLIENT001',
    symbol: 'AAPL',
    side: 'BUY',
    orderType: 'MARKET',
    quantity: 10,
  });

  assert.throws(() => service.getOrder(order.orderId, 'CLIENT002'), ForbiddenError);
  assert.throws(() => service.cancelOrder(order.orderId, 'CLIENT002'), ForbiddenError);
});
