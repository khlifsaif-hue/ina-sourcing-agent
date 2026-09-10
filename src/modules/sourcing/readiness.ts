export type ReadinessStatus = "ready" | "partial" | "missing" | "unavailable";

export function getReadiness(database: "ready" | "unavailable") {
  const checks: Array<{ key: string; status: ReadinessStatus; detail: string }> = [
    { key: "database", status: database, detail: database === "ready" ? "Runtime database query succeeded." : "Runtime database query failed." },
    { key: "requests", status: "partial", detail: "Protected list/create API exists; form, specification persistence and sign-in remain to connect." },
    { key: "search", status: "missing", detail: "Search-provider interface and candidate screening exist; no real search provider is connected." },
    { key: "supplier_communication", status: "partial", detail: "Sender profiles are configurable; Gmail OAuth sender, inbound sync and retry worker are not connected." },
    { key: "translation", status: "missing", detail: "Language policy exists; translation and original-message storage are not implemented." },
    { key: "comparison", status: "partial", detail: "Core compliance, price-basis and ranking checks exist; quote intake and landed-cost integration remain." },
    { key: "approvals", status: "partial", detail: "Commercial action rules exist; approval workflow and authenticated browser decisions remain." },
  ];
  return { service: "ina-sourcing-agent", ready: checks.every((check) => check.status === "ready"), checks };
}
