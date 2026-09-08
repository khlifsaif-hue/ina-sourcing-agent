export type ProcurementAction =
  | "search_suppliers"
  | "qualify_supplier"
  | "prepare_rfq"
  | "send_rfq"
  | "ask_technical_question"
  | "negotiate_price"
  | "negotiate_moq"
  | "negotiate_lead_time"
  | "request_documents"
  | "request_sample_quote"
  | "pay_sample"
  | "accept_final_price"
  | "issue_purchase_order"
  | "make_payment";

export type AuthorityDecision = "autonomous" | "approval_required" | "prohibited";

const POLICY: Record<ProcurementAction, AuthorityDecision> = {
  search_suppliers: "autonomous",
  qualify_supplier: "autonomous",
  prepare_rfq: "autonomous",
  send_rfq: "autonomous",
  ask_technical_question: "autonomous",
  negotiate_price: "autonomous",
  negotiate_moq: "autonomous",
  negotiate_lead_time: "autonomous",
  request_documents: "autonomous",
  request_sample_quote: "autonomous",
  pay_sample: "approval_required",
  accept_final_price: "approval_required",
  issue_purchase_order: "approval_required",
  make_payment: "prohibited",
};

export function getAuthorityDecision(action: ProcurementAction): AuthorityDecision {
  return POLICY[action];
}

export function assertAgentMayExecute(action: ProcurementAction): void {
  const decision = getAuthorityDecision(action);
  if (decision !== "autonomous") {
    throw new Error(`Action ${action} cannot be executed autonomously: ${decision}`);
  }
}
