export interface LimitationRule {
  id: string;
  label: string;
  act: string;
  section: string;
  amount: number;
  unit: "days" | "months" | "years";
  advisoryOnly?: boolean;
  note?: string;
}

export const LIMITATION_RULES: LimitationRule[] = [
  {
    id: "ni_138",
    label: "NI Act S.138 (Cheque Bounce Complaint)",
    act: "Negotiable Instruments Act, 1881",
    section: "Section 142(1)(b)",
    amount: 1,
    unit: "months",
    note: "Computed from expiry of the 15-day payment period after receipt of demand notice.",
  },
  {
    id: "mact_claim",
    label: "MACT Claim (Motor Accident Petition)",
    act: "Motor Vehicles Act, 1988 (2019 Amendment)",
    section: "Section 166(3)",
    amount: 6,
    unit: "months",
    note: "Amended Sec. 166(3) prescribes 6 months from occurrence of accident.",
  },
  {
    id: "consumer_complaint",
    label: "Consumer Complaint (DCDRC / SCDRC / NCDRC)",
    act: "Consumer Protection Act, 2019",
    section: "Section 69",
    amount: 2,
    unit: "years",
  },
  {
    id: "civil_money",
    label: "Civil Suit — Money Recovery / Contract",
    act: "Limitation Act, 1963",
    section: "Articles 19–55",
    amount: 3,
    unit: "years",
  },
  {
    id: "specific_perf",
    label: "Civil Suit — Specific Performance",
    act: "Limitation Act, 1963",
    section: "Article 54",
    amount: 3,
    unit: "years",
  },
  {
    id: "immovable_possession",
    label: "Civil Suit — Possession of Immovable Property",
    act: "Limitation Act, 1963",
    section: "Article 65",
    amount: 12,
    unit: "years",
  },
  {
    id: "decree_execution",
    label: "Execution of Civil Decree",
    act: "Limitation Act, 1963",
    section: "Article 136",
    amount: 12,
    unit: "years",
  },
  {
    id: "civil_appeal_hc",
    label: "First Appeal to High Court (Civil)",
    act: "Limitation Act, 1963",
    section: "Article 116(a)",
    amount: 90,
    unit: "days",
  },
  {
    id: "civil_appeal_dist",
    label: "Appeal to District Court (Civil)",
    act: "Limitation Act, 1963",
    section: "Article 116(b)",
    amount: 30,
    unit: "days",
  },
  {
    id: "slp_sc",
    label: "SLP to Supreme Court (from HC Judgment)",
    act: "Limitation Act, 1963",
    section: "Article 133(c)",
    amount: 90,
    unit: "days",
  },
  {
    id: "criminal_appeal_sessions",
    label: "Criminal Appeal to Sessions Court",
    act: "Limitation Act, 1963",
    section: "Article 115(b)(ii)",
    amount: 30,
    unit: "days",
  },
  {
    id: "criminal_appeal_hc",
    label: "Criminal Appeal to High Court",
    act: "Limitation Act, 1963",
    section: "Article 115(b)(i)",
    amount: 60,
    unit: "days",
  },
  {
    id: "review_civil",
    label: "Review Application (Civil)",
    act: "Limitation Act, 1963",
    section: "Article 124",
    amount: 30,
    unit: "days",
  },
  {
    id: "revision_hc",
    label: "Revision Petition (High Court)",
    act: "Limitation Act, 1963",
    section: "Article 131",
    amount: 90,
    unit: "days",
  },
  {
    id: "sarfaesi_drt",
    label: "SARFAESI Application before DRT",
    act: "SARFAESI Act, 2002",
    section: "Section 17(1)",
    amount: 45,
    unit: "days",
  },
  {
    id: "arbitration_34",
    label: "Arbitration — Setting Aside Award",
    act: "Arbitration & Conciliation Act, 1996",
    section: "Section 34(3)",
    amount: 3,
    unit: "months",
    note: "Further 30 days condonable only on sufficient cause under Sec. 34(3) proviso.",
  },
  {
    id: "service_cat",
    label: "Service Matter before CAT",
    act: "Administrative Tribunals Act, 1985",
    section: "Section 21",
    amount: 1,
    unit: "years",
  },
  {
    id: "gst_appeal",
    label: "GST Appeal to Appellate Authority",
    act: "CGST Act, 2017",
    section: "Section 107(1)",
    amount: 3,
    unit: "months",
  },
  {
    id: "writ_petition",
    label: "Writ Petition (Art. 226 / Art. 32)",
    act: "Constitution of India",
    section: "Art. 226 / Art. 32",
    amount: 90,
    unit: "days",
    advisoryOnly: true,
    note: "No fixed statutory limitation; governed by reasonable time / doctrine of laches (90-day benchmark shown).",
  },
];

export function computeStatutoryDeadline(
  startDateIso: string,
  rule: LimitationRule
): {
  deadlineIso: string;
  deadlineFormatted: string;
  daysLeft: number;
  risk: "Expired" | "Critical" | "Warning" | "Safe";
} | null {
  if (!startDateIso) return null;
  const parts = startDateIso.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

  const [y, m, d] = parts;
  const target = new Date(y, m - 1, d);
  if (Number.isNaN(target.getTime())) return null;

  if (rule.unit === "days") {
    target.setDate(target.getDate() + rule.amount);
  } else if (rule.unit === "months") {
    const origDay = target.getDate();
    target.setMonth(target.getMonth() + rule.amount);
    if (target.getDate() < origDay) {
      target.setDate(0);
    }
  } else if (rule.unit === "years") {
    const origDay = target.getDate();
    target.setFullYear(target.getFullYear() + rule.amount);
    if (target.getDate() < origDay) {
      target.setDate(0);
    }
  }

  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  const dd = String(target.getDate()).padStart(2, "0");
  const deadlineIso = `${yyyy}-${mm}-${dd}`;

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysLeft = Math.round(
    (target.getTime() - todayMidnight.getTime()) / 86400000
  );

  const risk =
    daysLeft < 0
      ? "Expired"
      : daysLeft <= 15
      ? "Critical"
      : daysLeft <= 45
      ? "Warning"
      : "Safe";

  const deadlineFormatted = target.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return {
    deadlineIso,
    deadlineFormatted,
    daysLeft,
    risk,
  };
}
