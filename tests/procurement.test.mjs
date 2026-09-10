import test from "node:test";
import assert from "node:assert/strict";
import { assessRequirement } from "../src/modules/requirements/requirement-engineer.ts";
import { runSourcingOrchestrator } from "../src/modules/sourcing/orchestrator.ts";
import { deduplicateSuppliers, qualifyCandidate } from "../src/modules/sourcing/discovery-agent.ts";
import { isOfferEligibleForPriceComparison, preparePriceComparison, selectAuthoritativeOffer } from "../src/modules/quotations/normalize.ts";
import { calculateLandedCost } from "../src/modules/landed-cost/calculate.ts";
import { assessCat6Conductor } from "../src/modules/compliance/cat6.ts";
import { evaluateCompliance } from "../src/modules/compliance/evaluate.ts";
import { rankSupplier } from "../src/modules/scoring/rank.ts";
import { calculateSupplierScore } from "../src/modules/scoring/supplier-score.ts";
import { getAuthorityDecision, assertAgentMayExecute } from "../src/modules/approvals/policy.ts";
import { requiresHumanApproval } from "../src/modules/communications/state-machine.ts";
import { resolveSupplierLanguage } from "../src/modules/communications/language-policy.ts";
import { getReadiness } from "../src/modules/sourcing/readiness.ts";

const requirement = {
  productName: "CAT6 U/UTP cable", quantity: 500, unit: "305m box", recurring: true,
  destinationCountry: "Qatar", destinationCity: "Doha", sampleRequired: true,
  requestedIncoterms: ["FOB"], supplierQuestions: ["Confirm manufacturer status"],
  specifications: [
    { key: "conductor", value: "23AWG solid bare copper", mandatory: true },
    { key: "jacket", value: "double jacket FRPVC", mandatory: true },
    { key: "length", value: "305m", mandatory: true },
  ],
};
const supplier = {
  legalName: "Example factory", claimedFactory: true, country: "China",
  website: "https://example.com/products/cable", sourceUrl: "https://example.com/cable",
  sourceType: "manufacturer-site", productEvidence: ["datasheet"], certifications: [],
  contactEmail: "sales@example.com",
};
const offer = {
  supplierId: "s1", currency: "USD", unitPrice: 60, quantity: 500, unit: "305m box",
  moq: 100, incoterm: "FOB Shanghai", sourceType: "quotation",
  sourceReference: "Q-1", mandatoryCompliance: "compliant",
};

test("invalid quantities and duplicate mandatory specifications block discovery before provider calls", async () => {
  let calls = 0;
  const provider = { search: async () => { calls++; return []; } };
  for (const quantity of [0, -1, NaN, Infinity, 1.5]) {
    assert.equal((await runSourcingOrchestrator(provider, { ...requirement, quantity })).status, "blocked");
  }
  assert.equal(calls, 0);
  assert.equal(assessRequirement({ ...requirement, specifications: [...requirement.specifications, requirement.specifications[0]] }).ready, false);
});

test("empty or unqualified discovery cannot become ready for review", async () => {
  for (const candidates of [[], [{ ...supplier, claimedFactory: false, website: undefined, productEvidence: [], contactEmail: undefined }]]) {
    const run = await runSourcingOrchestrator({ search: async () => candidates }, requirement);
    assert.equal(run.status, "blocked");
    assert.ok(run.blockingQuestions.length);
  }
});

test("qualified suppliers require RFQs or compliance review before a commercial decision", async () => {
  const pending = await runSourcingOrchestrator({ search: async () => [supplier] }, requirement);
  assert.equal(pending.status, "awaiting-rfq");
  const priced = await runSourcingOrchestrator({ search: async () => [{ ...supplier, price: { amount: 60, currency: "USD", basis: "305m box", sourceUrl: supplier.sourceUrl } }] }, requirement);
  assert.equal(priced.stage, "compliance");
  assert.ok(priced.warnings.some((warning) => warning.includes("unverified")));
});

test("supplier deduplication merges website pages and preserves separate marketplace suppliers", () => {
  assert.equal(deduplicateSuppliers([supplier, { ...supplier, website: "https://www.example.com/about" }]).length, 1);
  assert.equal(deduplicateSuppliers([
    { ...supplier, website: "https://alibaba.com/supplier-a" },
    { ...supplier, legalName: "Another supplier", website: "https://alibaba.com/supplier-b" },
  ]).length, 2);
});

test("repeated or empty claims cannot inflate supplier qualification", () => {
  const basic = { ...supplier, claimedFactory: false, website: undefined, contactEmail: undefined };
  assert.equal(qualifyCandidate({ ...basic, productEvidence: ["", "a", "a", " A "], certifications: ["", "ISO", "iso"] }).score, 10);
});

test("invalid, below-MOQ, unproven and technically deviating offers cannot enter price comparison", () => {
  assert.equal(isOfferEligibleForPriceComparison(offer), true);
  const changes = [
    { unitPrice: NaN }, { unitPrice: Infinity }, { unitPrice: 0 }, { unitPrice: -2 },
    { quantity: 0 }, { quantity: Infinity }, { quantity: 1.5 }, { moq: 501 },
    { sourceReference: " " }, { unit: undefined }, { incoterm: undefined },
    { currency: "???" }, { mandatoryCompliance: "unknown" }, { mandatoryCompliance: "deviation" },
    { engineeringDecisionRequired: true },
  ];
  for (const change of changes) assert.equal(isOfferEligibleForPriceComparison({ ...offer, ...change }), false, JSON.stringify(change));
});

