import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  SUPPLIER_FROM_NAME: z.string().default("Seif Khlif"),
  SUPPLIER_FROM_EMAIL: z.string().email().default("khlif.saif@gmail.com"),
  SUPPLIER_COMPANY: z.string().default("INA Smart"),
  SUPPLIER_ROLE: z.string().default("Procurement & Sourcing"),
});

export function getEnv() {
  return schema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    SUPPLIER_FROM_NAME: process.env.SUPPLIER_FROM_NAME,
    SUPPLIER_FROM_EMAIL: process.env.SUPPLIER_FROM_EMAIL,
    SUPPLIER_COMPANY: process.env.SUPPLIER_COMPANY,
    SUPPLIER_ROLE: process.env.SUPPLIER_ROLE,
  });
}
