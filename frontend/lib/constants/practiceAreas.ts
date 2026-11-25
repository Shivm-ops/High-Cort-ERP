export interface PracticeAreaDefinition {
  id: string;
  value: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
  aliases: string[];
}

export const PRACTICE_AREA_DEFINITIONS: PracticeAreaDefinition[] = [
  {
    id: "criminal",
    value: "Criminal",
    label: "Criminal Law",
    desc: "BNS, BNSS, bail, trials, appeals",
    icon: "⚖️",
    color: "#EF4444",
    aliases: ["criminal", "criminal law"],
  },
  {
    id: "civil",
    value: "Civil",
    label: "Civil Law",
    desc: "CPC, suits, injunctions, decrees",
    icon: "📋",
    color: "#3B82F6",
    aliases: ["civil", "civil law"],
  },
  {
    id: "property",
    value: "Property",
    label: "Property & RERA",
    desc: "TP Act, RERA, title disputes",
    icon: "🏠",
    color: "#F59E0B",
    aliases: ["property", "property law", "rera", "property & rera"],
  },
  {
    id: "gst",
    value: "GST/Tax",
    label: "GST & Taxation",
    desc: "GST Act, appeals, CESTAT",
    icon: "💰",
    color: "#10B981",
    aliases: ["gst", "tax", "gst/tax", "gst & taxation", "tax & gst"],
  },
  {
    id: "family",
    value: "Family",
    label: "Family Law",
    desc: "HMA, guardianship, maintenance",
    icon: "👨‍👩‍👧",
    color: "#8B5CF6",
    aliases: ["family", "family law"],
  },
  {
    id: "mact",
    value: "MACT",
    label: "MACT",
    desc: "Accident claims, compensation",
    icon: "🚗",
    color: "#F97316",
    aliases: ["mact", "motor"],
  },
  {
    id: "consumer",
    value: "Consumer",
    label: "Consumer Disputes",
    desc: "District, State & National Commission",
    icon: "🛡️",
    color: "#0EA5E9",
    aliases: ["consumer", "consumer disputes"],
  },
  {
    id: "banking",
    value: "Banking/NI Act",
    label: "Banking & NI Act",
    desc: "Sec 138 cheque bounce, DRT, SARFAESI",
    icon: "🏦",
    color: "#6366F1",
    aliases: ["banking", "ni act", "banking/ni act", "banking & drt", "drt"],
  },
  {
    id: "corporate",
    value: "Corporate",
    label: "Corporate & Arbitration",
    desc: "Contracts, NCLT, arbitration claims",
    icon: "🏢",
    color: "#14B8A6",
    aliases: ["corporate", "arbitration", "corporate & commercial"],
  },
  {
    id: "constitutional",
    value: "Constitutional/Writ",
    label: "Constitutional & Writ",
    desc: "Art. 226 / 32 writs & service matters",
    icon: "🏛️",
    color: "#EC4899",
    aliases: ["constitutional", "writ", "constitutional/writ"],
  },
  {
    id: "labour",
    value: "Labour",
    label: "Labour & Service",
    desc: "Industrial disputes, wages, termination",
    icon: "🧾",
    color: "#64748B",
    aliases: ["labour", "labour & service"],
  },
  {
    id: "other",
    value: "Other",
    label: "Other Matters",
    desc: "Miscellaneous & advisory matters",
    icon: "📁",
    color: "#78716C",
    aliases: ["other"],
  },
];

export function matchesPracticeArea(casePracticeArea: string | undefined, areaId: string): boolean {
  const norm = (casePracticeArea || "").trim().toLowerCase();
  const def = PRACTICE_AREA_DEFINITIONS.find((a) => a.id === areaId);
  if (!def) return false;
  if (!norm && areaId === "other") return true;
  if (!norm) return false;
  return def.aliases.some((alias) => norm === alias || norm.includes(alias));
}

export function isCaseClosedStatus(status: string | undefined): boolean {
  const s = (status || "").trim().toLowerCase();
  return s === "closed" || s === "disposed";
}
