import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  const schema = {
    openapi: "3.0.3",
    info: {
      title: "INA Sourcing API",
      version: "0.2.0",
      description: "Controlled API bridge for the INA Sourcing Agent.",
    },
    servers: [{ url: origin }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API key",
        },
      },
    },
    paths: {
      "/api/sourcing-requests": {
        get: {
          operationId: "listSourcingRequests",
          summary: "List recent sourcing requests",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Recent sourcing requests" },
            "401": { description: "Unauthorized" },
          },
        },
        post: {
          operationId: "createSourcingRequest",
          summary: "Create and persist a sourcing request",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "targetQuantity"],
                  properties: {
                    title: { type: "string", minLength: 3 },
                    targetQuantity: { type: "integer", minimum: 1 },
                    recurring: { type: "boolean", default: false },
                    destinationCountry: { type: "string", default: "Qatar" },
                    destinationCity: { type: "string", default: "Doha" },
                    currency: { type: "string", minLength: 3, maxLength: 3, default: "USD" },
                    notes: { type: "string", maxLength: 10000 },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Sourcing request created" },
            "400": { description: "Invalid request" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/api/specifications": {
        get: {
          operationId: "listSpecifications",
          summary: "List requirements for one sourcing request",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "sourcingRequestId",
              in: "query",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": { description: "Specifications" },
            "400": { description: "Invalid request ID" },
            "401": { description: "Unauthorized" },
          },
        },
        post: {
          operationId: "createSpecification",
          summary: "Add a mandatory or optional product requirement",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["sourcingRequestId", "key", "requiredValue"],
                  properties: {
                    sourcingRequestId: { type: "string", format: "uuid" },
                    key: { type: "string" },
                    requiredValue: { type: "string" },
                    mandatory: { type: "boolean", default: true },
                    notes: { type: "string", maxLength: 5000 },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Specification created" },
            "400": { description: "Invalid specification" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/api/suppliers": {
        get: {
          operationId: "listSuppliers",
          summary: "List supplier records",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Suppliers" },
            "401": { description: "Unauthorized" },
          },
        },
        post: {
          operationId: "createSupplier",
          summary: "Save a researched supplier or factory candidate",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["legalName"],
                  properties: {
                    legalName: { type: "string" },
                    tradingName: { type: "string" },
                    country: { type: "string" },
                    website: { type: "string", format: "uri" },
                    supplierType: { type: "string", enum: ["factory", "trader", "unknown"], default: "unknown" },
                    verifiedFactory: { type: "boolean", default: false },
                    certifications: { type: "array", items: { type: "string" } },
                    notes: { type: "string", maxLength: 10000 },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Supplier created" },
            "400": { description: "Invalid supplier" },
            "401": { description: "Unauthorized" },
          },
        },
      },
    },
  } as const;

  return NextResponse.json(schema);
}
