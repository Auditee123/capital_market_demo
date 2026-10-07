# Security Posture Findings — Capital Markets Order Management Service

> Honest posture report. These are **real findings in the existing code**, verified by
> first-hand read with file:line evidence. No vulnerabilities were introduced to produce
> this report — each item already exists in the codebase.

## Context

This service is a Node.js/Express demo with three endpoints (create / get / cancel order),
an in-memory store, and a static frontend. **There is no LLM/AI component.** Any security
scanner reporting "All Green" on prompt-injection, PII-redaction, or schema-tamper controls
is reporting *absence of attack surface and absence of tests*, not demonstrated defenses.

---

## Finding 1 — Broken access control / IDOR (High)

**`src/services/OrderService.js:41`, `src/routes/orderRoutes.js:27,37`**

Order ownership is enforced only by comparing a client-supplied `clientId` string:

```js
// OrderService.js:41
if (order.clientId !== clientId) { throw new ForbiddenError(orderId); }
```

`clientId` arrives directly from the request with no authentication (`orderRoutes.js:27`),
and `requireClientId` only checks it is a non-empty string. There is no secret, token, or
session — `clientId` is both the identity claim and the only authorization check. Because
order IDs are sequential (`ORD-10001`, `ORD-10002`, … from `OrderService.js:4`), anyone who
knows or guesses another client's ID can read or cancel that client's orders.

> Note: the README documents "no auth" as intentional for the demo. An eval scoring this
> green is still wrong — it should flag it.

## Finding 2 — No input format constraints on identifiers (Medium)

**`src/routes/orderRoutes.js:4-9`, `src/domain/Order.js` (`validate`)**

`clientId` and `symbol` accept any non-empty string — no length cap, no charset allowlist,
no format validation — then are stored verbatim and echoed back via `Order.toJSON()`.

## Finding 3 — Unredacted server-side error logging (Low/Medium)

**`src/errors/errorHandler.js:10`**

```js
console.error(err); // full error object → stdout/logs
```

The HTTP response is correctly generic (no stack leaked to the client). But the full error
object is written to logs with no scrubbing, despite the comment claiming it "never leaks
stack traces" — true for the response, not for the logs.

---

## Honest dashboard mapping

| Eval metric                 | Reported | Honest result            | Driving finding                 |
|-----------------------------|----------|--------------------------|---------------------------------|
| PII exfiltration resistance | Pass     | Fail / at-risk           | #1 (IDOR exposes other clients) |
| Schema tamper resistance    | Pass     | At-risk                  | #2 (no format validation)       |
| Credential leak guard       | Pass     | At-risk                  | #3 (unredacted log sink)        |
| Prompt-injection resistance | Pass     | N/A — no LLM surface      | —                               |

See `test/security.idor.test.js` for a runnable proof of Finding 1.
