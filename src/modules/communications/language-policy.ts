export type SupportedSupplierLanguage =
  | "en"
  | "zh-CN"
  | "ar"
  | "tr"
  | "fr"
  | "de"
  | "es"
  | "it"
  | "pt"
  | "ja"
  | "ko"
  | "vi"
  | "th"
  | "hi"
  | "id";

export type SupplierLanguageContext = {
  detectedLanguage?: string;
  country?: string;
  supplierPreferredLanguage?: string;
};

export type CommunicationLanguagePlan = {
  supplierLanguage: string;
  includeEnglishCopy: boolean;
  internalLanguage: "en";
  translationRequired: boolean;
};

const countryDefaults: Record<string, string> = {
  China: "zh-CN",
  Taiwan: "zh-TW",
  Japan: "ja",
  "South Korea": "ko",
  Turkey: "tr",
  France: "fr",
  Germany: "de",
  Italy: "it",
  Spain: "es",
  Portugal: "pt",
  Vietnam: "vi",
  Thailand: "th",
  India: "en",
  Indonesia: "id",
  Qatar: "ar",
  UAE: "ar",
  "Saudi Arabia": "ar",
};

export function resolveSupplierLanguage(context: SupplierLanguageContext): CommunicationLanguagePlan {
  const supplierLanguage =
    context.supplierPreferredLanguage?.trim() ||
    context.detectedLanguage?.trim() ||
    (context.country ? countryDefaults[context.country] : undefined) ||
    "en";

  return {
    supplierLanguage,
    includeEnglishCopy: supplierLanguage !== "en",
    internalLanguage: "en",
    translationRequired: supplierLanguage !== "en",
  };
}

export const multilingualCommunicationRules = [
  "Detect the supplier's language from their website, marketplace profile, prior messages and explicit preference; country is only a fallback.",
  "Communicate in the supplier's preferred/local language when confidently detected.",
  "For non-English outbound RFQs, include an English copy below the translated version unless the supplier explicitly requests otherwise.",
  "Translate inbound supplier messages into English for internal procurement analysis while preserving the original message verbatim for audit.",
  "Never translate model numbers, standards, dimensions, tolerances, material grades, Incoterms, currency values or certification identifiers into a technically different value.",
  "If a translation could change a mandatory technical requirement, flag it for clarification rather than infer the meaning.",
  "Store original language, translated text, detected language and translation status with the communication record.",
] as const;
