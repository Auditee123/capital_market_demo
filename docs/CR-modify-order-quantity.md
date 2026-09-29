# Change Request & User Story — Modify Quantity on an Existing NEW Equity Order

## ARTIFACT 1 — CHANGE REQUEST

### 1. Change Request Title
Allow Quantity Modification of an Existing NEW Equity Order

### 2. Business Requirement
Traders occasionally need to correct or adjust the quantity on an order they've just placed — before it has been cancelled — without losing the original order record. Today, the only way to change a quantity is to cancel the order and submit a brand-new one, which changes the order ID and breaks continuity for the client and for downstream tracking. This change adds a simple, controlled way to update the quantity on an order that is still in NEW status. It affects the existing Order Management Service's order lifecycle and the Create/View/Cancel APIs' surrounding service layer, but does not change how orders are created, viewed, or cancelled today.

### 3. Current Behavior
- Once an order is created, its quantity (and all other fields) cannot be changed.
- The only state transition available is NEW → CANCELLED, via the cancel API.
- To effectively "change" a quantity, a client must cancel the existing NEW order and create a new order, which generates a new `orderId` and discards the original order's identity.

### 4. Expected Behavior
- A client can request a quantity change on an order they own, as long as that order is still in NEW status.
- If the request is valid, the order's quantity is updated in place, its `updatedAt` timestamp is refreshed, and the `orderId` and all other order attributes remain unchanged.
- If the order is not in NEW status (i.e., it is CANCELLED), the request is rejected.
- If the requesting client does not own the order, or the order does not exist, the request is rejected using the same ownership/not-found behavior already used by View and Cancel.

### 5. Business Rules
- Only an existing order can be modified.
- Only orders in NEW status can be modified.
- The client can modify the order quantity.
- Quantity must be greater than zero.
- The requesting client must own the order.
- A CANCELLED order cannot be modified.
- Other order attributes (symbol, side, orderType, price, clientId, orderId, createdAt, status) must remain unchanged.

### 6. Impacted Functionality
- **Order domain (`Order.js`)** — needs a method to update quantity and re-validate it, plus refresh `updatedAt`.
- **Order service (`OrderService.js`)** — needs a new operation that reuses `findOwnedOrder` for ownership/existence checks, then applies the quantity change.
- **Order routes (`orderRoutes.js`)** — needs a new route to accept a modify-quantity request.
- **Error handling** — needs one new business error for "order not in a modifiable state," following the existing `AppError` pattern.
- Create, View, and Cancel APIs are not changed.

### 7. Out of Scope
- No exchange or market integration.
- No database/persistence migration (repository remains in-memory).
- No UI changes.
- No authentication/authorization changes beyond existing clientId ownership checks.
- No new order types or order statuses.
- No order execution or fill functionality.
- No messaging/event infrastructure.
- No modification of any field other than quantity (symbol, side, orderType, price are not modifiable in this change).

### 8. Acceptance Summary
- A client can successfully update the quantity of their own NEW order.
- Invalid quantities (zero, negative, non-numeric) are rejected.
- Attempts to modify a CANCELLED order are rejected.
- Attempts to modify another client's order are rejected.
- Attempts to modify a non-existent order are rejected.
- All order attributes other than quantity and `updatedAt` remain unchanged after a successful modification.
- Existing Create, View, and Cancel behavior is unaffected.

---

## ARTIFACT 2 — PRODUCTION-READY USER STORY

### 1. Story Title
Modify Quantity on an Existing NEW Equity Order

### 2. User Story
As a client who owns an equity order, I want to modify the quantity of my existing order while it is still in NEW status, so that I can correct or adjust my order without cancelling it and losing its order identity.

### 3. Business Context
Clients currently have no way to fix a quantity mistake or adjust size on an order that hasn't been cancelled, other than cancelling and re-submitting a new order under a new order ID. This breaks continuity and creates unnecessary noise (an extra cancelled order plus a new order) for what is often a simple correction. Allowing an in-place quantity update on NEW orders keeps the existing lifecycle simple while closing a real gap in the current Create/View/Cancel capability set.

### 4. Acceptance Criteria

**AC1 — Successful modification of a NEW order**
- Given a NEW order owned by client `C1` with quantity 100
- When `C1` requests a quantity modification to 150
- Then the order's quantity is updated to 150, `updatedAt` is refreshed, and the response returns HTTP 200 with the updated order

