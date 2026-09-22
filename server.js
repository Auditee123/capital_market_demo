const path = require('path');
const express = require('express');

const OrderRepository = require('./src/repository/OrderRepository');
const OrderService = require('./src/services/OrderService');
const createOrderRouter = require('./src/routes/orderRoutes');
const errorHandler = require('./src/errors/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const orderRepository = new OrderRepository();
const orderService = new OrderService(orderRepository);

app.use('/api/v1', createOrderRouter(orderService));

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`OMS server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
