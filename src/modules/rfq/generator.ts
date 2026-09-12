import { buildSupplierBrief, type SourcingRequirement } from "@/modules/requirements/requirement-engineer";

export type SupplierIdentity = {
  companyName: string;
  contactName?: string;
};

export type GeneratedRfq = {
  subject: string;
  body: string;
  requestedFields: string[];
};

export function generateRfq(requirement: SourcingRequirement, supplier: SupplierIdentity): GeneratedRfq {
  const greeting = supplier.contactName ? `Dear ${supplier.contactName},` : `Dear ${supplier.companyName} Sales Team,`;
  const requestedFields = [
    "Exact model / product reference",
    "Compliance against every mandatory specification",
    "Any deviation or alternative clearly identified",
    "EXW unit price",
    "FOB unit price and named China/export port",
    `CIF unit price to ${requirement.destinationCity}, ${requirement.destinationCountry}`,
    `DDP unit price to ${requirement.destinationCity}, ${requirement.destinationCountry}`,
    "MOQ",
    "Production lead time",
    "Sample price and courier cost",
    "Payment terms",
    "Quotation validity",
    "Packing dimensions, gross weight and units per carton/pallet",
    "HS code",
    "Warranty",
    "Applicable certifications and test reports",
    "Factory address and manufacturer status",
  ];

  const body = [
    greeting,
    "",
    "We are evaluating manufacturers/suppliers for the requirement below. Please quote strictly against the stated specification.",
    "",
    buildSupplierBrief(requirement),
    "",
    "COMMERCIAL INFORMATION REQUIRED",
    ...requestedFields.map((field, index) => `${index + 1}. ${field}`),
    "",
    "If your standard product does not meet a mandatory specification, please do not silently substitute it. State the deviation and quote it separately as an alternative.",
    "",
    "Please attach the datasheet, relevant test reports/certificates and product/factory photos where available.",
    "",
    "Regards,",
    "INA Smart Procurement",
  ].join("\n");

  return {
    subject: `RFQ — ${requirement.productName} — Qty ${requirement.quantity} — ${requirement.destinationCountry}`,
    body,
    requestedFields,
  };
}
