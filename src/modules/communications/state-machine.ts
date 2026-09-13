import { getAuthorityDecision } from "@/modules/approvals/policy";

export type SupplierContactStatus =
  | "published-price"
  | "rfq-required"
  | "rfq-prepared"
  | "rfq-sent"
  | "awaiting-reply"
  | "quotation-received"
  | "clarification-required"
  | "qualified-for-price-comparison"
  | "rejected-noncompliant";

export type CommunicationChannel = "email" | "marketplace" | "wechat" | "whatsapp" | "manual";

export type OutboundSupplierMessage = {
  requestId: string;
  supplierId: string;
  rfqId?: string;
  to: string;
  subject: string;
  body: string;
  language: string;
  channel: CommunicationChannel;
};

export type SentSupplierMessage = {
  externalMessageId: string;
  sentAt: string;
};

export interface SupplierCommunicationProvider {
  send(input: OutboundSupplierMessage): Promise<SentSupplierMessage>;
}

const allowedTransitions: Record<SupplierContactStatus, SupplierContactStatus[]> = {
  "published-price": ["qualified-for-price-comparison", "clarification-required", "rejected-noncompliant"],
  "rfq-required": ["rfq-prepared"],
  "rfq-prepared": ["rfq-sent"],
  "rfq-sent": ["awaiting-reply", "quotation-received"],
  "awaiting-reply": ["quotation-received", "clarification-required"],
  "quotation-received": ["qualified-for-price-comparison", "clarification-required", "rejected-noncompliant"],
  "clarification-required": ["awaiting-reply", "quotation-received", "rejected-noncompliant"],
  "qualified-for-price-comparison": ["clarification-required", "rejected-noncompliant"],
  "rejected-noncompliant": [],
};

export function canTransitionSupplierContact(from: SupplierContactStatus, to: SupplierContactStatus): boolean {
  return allowedTransitions[from].includes(to);
}

export function transitionSupplierContact(from: SupplierContactStatus, to: SupplierContactStatus): SupplierContactStatus {
  if (!canTransitionSupplierContact(from, to)) {
    throw new Error(`Invalid supplier communication transition: ${from} -> ${to}`);
  }
  return to;
}

export const protectedCommercialActions = [
  "pay-sample",
  "accept-final-commercial-offer",
  "issue-purchase-order",
  "make-payment",
] as const;

export function requiresHumanApproval(action: string): boolean {
  const aliases: Record<string, string> = {
    "pay-sample": "pay_sample",
    "accept-final-commercial-offer": "accept_final_price",
    "issue-purchase-order": "issue_purchase_order",
    "make-payment": "make_payment",
    "accept-specification-deviation": "accept_specification_deviation",
  };
  const canonical = Object.hasOwn(aliases, action) ? aliases[action] : action;
  // Unknown and prohibited operations also fail closed. Approval alone cannot
  // enable a prohibited operation; callers must check getAuthorityDecision.
  return getAuthorityDecision(canonical) !== "autonomous";
}
