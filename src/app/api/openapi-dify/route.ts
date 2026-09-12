import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  return NextResponse.json({
    openapi: "3.0.3",
    info: {
      title: "INA Sourcing API - Dify",
      version: "1.0.0",
      description: "Dify-specific OpenAPI schema using x-api-key header authentication.",
    },
    servers: [{ url: origin }],
    components: {
      securitySchemes: {
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
    },
    security: [{ apiKeyAuth: [] }],
    paths: {
      "/api/sourcing-requests": {
        get: {
          operationId: "listSourcingRequests",
          summary: "List recent sourcing requests",
          responses: { "200": { description: "Sourcing requests" }, "401": { description: "Unauthorized" } },
        },
        post: {
          operationId: "createSourcingRequest",
          summary: "Create a sourcing request",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "targetQuantity"],
                  properties: {
                    title: { type: "string" },
                    targetQuantity: { type: "integer", minimum: 1 },
                    recurring: { type: "boolean", default: false },
                    destinationCountry: { type: "string", default: "Qatar" },
                    destinationCity: { type: "string", default: "Doha" },
                    currency: { type: "string", default: "USD" },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Created" }, "400": { description: "Invalid request" }, "401": { description: "Unauthorized" } },
        },
      },
      "/api/specifications": {
        get: {
          operationId: "listSpecifications",
          summary: "List specifications for a sourcing request",
          parameters: [{ name: "sourcingRequestId", in: "query", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "Specifications" }, "401": { description: "Unauthorized" } },
        },
        post: {
          operationId: "createSpecification",
          summary: "Create a specification",
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
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Created" }, "401": { description: "Unauthorized" } },
        },
      },
      "/api/suppliers": {
        get: {
          operationId: "listSuppliers",
          summary: "List supplier records",
          responses: { "200": { description: "Suppliers" }, "401": { description: "Unauthorized" } },
        },
        post: {
          operationId: "createSupplier",
          summary: "Save a researched supplier or factory candidate",
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
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Created" }, "401": { description: "Unauthorized" } },
        },
      },
      "/api/rfqs": {
        get: {
          operationId: "listRfqs",
          summary: "List RFQs",
          parameters: [{ name: "sourcingRequestId", in: "query", required: false, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "RFQs" }, "401": { description: "Unauthorized" } },
        },
        post: {
          operationId: "createRfq",
          summary: "Create an RFQ",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["sourcingRequestId"],
                  properties: {
                    sourcingRequestId: { type: "string", format: "uuid" },
                    reference: { type: "string" },
                    incotermRequested: { type: "string", default: "FOB" },
                    paymentTermsRequested: { type: "string" },
                    sampleRequested: { type: "boolean", default: true },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Created" }, "401": { description: "Unauthorized" } },
        },
      },
      "/api/quotations": {
        get: {
          operationId: "listQuotations",
          summary: "List quotations",
          parameters: [{ name: "sourcingRequestId", in: "query", required: false, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "Quotations" }, "401": { description: "Unauthorized" } },
        },
        post: {
          operationId: "createQuotation",
          summary: "Save a quotation",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["sourcingRequestId", "supplierId"],
                  properties: {
                    sourcingRequestId: { type: "string", format: "uuid" },
                    supplierId: { type: "string", format: "uuid" },
                    rfqId: { type: "string", format: "uuid" },
                    supplierQuoteRef: { type: "string" },
                    currency: { type: "string", default: "USD" },
                    unitPrice: { oneOf: [{ type: "number" }, { type: "string" }] },
                    moq: { type: "integer", minimum: 1 },
                    incoterm: { type: "string" },
                    leadTimeDays: { type: "integer", minimum: 0 },
                    samplePrice: { oneOf: [{ type: "number" }, { type: "string" }] },
                    paymentTerms: { type: "string" },
                    validityDays: { type: "integer", minimum: 1 },
                    rawOffer: { type: "object", additionalProperties: true },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Created" }, "401": { description: "Unauthorized" } },
        },
      },
      "/api/evaluations": {
        get: {
          operationId: "listSupplierEvaluations",
          summary: "List supplier evaluations",
          parameters: [{ name: "sourcingRequestId", in: "query", required: false, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "Evaluations" }, "401": { description: "Unauthorized" } },
        },
        post: {
          operationId: "createSupplierEvaluation",
          summary: "Save supplier evaluation scores",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["supplierId"],
                  properties: {
                    supplierId: { type: "string", format: "uuid" },
                    sourcingRequestId: { type: "string", format: "uuid" },
                    technicalScore: { oneOf: [{ type: "number" }, { type: "string" }] },
                    priceScore: { oneOf: [{ type: "number" }, { type: "string" }] },
                    credibilityScore: { oneOf: [{ type: "number" }, { type: "string" }] },
                    leadTimeScore: { oneOf: [{ type: "number" }, { type: "string" }] },
                    commercialScore: { oneOf: [{ type: "number" }, { type: "string" }] },
                    totalScore: { oneOf: [{ type: "number" }, { type: "string" }] },
                    rationale: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Created" }, "401": { description: "Unauthorized" } },
        },
      },
    },
  });
}
