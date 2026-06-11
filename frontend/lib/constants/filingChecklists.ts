export interface ChecklistItem {
  id: string;
  name: string;
  required: boolean;
  type: string;
}

export const CHECKLISTS: Record<string, ChecklistItem[]> = {
  "Criminal": [
    { id: "c1", name: "Complaint / FIR Copy", required: true, type: "complaint" },
    { id: "c2", name: "Vakalatnama", required: true, type: "vakalatnama" },
    { id: "c3", name: "Affidavit in Support", required: true, type: "affidavit" },
    { id: "c4", name: "List of Witnesses", required: false, type: "annexure" },
    { id: "c5", name: "Bail Application", required: false, type: "application" },
    { id: "c6", name: "Annexures & Evidence", required: false, type: "evidence" },
  ],
  "Cheque Bounce": [
    { id: "cb1", name: "Original Complaint", required: true, type: "complaint" },
    { id: "cb2", name: "Vakalatnama", required: true, type: "vakalatnama" },
    { id: "cb3", name: "Evidence Affidavit", required: true, type: "affidavit" },
    { id: "cb4", name: "Original Cheque", required: true, type: "evidence" },
    { id: "cb5", name: "Bank Return Memo", required: true, type: "evidence" },
    { id: "cb6", name: "Copy of Legal Notice", required: true, type: "evidence" },
    { id: "cb7", name: "Postal / Tracking Receipt", required: true, type: "evidence" },
  ],
  "Property": [
    { id: "p1", name: "Plaint / Petition", required: true, type: "plaint" },
    { id: "p2", name: "Vakalatnama", required: true, type: "vakalatnama" },
    { id: "p3", name: "Affidavit", required: true, type: "affidavit" },
    { id: "p4", name: "Title Documents / Sale Deed", required: true, type: "evidence" },
    { id: "p5", name: "Revenue Records (7/12, etc.)", required: false, type: "evidence" },
    { id: "p6", name: "Property Tax Receipts", required: false, type: "evidence" },
    { id: "p7", name: "Map / Plan of Property", required: false, type: "evidence" },
  ],
  "General": [
    { id: "g1", name: "Main Petition / Application", required: true, type: "petition" },
    { id: "g2", name: "Vakalatnama", required: true, type: "vakalatnama" },
    { id: "g3", name: "Affidavit", required: true, type: "affidavit" },
    { id: "g4", name: "Annexures", required: false, type: "annexure" },
  ]
};

export function getChecklist(practiceArea?: string, caseType?: string): ChecklistItem[] {
  if (caseType && caseType.toLowerCase().includes("cheque bounce")) return CHECKLISTS["Cheque Bounce"];
  if (practiceArea === "Criminal") return CHECKLISTS["Criminal"];
  if (practiceArea === "Property") return CHECKLISTS["Property"];
  return CHECKLISTS["General"];
}
