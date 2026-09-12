import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  const schema = {
    openapi: "3.0.3",
    info: {
      title: "INA Sourcing API",
      version: "0.3.0",
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
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/sourcing-requests": {
        get: {
          operationId: "listSourcingRequests",
          summary: "List recent sourcing requests",
          responses: {
            "200": { description: "Recent sourcing requests" },
            "401": { description: "Unauthorized" },
          },
        },
        post: {
          operationId: "createSourcingRequest",
          summary: "Create and persist a sourcing request",
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
          responses: {
            "200": { description: "Suppliers" },
            "401": { description: "Unauthorized" },
          },
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
      "/api/quotations": {
        get: {
          operationId: "listQuotations",
          summary: "List quotations, optionally by sourcing request",
          parameters: [
            {
              name: "sourcingRequestId",
              in: "query",
              required: false,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": { description: "Quotations" },
            "400": { description: "Invalid request ID" },
            "401": { description: "Unauthorized" },
          },
        },
        post: {
          operationId: "createQuotation",
          summary: "Save a supplier quotation or normalized offer",
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
                    currency: { type: "string", minLength: 3, maxLength: 3, default: "USD" },
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
          responses: {
            "201": { description: "Quotation created" },
            "400": { description: "Invalid quotation" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/api/evaluations": {
        get: {
          operationId: "listSupplierEvaluations",
          summary: "List supplier scoring records, optionally by sourcing request",
          parameters: [
            {
              name: "sourcingRequestId",
              in: "query",
              required: false,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": { description: "Supplier evaluations" },
            "400": { description: "Invalid request ID" },
            "401": { description: "Unauthorized" },
          },
        },
        post: {
          operationId: "createSupplierEvaluation",
          summary: "Save technical and commercial supplier scores",
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
                    technicalScore: { oneOf: [{ type: "number", minimum: 0, maximum: 100 }, { type: "string" }] },
                    priceScore: { oneOf: [{ type: "number", minimum: 0, maximum: 100 }, { type: "string" }] },
                    credibilityScore: { oneOf: [{ type: "number", minimum: 0, maximum: 100 }, { type: "string" }] },
                    leadTimeScore: { oneOf: [{ type: "number", minimum: 0, maximum: 100 }, { type: "string" }] },
                    commercialScore: { oneOf: [{ type: "number", minimum: 0, maximum: 100 }, { type: "string" }] },
                    totalScore: { oneOf: [{ type: "number", minimum: 0, maximum: 100 }, { type: "string" }] },
                    rationale: { type: "string", maxLength: 10000 },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Supplier evaluation created" },
            "400": { description: "Invalid evaluation" },
            "401": { description: "Unauthorized" },
          },
        },
      },
    },
  } as const;

  return NextResponse.json(schema);
}
