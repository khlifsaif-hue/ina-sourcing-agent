# Dify Integration

The INA Sourcing Agent exposes a controlled API bridge for Dify.

## Environment

Set these values in the deployment environment:

- `DATABASE_URL` — Neon connection string (server-side only)
- `DIFY_API_KEY` — a long random secret used only between Dify and this API

Never place either secret in prompts, client-side code, or public documentation.

## OpenAPI

After deployment, Dify can import:

`https://<deployment-domain>/api/openapi`

Configure Bearer authentication in Dify using the same `DIFY_API_KEY` value.

## Initial operations

- `listSourcingRequests`
- `createSourcingRequest`

Additional supplier, quotation, compliance, negotiation, and communication operations should be exposed incrementally with the same server-side authorization boundary.
