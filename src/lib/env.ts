import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  DIFY_API_KEY: z.string().min(24).optional(),
  SUPPLIER_FROM_NAME: z.string().default("Seif Khelif"),
  SUPPLIER_FROM_EMAIL: z.string().email().default("info@inasmart.com"),
  SUPPLIER_COMPANY: z.string().default("INA Smart"),
  SUPPLIER_ROLE: z.string().default("Procurement & Sourcing"),
});

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIFY_API_KEY: process.env.DIFY_API_KEY,
  SUPPLIER_FROM_NAME: process.env.SUPPLIER_FROM_NAME,
  SUPPLIER_FROM_EMAIL: process.env.SUPPLIER_FROM_EMAIL,
  SUPPLIER_COMPANY: process.env.SUPPLIER_COMPANY,
  SUPPLIER_ROLE: process.env.SUPPLIER_ROLE,
});
