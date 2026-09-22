class AppError extends Error {
  constructor(code, message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super('VALIDATION_ERROR', message, 400);
  }
}

class OrderNotFoundError extends AppError {
  constructor(orderId) {
    super('ORDER_NOT_FOUND', `Order ${orderId} was not found`, 404);
  }
}

class ForbiddenError extends AppError {
  constructor(orderId) {
    super('FORBIDDEN', `Order ${orderId} does not belong to this client`, 403);
  }
}

class OrderAlreadyCancelledError extends AppError {
  constructor(orderId) {
    super('ORDER_ALREADY_CANCELLED', `Order ${orderId} has already been cancelled`, 409);
  }
}

class OrderNotModifiableError extends AppError {
  constructor(orderId) {
    super('ORDER_NOT_MODIFIABLE', `Order ${orderId} cannot be modified because it is not in NEW status`, 409);
  }
}

module.exports = {
  AppError,
  ValidationError,
  OrderNotFoundError,
  ForbiddenError,
  OrderAlreadyCancelledError,
  OrderNotModifiableError,
};
