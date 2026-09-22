// In-memory repository backed by a JS Map. Node's single-threaded event
// loop means no explicit locking is required for this scope.
class OrderRepository {
  constructor() {
    this.orders = new Map();
  }

  save(order) {
    this.orders.set(order.orderId, order);
    return order;
  }

  findById(orderId) {
    return this.orders.get(orderId);
  }
}

module.exports = OrderRepository;
