import { NextResponse } from "next/server";

const schema = {
  openapi: "3.1.0",
  info: {
    title: "INA Sourcing API",
    version: "0.1.0",
    description: "Controlled API bridge for the INA Sourcing Agent.",
  },
  servers: [{ url: "/" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
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
                  notes: { type: "string" },
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
  },
} as const;

export async function GET() {
  return NextResponse.json(schema);
}