**AC2 — Modification with an invalid quantity**
- Given a NEW order owned by client `C1`
- When `C1` requests a quantity modification to 0, a negative number, or a non-numeric value
- Then the request is rejected with HTTP 400 and error code `VALIDATION_ERROR`, and the order's quantity is unchanged

**AC3 — Attempt to modify a CANCELLED order**
- Given an order owned by client `C1` that is already CANCELLED
- When `C1` requests a quantity modification
- Then the request is rejected with HTTP 409 and error code `ORDER_NOT_MODIFIABLE`, and the order is unchanged

**AC4 — Attempt by a different client to modify the order**
- Given a NEW order owned by client `C1`
- When client `C2` requests a quantity modification on that order
- Then the request is rejected with HTTP 403 and error code `FORBIDDEN`, and the order is unchanged

**AC5 — Attempt to modify a non-existent order**
- Given no order exists with ID `ORD-99999`
- When a client requests a quantity modification on `ORD-99999`
- Then the request is rejected with HTTP 404 and error code `ORDER_NOT_FOUND`

**AC6 — Unchanged attributes after successful modification**
- Given a NEW order with a known symbol, side, orderType, price, clientId, orderId, and createdAt
- When the quantity is successfully modified
- Then symbol, side, orderType, price, clientId, orderId, status, and createdAt are all identical to their pre-modification values, and only quantity and updatedAt differ

### 5. Business Rules
- Only an existing order can be modified.
- Only orders in NEW status can be modified.
- Only the order's quantity can be modified.
- Quantity must be greater than zero (same rule as order creation).
- The requesting client must own the order.
- A CANCELLED order cannot be modified.
- All other order attributes remain unchanged.

### 6. API / Functional Expectation
Extend the existing Order API with a new operation to modify an order's quantity, following the same pattern as the existing Cancel endpoint (`POST /api/v1/orders/:orderId/cancel`):
- The request identifies the order by `orderId` (path) and the requesting `clientId` (same convention as View/Cancel), plus the new quantity in the request body.
- The service layer performs the same ownership/existence lookup already used by View and Cancel (`findOwnedOrder`), then checks order status is NEW, then validates and applies the new quantity.
- The response returns the full updated order representation, in the same shape currently returned by Create/View/Cancel (`toJSON()`).
- No changes to the existing Create, View, or Cancel endpoints' request or response contracts.

### 7. Data Expectations
- **Input fields:** `orderId` (path parameter), `clientId` (identifies requester, same convention as existing endpoints), `quantity` (new value, request body).
- **Fields that can change:** `quantity`, `updatedAt`.
- **Fields that must remain unchanged:** `orderId`, `clientId`, `symbol`, `side`, `orderType`, `price`, `status`, `createdAt`.
- **Response:** the full updated order object (same shape as Create/View/Cancel responses), reflecting the new quantity and refreshed `updatedAt`.

### 8. Error Scenarios
| Condition | HTTP Status | Error Code | Message (example) |
|---|---|---|---|
| Missing/invalid `clientId` | 400 | `VALIDATION_ERROR` | "clientId is required" |
| Quantity missing, ≤ 0, or non-numeric | 400 | `VALIDATION_ERROR` | "quantity must be greater than zero" |
| Order does not exist | 404 | `ORDER_NOT_FOUND` | "Order {orderId} was not found" |
| Order belongs to a different client | 403 | `FORBIDDEN` | "Order {orderId} does not belong to this client" |
| Order is not in NEW status (e.g., CANCELLED) | 409 | `ORDER_NOT_MODIFIABLE` | "Order {orderId} cannot be modified because it is not in NEW status" |

### 9. Non-Functional Expectations
- Existing Create, View, and Cancel APIs must continue to work exactly as they do today — no regression.
- Existing validation and ownership-check behavior must remain intact and be reused (not duplicated) for this new operation.
- The change must be backward compatible: no existing response shapes or fields change.

### 10. Out of Scope
- No exchange or market integration.
- No database/persistence migration.
- No UI changes.
- No authentication/authorization model changes.
- No new order types or order statuses.
- No order execution or fill functionality.
- No messaging/event infrastructure.
- No modification of fields other than quantity.
- No modification history/audit trail or versioning of past quantities.

### 11. Definition of Done
- Quantity modification capability implemented per the business rules above.
- All acceptance criteria (AC1–AC6) pass.
- Existing Create, View, and Cancel functionality verified with no regression.
- Developer tests added/updated for the new behavior (unit tests at minimum for the domain and service layers).
- Acceptance criteria independently validated by QA/test automation.
- Code review completed.
- API documentation (if maintained) updated to reflect the new endpoint/behavior.
