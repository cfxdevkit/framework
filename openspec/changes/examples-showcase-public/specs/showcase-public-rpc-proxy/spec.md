## ADDED Requirements

### Requirement: RPC proxy routes to public Conflux endpoints

The `/api/rpc/[space]/route.ts` API route SHALL accept POST requests with a JSON-RPC body and proxy them to the public Conflux RPC endpoint for the requested space (`espace` or `core`). The `space` path parameter SHALL be validated and any unknown value SHALL return 400.

#### Scenario: Valid eSpace RPC call is proxied
WHEN POST `/api/rpc/espace` is called with `{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}`
THEN the request is forwarded to the eSpace testnet public RPC and the JSON-RPC response is returned verbatim

#### Scenario: Invalid space returns 400
WHEN POST `/api/rpc/unknown` is called
THEN 400 is returned with `{ error: "Invalid space" }`

#### Scenario: Upstream RPC error is propagated
WHEN the upstream RPC returns an error response
THEN the error JSON-RPC response is returned to the client with 200 status (JSON-RPC error, not HTTP error)

### Requirement: RPC proxy is rate-limited per IP

The proxy SHALL apply an in-memory token bucket rate limit of 10 requests per second per IP address. Requests exceeding the limit SHALL receive 429. The implementation SHALL use `x-forwarded-for` or `connection.remoteAddress` to identify the IP.

#### Scenario: Requests within rate limit are served
WHEN 10 requests are sent from the same IP within one second
THEN all 10 requests receive successful responses

#### Scenario: Requests exceeding rate limit are rejected
WHEN more than 10 requests are sent from the same IP within one second
THEN requests beyond the limit receive 429 with `{ error: "Rate limit exceeded" }`
