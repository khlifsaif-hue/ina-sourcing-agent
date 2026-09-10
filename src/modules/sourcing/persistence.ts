import { db } from "@/db/client";
import { agentActions, agentRuns, auditLog, suppliers } from "@/db/schema";
import type { SupplierCandidate } from "@/modules/sourcing/discovery-agent";

export async function startSourcingRun(sourcingRequestId: string) {
  const [run] = await db.insert(agentRuns).values({ sourcingRequestId, runType: "sourcing", status: "running" }).returning();
  return run;
}

export async function recordAgentAction(input: { runId: string; sourcingRequestId: string; actionType: string; authority: "autonomous" | "approval-required"; status: string; payload?: unknown; result?: unknown }) {
  const [action] = await db.insert(agentActions).values({ agentRunId: input.runId, actionType: input.actionType, authority: input.authority, status: input.status, input: input.payload, output: input.result }).returning();
  await db.insert(auditLog).values({ sourcingRequestId: input.sourcingRequestId, actorType: "agent", actorId: input.runId, action: input.actionType, entityType: "agent_action", entityId: action.id, afterData: { authority: input.authority, status: input.status } });
  return action;
}

export async function persistDiscoveredSupplier(sourcingRequestId: string, runId: string, candidate: SupplierCandidate) {
  const [supplier] = await db.insert(suppliers).values({ legalName: candidate.legalName, country: candidate.country, website: candidate.website, supplierType: "unknown", verifiedFactory: false, certifications: candidate.certifications, notes: `Discovery source: ${candidate.sourceType}; evidence: ${candidate.sourceUrl}` }).returning();
  await recordAgentAction({ runId, sourcingRequestId, actionType: "supplier-discovered", authority: "autonomous", status: "completed", payload: { sourceUrl: candidate.sourceUrl, sourceType: candidate.sourceType }, result: { supplierId: supplier.id, claimedFactory: candidate.claimedFactory } });
  return supplier;
}
