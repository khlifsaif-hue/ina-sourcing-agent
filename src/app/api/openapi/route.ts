import { NextResponse } from "next/server";

// This is the public *contract*, not a public data API.  Mutating/search routes
// remain protected by the server-side bearer token defined below.
const specification = {
  openapi: "3.0.3",
  info: {
    title: "INA Sourcing API",
    version: "0.2.0",
    description: "Bounded discovery and sourcing-request API. Discovery leads are not verified suppliers or quotations.",
  },
  servers: [{ url: "https://ina-sourcing-agent.netlify.app" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "opaque service token" },
    },
    schemas: {
      Specification: {
        type: "object",
        required: ["key", "value"],
        properties: {
          key: { type: "string", example: "conductor" },
          value: { type: "string", example: "23AWG solid bare copper" },
          mandatory: { type: "boolean", default: true },
        },
      },
      SupplierSearch: {
        type: "object",
        required: ["product", "quantity"],
        properties: {
          product: { type: "string", example: "CAT6 U/UTP cable 305m" },
          quantity: { type: "integer", minimum: 1, example: 500 },
          destination: { type: "string", default: "Doha, Qatar" },
          specifications: { type: "array", items: { $ref: "#/components/schemas/Specification" } },
          channels: {
            type: "array",
            maxItems: 3,
            items: { type: "string", enum: ["alibaba", "made-in-china", "global-sources", "indiamart", "direct-factories", "web"] },
          },
        },
      },
      SourcingRequest: {
        type: "object",
        required: ["title", "targetQuantity"],
        properties: {
          title: { type: "string", example: "CAT6 cable monthly sourcing" },
          targetQuantity: { type: "integer", minimum: 1, example: 500 },
          recurring: { type: "boolean", default: false },
          destinationCountry: { type: "string", default: "Qatar" },
          destinationCity: { type: "string", default: "Doha" },
          currency: { type: "string", pattern: "^[A-Z]{3}$", default: "USD" },
          notes: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        operationId: "getHealth",
        summary: "Check service reachability",
        responses: { 200: { description: "Service is reachable" } },
      },
    },
    "/api/readiness": {
      get: {
        operationId: "getReadiness",
        summary: "Get operational readiness checks",
        responses: { 200: { description: "Readiness report" } },
      },
    },
    "/api/sourcing-requests": {
      get: {
        operationId: "listSourcingRequests",
        summary: "List saved sourcing requests",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Sourcing requests" }, 401: { description: "Unauthorized" } },
      },
      post: {
        operationId: "createSourcingRequest",
        summary: "Create a sourcing request; this does not contact suppliers",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SourcingRequest" } } } },
        responses: { 201: { description: "Created" }, 400: { description: "Invalid request" }, 401: { description: "Unauthorized" } },
      },
    },
    "/api/supplier-search": {
      post: {
        operationId: "discoverSupplierLeads",
        summary: "Search up to three selected source channels and return unverified discovery leads; no supplier is contacted",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SupplierSearch" } } } },
        responses: { 200: { description: "Discovery leads" }, 400: { description: "Invalid request" }, 401: { description: "Unauthorized" }, 503: { description: "Search provider is not configured" } },
      },
    },
    "/api/supplier-discovery": {
      post: {
        operationId: "qualifySupplierCandidates",
        summary: "Deduplicate and qualify supplied candidates; this does not search or contact suppliers",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["candidates"], properties: { candidates: { type: "array", items: { type: "object" } } } } } } },
        responses: { 200: { description: "Qualification result" }, 400: { description: "Invalid request" }, 401: { description: "Unauthorized" } },
      },
    },
  },
} as const;

export async function GET() {
  return NextResponse.json(specification, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "application/vnd.oai.openapi+json;version=3.0",
    },
  });
}
