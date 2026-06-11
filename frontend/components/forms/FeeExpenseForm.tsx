import React, { useState } from "react";
import { useClients } from "@/lib/hooks/useClients";
import { useCases } from "@/lib/hooks/useCases";
import { useRecordFee, useRecordExpense } from "@/lib/hooks/useBilling";
import { IndianRupee } from "lucide-react";

interface Props {
  onSuccess: () => void;
  type: "fee" | "expense";
  defaultCaseId?: string;
}

export default function FeeExpenseForm({ onSuccess, type, defaultCaseId }: Props) {
  const { data: clientsData } = useClients();
  const { data: casesData } = useCases();

  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [caseId, setCaseId] = useState(defaultCaseId || "");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const filteredClients = (clientsData?.clients || []).filter((c: any) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone && c.phone.replace(/[^0-9]/g, "").includes(clientSearch.replace(/[^0-9]/g, "")))
  );

  const recordFee = useRecordFee();
  const recordExpense = useRecordExpense();

  const FEE_CATEGORIES = [
    "Consultation Fee", "Notice Drafting Fee", "Reply Drafting Fee",
    "Court Appearance Fee", "Hearing Fee", "Filing Fee", "Affidavit Fee",
    "Research Fee", "Documentation Fee", "Success Fee", "Miscellaneous Fees"
  ];

  const EXPENSE_CATEGORIES = [
    "Court Fees", "Stamp Duty", "E-Filing Charges", "Travel",
    "Courier", "Printing", "Clerk Charges", "Miscellaneous Expenses"
  ];

  const categories = type === "fee" ? FEE_CATEGORIES : EXPENSE_CATEGORIES;
  const isPending = recordFee.isPending || recordExpense.isPending;

  // Auto-set client if case is selected
  const handleCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCaseId = e.target.value;
    setCaseId(selectedCaseId);
    if (selectedCaseId) {
      const selectedCase = casesData?.cases.find((c: any) => c.id === selectedCaseId);
      if (selectedCase) setClientId(selectedCase.client_id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !category || !amount || !date) return;

    const payload = {
      client_id: clientId,
      case_id: caseId || undefined,
      category,
      description,
      amount: parseFloat(amount),
      date,
    };

    if (type === "fee") {
      await recordFee.mutateAsync(payload);
    } else {
      await recordExpense.mutateAsync(payload);
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1.5">Client *</label>
          {!caseId && (
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-xs bg-gray-50 border border-gray-100 focus:outline-none focus:ring-1 focus:ring-mint focus:bg-white text-charcoal placeholder:text-muted mb-2"
            />
          )}
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} required disabled={!!caseId}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20 bg-white disabled:bg-gray-50">
            <option value="">Select Client {!caseId && `(${filteredClients.length} matches)`}</option>
            {filteredClients.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1.5">Matter / Case (Optional)</label>
          <select value={caseId} onChange={handleCaseChange} disabled={!!defaultCaseId}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20 bg-white disabled:bg-gray-50">
            <option value="">General (No specific matter)</option>
            {casesData?.cases.map((c: any) => (
              <option key={c.id} value={c.id}>{c.title} ({c.case_no})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1.5">Category *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20 bg-white">
            <option value="">Select Category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1.5">Amount (₹) *</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required
              className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-3 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1.5">Description (Optional)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20 resize-none"
          placeholder={`Details about this ${type}...`} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1.5">Date *</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20" />
      </div>

      <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
        <button type="button" onClick={onSuccess} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-charcoal bg-gray-50 hover:bg-gray-100 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-sidebar hover:bg-sidebar-dark transition-colors disabled:opacity-50">
          {isPending ? "Saving..." : `Record ${type === "fee" ? "Fee" : "Expense"}`}
        </button>
      </div>
    </form>
  );
}
