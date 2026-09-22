const Side = Object.freeze({
  BUY: 'BUY',
  SELL: 'SELL',
});

const OrderType = Object.freeze({
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
});

const OrderStatus = Object.freeze({
  NEW: 'NEW',
  CANCELLED: 'CANCELLED',
});

module.exports = { Side, OrderType, OrderStatus };
