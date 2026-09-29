const express = require('express');
const { ValidationError } = require('../errors/AppError');

function requireClientId(clientId) {
  if (!clientId || typeof clientId !== 'string') {
    throw new ValidationError('clientId is required');
  }
  return clientId;
}

// Routes are thin controllers: they parse the request, delegate to the
// service layer for business rules, and shape the HTTP response.
function createOrderRouter(orderService) {
  const router = express.Router();

  router.post('/orders', (req, res, next) => {
    try {
      const order = orderService.createOrder(req.body || {});
      res.status(201).json(order.toJSON());
    } catch (err) {
      next(err);
    }
  });

  router.get('/orders/:orderId', (req, res, next) => {
    try {
      const clientId = requireClientId(req.query.clientId);
      const order = orderService.getOrder(req.params.orderId, clientId);
      res.status(200).json(order.toJSON());
    } catch (err) {
      next(err);
    }
  });

  router.post('/orders/:orderId/cancel', (req, res, next) => {
    try {
      const clientId = requireClientId(req.query.clientId || (req.body && req.body.clientId));
      const order = orderService.cancelOrder(req.params.orderId, clientId);
      res.status(200).json(order.toJSON());
    } catch (err) {
      next(err);
    }
  });

  router.post('/orders/:orderId/modify', (req, res, next) => {
    try {
      const clientId = requireClientId(req.query.clientId || (req.body && req.body.clientId));
      const { quantity } = req.body || {};
      const order = orderService.modifyOrderQuantity(req.params.orderId, clientId, quantity);
      res.status(200).json(order.toJSON());
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createOrderRouter;
