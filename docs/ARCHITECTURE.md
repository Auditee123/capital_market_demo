# Equity Order Management Service — Architecture

A layered REST service: every request is parsed by a thin controller,
routed through a service that enforces client ownership, validated and
mutated by an `Order` domain object that owns its own lifecycle, and
persisted to an in-memory map. Any rule violation is funneled to one
centralized error handler instead of being checked ad hoc at each layer.

## Request flow and error handling

![Block diagram of the OMS request pipeline and centralized error handling](architecture-diagram.svg)

The same diagram as an editable Mermaid flowchart (renders on GitHub/GitLab/VS Code if the image above doesn't load in your viewer):

```mermaid
flowchart TD
    subgraph Pipeline["Request pipeline"]
        A["Browser<br/>public/ — index.html + app.js"]
        B["Express app<br/>server.js"]
        C["Router (controller)<br/>src/routes/orderRoutes.js"]
        D["OrderService<br/>src/services/OrderService.js"]
        E["Order (domain)<br/>src/domain/Order.js"]
        F["OrderRepository<br/>src/repository/OrderRepository.js<br/>Map&lt;orderId, Order&gt;"]

        A -->|"HTTP JSON — fetch()"| B
        B -->|"mounts router at /api/v1"| C
        C -->|"createOrder / getOrder / cancelOrder"| D
        D -->|"new Order(...) / order.cancel()"| E
        E -->|"save(order)"| F
    end

    subgraph ErrorHandling["Centralized error handling"]
        G["AppError subclasses<br/>src/errors/AppError.js<br/>ValidationError · OrderNotFoundError<br/>ForbiddenError · OrderAlreadyCancelledError"]
        H["errorHandler middleware<br/>src/errors/errorHandler.js<br/>maps to { code, message } + status"]
        G -->|"next(err)"| H
    end

    C -.->|"throw ValidationError (missing clientId)"| G
    D -.->|"throw NotFound / Forbidden (Rule 6)"| G
    E -.->|"throw Validation (Rules 1–2) /<br/>AlreadyCancelled (Rule 4)"| G
    H -->|"status + { code, message }"| B

    classDef domain fill:#eef2ff,stroke:#1d4ed8,stroke-width:1.5px;
    classDef error fill:#fbeae9,stroke:#b3261e,stroke-width:1.5px;
    class E domain;
    class G,H error;
```

Solid arrows trace the happy path: browser → Express → router → service →
domain → repository, one function call per hop. Dashed arrows show where
each of the three inner layers throws a typed `AppError`; every one is
caught by the single Express error-handling middleware, which is the only
place that writes an error response.

## Walking a request: cancel an order

1. `app.js` sends `POST /api/v1/orders/ORD-10001/cancel?clientId=CLIENT001`.
2. Express matches the route and hands off to the router; no body parsing
   is needed for this call.
3. The router reads `clientId` from the query string and calls
   `orderService.cancelOrder(orderId, clientId)` — it does not touch the
   order itself.
4. `OrderService` looks the order up by ID. Not found → throws
   `OrderNotFoundError`. Found but owned by another client → throws
   `ForbiddenError` (Rule 6).
5. Ownership checks out, so the service calls `order.cancel()` on the
   domain object. If the order is already `CANCELLED`, the *domain object
   itself* throws `OrderAlreadyCancelledError` (Rule 4) — the service
   never re-implements that check.
6. On success, the service saves the mutated order back through
   `OrderRepository`, and the router returns `200` with the updated
   order. On any thrown `AppError`, `next(err)` hands it to
   `errorHandler`, which returns the matching status and
   `{ code, message }` instead.

## Layer responsibilities

| Layer                | Owns                                          |
| --------------------- | ---------------------------------------------- |
| Router                 | HTTP parsing & response shape only            |
| Service                | Order ID generation, client ownership         |
| Domain (`Order`)       | Field validation, lifecycle (`cancel()`)      |
| Repository              | Storage — a plain `Map`                       |

## Business rules

1. Quantity must be greater than zero.
2. A `LIMIT` order requires a price greater than zero.
3. A `MARKET` order must not require a price.
4. Only a `NEW` order can be cancelled.
5. Order IDs are generated and always unique.
6. A client can retrieve or cancel only its own orders.

---

In-memory only — no exchange, broker, market data, database, or auth. See
[`README.md`](../README.md) for how to run the service and full API
examples.
