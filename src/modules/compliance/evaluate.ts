import type { MandatorySpec, SupplierOfferSpec } from "@/types/sourcing";

export type ComplianceResult = {
  key: string;
  requested: string;
  offered?: string;
  status: "compliant" | "non_compliant" | "unknown";
  engineeringDecisionRequired: boolean;
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export function evaluateCompliance(required: MandatorySpec[], offered: SupplierOfferSpec[]): ComplianceResult[] {
  const map = new Map(offered.map((item) => [normalize(item.key), item.offeredValue]));

  return required.map((spec) => {
    const offeredValue = map.get(normalize(spec.key));
    if (!offeredValue) {
      return {
        key: spec.key,
        requested: spec.requiredValue,
        status: "unknown",
        engineeringDecisionRequired: spec.mandatory,
      };
    }

    const compliant = normalize(offeredValue) === normalize(spec.requiredValue);
    return {
      key: spec.key,
      requested: spec.requiredValue,
      offered: offeredValue,
      status: compliant ? "compliant" : "non_compliant",
      engineeringDecisionRequired: spec.mandatory && !compliant,
    };
  });
}
