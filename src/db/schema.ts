import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const requestStatus = pgEnum("request_status", ["draft", "approved", "sourcing", "quoted", "sample", "final_review", "closed"]);
export const supplierType = pgEnum("supplier_type", ["factory", "trader", "unknown"]);
export const complianceStatus = pgEnum("compliance_status", ["compliant", "partial", "non_compliant", "unknown"]);
export const communicationDirection = pgEnum("communication_direction", ["inbound", "outbound"]);

export const sourcingRequests = pgTable("sourcing_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  destinationCountry: text("destination_country").notNull().default("Qatar"),
  destinationCity: text("destination_city").notNull().default("Doha"),
  currency: text("currency").notNull().default("USD"),
  targetQuantity: integer("target_quantity").notNull(),
  recurring: boolean("recurring").notNull().default(false),
  notes: text("notes"),
  status: requestStatus("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productSpecifications = pgTable("product_specifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourcingRequestId: uuid("sourcing_request_id").notNull().references(() => sourcingRequests.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  requiredValue: text("required_value").notNull(),
  mandatory: boolean("mandatory").notNull().default(true),
  notes: text("notes"),
});

export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  legalName: text("legal_name").notNull(),
  tradingName: text("trading_name"),
  country: text("country"),
  website: text("website"),
  supplierType: supplierType("supplier_type").notNull().default("unknown"),
  verifiedFactory: boolean("verified_factory").notNull().default(false),
  certifications: jsonb("certifications").$type<string[]>().notNull().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const supplierContacts = pgTable("supplier_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  name: text("name"),
  title: text("title"),
  email: text("email"),
  phone: text("phone"),
  wechat: text("wechat"),
  whatsapp: text("whatsapp"),
  isPrimary: boolean("is_primary").notNull().default(false),
});

export const rfqs = pgTable("rfqs", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourcingRequestId: uuid("sourcing_request_id").notNull().references(() => sourcingRequests.id, { onDelete: "cascade" }),
  reference: text("reference").notNull().unique(),
  incotermRequested: text("incoterm_requested").notNull().default("FOB"),
  paymentTermsRequested: text("payment_terms_requested"),
  sampleRequested: boolean("sample_requested").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quotations = pgTable("quotations", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourcingRequestId: uuid("sourcing_request_id").notNull().references(() => sourcingRequests.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  rfqId: uuid("rfq_id").references(() => rfqs.id, { onDelete: "set null" }),
  supplierQuoteRef: text("supplier_quote_ref"),
  currency: text("currency").notNull().default("USD"),
  unitPrice: numeric("unit_price", { precision: 14, scale: 4 }),
  moq: integer("moq"),
  incoterm: text("incoterm"),
  leadTimeDays: integer("lead_time_days"),
  samplePrice: numeric("sample_price", { precision: 14, scale: 2 }),
  paymentTerms: text("payment_terms"),
  validityDays: integer("validity_days"),
  rawOffer: jsonb("raw_offer"),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
});

export const technicalCompliance = pgTable("technical_compliance", {
  id: uuid("id").defaultRandom().primaryKey(),
  quotationId: uuid("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
  specificationId: uuid("specification_id").notNull().references(() => productSpecifications.id, { onDelete: "cascade" }),
  offeredValue: text("offered_value"),
  status: complianceStatus("status").notNull().default("unknown"),
  deviation: text("deviation"),
  engineeringDecisionRequired: boolean("engineering_decision_required").notNull().default(false),
});

export const negotiations = pgTable("negotiations", {
  id: uuid("id").defaultRandom().primaryKey(),
  quotationId: uuid("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
  round: integer("round").notNull().default(1),
  offeredUnitPrice: numeric("offered_unit_price", { precision: 14, scale: 4 }),
  offeredMoq: integer("offered_moq"),
  leadTimeDays: integer("lead_time_days"),
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const shippingQuotes = pgTable("shipping_quotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  quotationId: uuid("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(),
  origin: text("origin"),
  destination: text("destination").notNull().default("Doha, Qatar"),
  freightCost: numeric("freight_cost", { precision: 14, scale: 2 }),
  dutiesEstimate: numeric("duties_estimate", { precision: 14, scale: 2 }),
  handlingEstimate: numeric("handling_estimate", { precision: 14, scale: 2 }),
  totalLandedCost: numeric("total_landed_cost", { precision: 14, scale: 2 }),
  transitDays: integer("transit_days"),
  notes: text("notes"),
});

export const communications = pgTable("communications", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourcingRequestId: uuid("sourcing_request_id").notNull().references(() => sourcingRequests.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  rfqId: uuid("rfq_id").references(() => rfqs.id, { onDelete: "set null" }),
  quotationId: uuid("quotation_id").references(() => quotations.id, { onDelete: "set null" }),
  direction: communicationDirection("direction").notNull(),
  channel: text("channel").notNull().default("email"),
  subject: text("subject"),
  body: text("body"),
  externalMessageId: text("external_message_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const supplierEvaluations = pgTable("supplier_evaluations", {
  id: uuid("id").defaultRandom().primaryKey(),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  sourcingRequestId: uuid("sourcing_request_id").references(() => sourcingRequests.id, { onDelete: "cascade" }),
  technicalScore: numeric("technical_score", { precision: 5, scale: 2 }),
  priceScore: numeric("price_score", { precision: 5, scale: 2 }),
  credibilityScore: numeric("credibility_score", { precision: 5, scale: 2 }),
  leadTimeScore: numeric("lead_time_score", { precision: 5, scale: 2 }),
  commercialScore: numeric("commercial_score", { precision: 5, scale: 2 }),
  totalScore: numeric("total_score", { precision: 5, scale: 2 }),
  rationale: text("rationale"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
