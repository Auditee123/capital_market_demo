# Capital Markets Order Management Service (OMS)

A small REST-based Equity Order Management Service. A client can create an
order, view an order, and cancel an order. This is a **development
codebase only** — there is no real exchange, broker, market-data feed,
database, message queue, or authentication system.

## What it does

- `POST /api/v1/orders` — create an order (`MARKET` or `LIMIT`, `BUY` or `SELL`)
- `GET /api/v1/orders/{orderId}` — view an order
- `POST /api/v1/orders/{orderId}/cancel` — cancel a `NEW` order

Orders are held in an in-memory `Map` and are lost when the process
restarts. A single-page HTML/CSS/vanilla-JS frontend calls the REST API via
`fetch` so the flow can be exercised in a browser.

## Architecture

```
Frontend (HTML/CSS/JS, fetch calls)
        |
        v
Express Router (Controller layer)        src/routes/orderRoutes.js
        |
        v
Service layer (business rules)           src/services/OrderService.js
        |
        v
Order Model (owns lifecycle behavior)    src/domain/Order.js
        |
        v
In-Memory Repository (JS Map)            src/repository/OrderRepository.js
```

Routes only parse the request and shape the HTTP response — they never
mutate order state directly. The service layer orchestrates use cases and
enforces client ownership. The `Order` domain class owns its own lifecycle
(`order.cancel()`) and validates itself on construction. Errors are
centralized through an Express error-handling middleware
(`src/errors/errorHandler.js`) so every failure returns a consistent
`{ code, message }` body without leaking stack traces.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for a fuller diagram of
the request flow and error-handling path, plus a walkthrough of a full
cancel-order request.

## Project structure

```
oms/
├── server.js
├── src/
│   ├── routes/orderRoutes.js
│   ├── services/OrderService.js
│   ├── domain/Order.js, constants.js
│   ├── repository/OrderRepository.js
│   └── errors/AppError.js, errorHandler.js
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── test/
    └── order.test.js
```

## How to run

```bash
npm install
npm start
```

The server listens on `http://localhost:3000` (override with `PORT`). Open
that URL in a browser to use the frontend, or call the API directly.

## How to run tests

```bash
npm test
```

Runs a small suite with Node's built-in `node:test` runner covering: a
valid `LIMIT` order, invalid quantity, a `LIMIT` order missing a price, a
valid `MARKET` order, successful cancellation, cancelling an
already-cancelled order, and client-ownership enforcement. These are
developer-level tests for this codebase, not a QA automation framework.

## Example API calls

Create an order:

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "CLIENT001",
    "symbol": "AAPL",
    "side": "BUY",
    "orderType": "LIMIT",
    "quantity": 100,
    "price": 225.50
  }'
```

Retrieve an order (client must own it):

```bash
curl "http://localhost:3000/api/v1/orders/ORD-10001?clientId=CLIENT001"
```

Cancel an order:

```bash
curl -X POST "http://localhost:3000/api/v1/orders/ORD-10001/cancel?clientId=CLIENT001"
```

Errors follow one shape, e.g. cancelling an already-cancelled order (409):

```json
{
  "code": "ORDER_ALREADY_CANCELLED",
  "message": "Order ORD-10001 has already been cancelled"
}
```

## Business rules

1. Quantity must be greater than zero.
2. A `LIMIT` order must contain a price greater than zero.
3. A `MARKET` order must not require a price.
4. Only an order with status `NEW` can be cancelled; an already-cancelled
   order cannot be cancelled again.
5. Every created order gets a unique, generated order ID.
6. A client can retrieve or cancel only its own orders, identified by a
   `clientId` request parameter (no authentication in this scope).

## Scope and limitations

This is intentionally small and is **not** a complete trading platform.
It does not include:

- Exchange or broker connectivity, or order execution
- Real-time market data
- Authentication or user login
- Persistence (all state is in-memory and reset on restart)
- Risk management, position keeping, or reporting
- A test automation framework (a separate team owns that codebase; `test/`
  here holds only minimal developer tests for this code)