test("comparisons separate currencies, quantities, units and Incoterms", () => {
  const rows = preparePriceComparison([
    offer, { ...offer, supplierId: "cheaper", unitPrice: 50 },
    { ...offer, currency: "CNY" }, { ...offer, quantity: 1000 },
    { ...offer, unit: "meter" }, { ...offer, incoterm: "EXW Shenzhen" },
  ]);
  assert.equal(new Set(rows.map((row) => row.comparisonGroup)).size, 5);
  const sameBasis = rows.filter((row) => row.comparisonGroup === rows.find((row) => row.supplierId === "s1" && row.unitPrice === 60 && row.currency === "USD" && row.quantity === 500 && row.unit === "305m box" && row.incoterm === "FOB Shanghai").comparisonGroup);
  assert.equal(sameBasis[0].supplierId, "cheaper");
  assert.equal(sameBasis[0].extendedPrice, 25000);
});

test("an explicit noncompliant quotation does not fall back to a published price", () => {
  const received = { ...offer, mandatoryCompliance: "deviation" };
  assert.equal(selectAuthoritativeOffer({ ...offer, sourceType: "published" }, received), received);
  assert.equal(preparePriceComparison([selectAuthoritativeOffer(offer, received)]).length, 0);
});

test("CAT6 alternative metals, ambiguous requirements and substring matches are never accepted as pure copper", () => {
  for (const alternative of ["CCA 25% copper", "copper-clad aluminium", "CCS", "100% copper / CCA options"]) {
    assert.equal(assessCat6Conductor("23AWG Solid Bare Copper", alternative).status, "non_compliant");
  }
  assert.equal(assessCat6Conductor("bare copper", "ABC compound").status, "unknown");
  assert.equal(assessCat6Conductor("cable", "anything").status, "unknown");
  assert.equal(assessCat6Conductor("bare copper", "not 100% copper").status, "unknown");
  assert.equal(assessCat6Conductor("bare copper", "23AWG Solid Bare Copper").status, "compliant");
});

test("missing mandatory evidence requires an engineering decision", () => {
  const [result] = evaluateCompliance([{ key: "material", requiredValue: "bare copper", mandatory: true }], []);
  assert.equal(result.status, "unknown");
  assert.equal(result.engineeringDecisionRequired, true);
});

test("landed cost rejects invalid inputs and calculates known totals", () => {
  const valid = { quantity: 500, unitPrice: 60, freight: 1000, duty: 1500, handling: 100 };
  assert.deepEqual(calculateLandedCost(valid), { goodsValue: 30000, total: 32600, landedUnitCost: 65.2 });
  for (const change of [{ quantity: 0 }, { freight: -1 }, { unitPrice: Infinity }, { other: NaN }]) {
    assert.throws(() => calculateLandedCost({ ...valid, ...change }));
  }
});

test("one scoring policy is used and invalid scores or mandatory deviations cannot win", () => {
  const input = { technicalCompliance: 95, landedCost: 70, credibility: 80, leadTime: 90, commercialTerms: 75, mandatoryDeviation: false };
  assert.equal(calculateSupplierScore({ technical: 95, price: 70, credibility: 80, leadTime: 90, commercial: 75 }), rankSupplier(input).total);
  assert.equal(rankSupplier({ ...input, mandatoryDeviation: true }).eligibleForRecommendation, false);
  for (const change of [{ credibility: NaN }, { technicalCompliance: Infinity }, { landedCost: 150 }]) {
    const result = rankSupplier({ ...input, ...change });
    assert.equal(result.eligibleForRecommendation, false);
    assert.ok(Number.isFinite(result.total));
  }
});

test("specification deviations and unknown commercial actions fail closed through both entry points", () => {
  assert.equal(getAuthorityDecision("accept_specification_deviation"), "approval_required");
  for (const action of ["accept_specification_deviation", "accept-specification-deviation", "unknown", "toString", "make-payment"]) {
    assert.equal(requiresHumanApproval(action), true);
    assert.throws(() => assertAgentMayExecute(action));
  }
  assert.equal(getAuthorityDecision("make_payment"), "prohibited");
  assert.equal(requiresHumanApproval("prepare_rfq"), false);
});

test("supplier preference wins over country and English-copy opt-out is honored", () => {
  assert.equal(resolveSupplierLanguage({ country: " china " }).supplierLanguage, "zh-CN");
  const plan = resolveSupplierLanguage({ country: "China", supplierPreferredLanguage: "fr", includeEnglishCopy: false });
  assert.equal(plan.supplierLanguage, "fr");
  assert.equal(plan.includeEnglishCopy, false);
  assert.equal(plan.translationRequired, true);
});

test("a reachable database cannot make the unfinished agent report ready", () => {
  assert.equal(getReadiness("ready").ready, false);
  assert.equal(getReadiness("unavailable").checks[0].status, "unavailable");
  assert.ok(getReadiness("ready").checks.some((check) => check.key === "translation" && check.status === "missing"));
});
