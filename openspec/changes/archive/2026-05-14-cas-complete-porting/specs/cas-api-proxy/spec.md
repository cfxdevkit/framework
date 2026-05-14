## ADDED Requirements

### Requirement: Next.js frontend proxies API calls to the CAS backend
The CAS frontend SHALL include a Next.js App Router catch-all route at `src/app/api/[...path]/route.ts` that forwards all HTTP methods to `NEXT_PUBLIC_CAS_API_URL`, enabling same-origin API calls in production deployments.

#### Scenario: GET request proxied
- **WHEN** the frontend sends `GET /api/health`
- **THEN** the proxy SHALL forward the request to `${NEXT_PUBLIC_CAS_API_URL}/health` and return the backend response with its original status code

#### Scenario: POST with body proxied
- **WHEN** the frontend sends `POST /api/auth/verify` with a JSON body
- **THEN** the proxy SHALL forward the body and content-type header to the backend and return the backend JSON response

#### Scenario: Authorization header forwarded
- **WHEN** the request includes an `Authorization: Bearer <token>` header
- **THEN** the proxy SHALL include the header in the forwarded request

#### Scenario: SSE streaming not proxied
- **WHEN** the request path starts with `sse/`
- **THEN** the proxy SHALL redirect the client to the backend URL directly (SSE requires a persistent connection incompatible with serverless proxy)

#### Scenario: Backend URL not configured
- **WHEN** `NEXT_PUBLIC_CAS_API_URL` is not set
- **THEN** the proxy SHALL respond with `503 { error: "Backend URL not configured" }`
