# Dify Integration

The INA Sourcing Agent exposes a controlled server-side API bridge for Dify.

## Environment

Set these values in the deployment environment:

- `DATABASE_URL` — Neon connection string (server-side only)
- `DIFY_API_KEY` — a long random secret used only between Dify and this API

Never place either secret in prompts, browser code, screenshots, or public documentation.

The application can deploy before `DIFY_API_KEY` is configured, but all protected Dify API operations return `401` until a key is set.

## OpenAPI

After deployment, Dify can import:

`https://<deployment-domain>/api/openapi`

Configure Bearer authentication in Dify using the same `DIFY_API_KEY` value.

## Exposed operations

- `listSourcingRequests`
- `createSourcingRequest`
- `listSpecifications`
- `createSpecification`
- `listSuppliers`
- `createSupplier`
- `listQuotations`
- `createQuotation`
- `listSupplierEvaluations`
- `createSupplierEvaluation`

The bridge deliberately does not expose direct database credentials, payments, purchase-order actions, or outbound supplier messaging. Those capabilities should be added behind explicit approval controls.
