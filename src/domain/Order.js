const { Side, OrderType, OrderStatus } = require('./constants');
const { ValidationError, OrderAlreadyCancelledError } = require('../errors/AppError');

// Rounds to 2 decimal places to keep money values consistent instead of
// relying on raw floating-point arithmetic.
function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

class Order {
  constructor({ orderId, clientId, symbol, side, orderType, quantity, price }) {
    Order.validate({ clientId, symbol, side, orderType, quantity, price });

    const now = new Date().toISOString();
    this.orderId = orderId;
    this.clientId = clientId;
    this.symbol = symbol;
    this.side = side;
    this.orderType = orderType;
    this.quantity = quantity;
    this.price = orderType === OrderType.LIMIT ? roundMoney(price) : null;
    this.status = OrderStatus.NEW;
    this.createdAt = now;
    this.updatedAt = now;
  }

  static validate({ clientId, symbol, side, orderType, quantity, price }) {
    if (!clientId || typeof clientId !== 'string') {
      throw new ValidationError('clientId is required');
    }
    if (!symbol || typeof symbol !== 'string') {
      throw new ValidationError('symbol is required');
    }
    if (!Object.values(Side).includes(side)) {
      throw new ValidationError(`side must be one of ${Object.values(Side).join(', ')}`);
    }
    if (!Object.values(OrderType).includes(orderType)) {
      throw new ValidationError(`orderType must be one of ${Object.values(OrderType).join(', ')}`);
    }
    // Rule 1: Quantity must be greater than zero.
    if (typeof quantity !== 'number' || Number.isNaN(quantity) || quantity <= 0) {
      throw new ValidationError('quantity must be greater than zero');
    }
    // Rule 2: A LIMIT order must contain a price greater than zero.
    if (orderType === OrderType.LIMIT) {
      if (typeof price !== 'number' || Number.isNaN(price) || price <= 0) {
        throw new ValidationError('price must be greater than zero for a LIMIT order');
      }
    }
    // Rule 3: A MARKET order must not require a price (any supplied price is ignored).
  }

  // Rule 4: Only an order with status NEW can be cancelled.
  cancel() {
    if (this.status === OrderStatus.CANCELLED) {
      throw new OrderAlreadyCancelledError(this.orderId);
    }
    this.status = OrderStatus.CANCELLED;
    this.updatedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      orderId: this.orderId,
      clientId: this.clientId,
      symbol: this.symbol,
      side: this.side,
      orderType: this.orderType,
      quantity: this.quantity,
      price: this.price,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Order;
