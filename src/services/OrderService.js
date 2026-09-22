const Order = require('../domain/Order');
const { OrderNotFoundError, ForbiddenError } = require('../errors/AppError');

const ORDER_ID_START = 10001;

class OrderService {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
    this.nextOrderSequence = ORDER_ID_START;
  }

  // Rule 5: Generate a unique order ID when an order is created.
  generateOrderId() {
    const orderId = `ORD-${this.nextOrderSequence}`;
    this.nextOrderSequence += 1;
    return orderId;
  }

  createOrder({ clientId, symbol, side, orderType, quantity, price }) {
    const orderId = this.generateOrderId();
    const order = new Order({ orderId, clientId, symbol, side, orderType, quantity, price });
    return this.orderRepository.save(order);
  }

  getOrder(orderId, clientId) {
    return this.findOwnedOrder(orderId, clientId);
  }

  cancelOrder(orderId, clientId) {
    const order = this.findOwnedOrder(orderId, clientId);
    order.cancel();
    return this.orderRepository.save(order);
  }

  // Rule 6: A client can retrieve or cancel only its own orders.
  findOwnedOrder(orderId, clientId) {
    const order = this.orderRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    if (order.clientId !== clientId) {
      throw new ForbiddenError(orderId);
    }
    return order;
  }
}

module.exports = OrderService;
