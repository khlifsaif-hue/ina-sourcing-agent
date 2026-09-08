export type RfqRequirement = {
  key: string;
  value: string;
  mandatory: boolean;
};

export type Cat6RfqTemplate = {
  code: "CAT6-UUTP-CU" | "CAT6-SFTP-ARMOURED-CU";
  title: string;
  initialQuantity: string;
  recurrence: string;
  destination: string;
  requirements: RfqRequirement[];
  commercialQuestions: string[];
};

const commercialQuestions = [
  "Best EXW and FOB unit price",
  "MOQ and price breaks for recurring monthly orders",
  "Sample price, courier cost, and sample lead time to Doha, Qatar",
  "Mass-production lead time",
  "Payment terms",
  "Warranty",
  "Packaging details, gross weight, carton dimensions, and CBM",
  "Available TIA/ISO/IEC test reports and certificates",
  "Factory legal name, address, and whether quotation is direct from manufacturer",
];

export const cat6UutpCopperRfq: Cat6RfqTemplate = {
  code: "CAT6-UUTP-CU",
  title: "CAT6 U/UTP 23AWG Solid Bare Copper, Double FRPVC, 305m",
  initialQuantity: "500 boxes",
  recurrence: "Monthly; volume expected to increase",
  destination: "Doha, Qatar",
  requirements: [
    { key: "Category", value: "CAT6", mandatory: true },
    { key: "Construction", value: "U/UTP", mandatory: true },
    { key: "Conductor gauge", value: "23AWG", mandatory: true },
    { key: "Conductor", value: "Solid annealed bare copper; CCA/CCS not accepted as compliant", mandatory: true },
    { key: "Pairs", value: "4 pairs", mandatory: true },
    { key: "Jacket", value: "Double jacket FRPVC", mandatory: true },
    { key: "Bandwidth", value: "250MHz", mandatory: true },
    { key: "Length", value: "305m per box", mandatory: true },
    { key: "Standards", value: "TIA / ISO / IEC compliant", mandatory: true },
    { key: "PoE", value: "PoE compatible", mandatory: true },
  ],
  commercialQuestions,
};

export const cat6SftpArmouredCopperRfq: Cat6RfqTemplate = {
  code: "CAT6-SFTP-ARMOURED-CU",
  title: "CAT6 S/FTP 23AWG Solid Bare Copper, Armoured, Double Jacket, 305m",
  initialQuantity: "Quote both 100 and 200 boxes",
  recurrence: "Monthly; volume expected to increase",
  destination: "Doha, Qatar",
  requirements: [
    { key: "Category", value: "CAT6", mandatory: true },
    { key: "Construction", value: "S/FTP", mandatory: true },
    { key: "Conductor gauge", value: "23AWG", mandatory: true },
    { key: "Conductor", value: "Solid annealed bare copper; CCA/CCS not accepted as compliant", mandatory: true },
    { key: "Pair shielding", value: "Individual foil", mandatory: true },
    { key: "Overall braid", value: "40% tinned-copper braid", mandatory: true },
    { key: "Armour", value: "ECCS steel-tape armour", mandatory: true },
    { key: "Inner jacket", value: "PVC", mandatory: true },
    { key: "Outer jacket", value: "UV-stabilized PE", mandatory: true },
    { key: "Outer diameter", value: "12.6 ± 1.5 mm", mandatory: true },
    { key: "Length", value: "305m", mandatory: true },
  ],
  commercialQuestions,
};
