import React, { useState } from "react";
import { useClients } from "@/lib/hooks/useClients";
import { useCases } from "@/lib/hooks/useCases";
import { useRecordAdvance } from "@/lib/hooks/useBilling";
import { IndianRupee } from "lucide-react";

interface Props {
  onSuccess: () => void;
  defaultCaseId?: string;
}

export default function AdvanceForm({ onSuccess, defaultCaseId }: Props) {
  const { data: clientsData } = useClients();
  const { data: casesData } = useCases();
  const recordAdvance = useRecordAdvance();

  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [caseId, setCaseId] = useState(defaultCaseId || "");
  const [amountReceived, setAmountReceived] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const filteredClients = (clientsData?.clients || []).filter((c: any) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone && c.phone.replace(/[^0-9]/g, "").includes(clientSearch.replace(/[^0-9]/g, "")))
  );

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
    if (!clientId || !amountReceived || !date) return;

    await recordAdvance.mutateAsync({
      client_id: clientId,
      case_id: caseId || undefined,
      amount_received: parseFloat(amountReceived),
      date,
      payment_method: paymentMethod,
      reference,
      notes,
    });
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
            <option value="">General Retainer (No specific matter)</option>
            {casesData?.cases.map((c: any) => (
              <option key={c.id} value={c.id}>{c.title} ({c.case_no})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1.5">Amount Received (₹) *</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input type="number" min="1" step="0.01" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} required
              className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-3 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1.5">Date *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1.5">Payment Method *</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20 bg-white">
            <option value="bank_transfer">Bank Transfer / NEFT</option>
            <option value="upi">UPI</option>
            <option value="cheque">Cheque</option>
            <option value="cash">Cash</option>
            <option value="rtgs">RTGS</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1.5">Reference / Txn ID</label>
          <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
            placeholder="e.g. UBIN00129384" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1.5">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20 resize-none"
          placeholder="Details about this advance payment..." />
      </div>

      <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
        <button type="button" onClick={onSuccess} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-charcoal bg-gray-50 hover:bg-gray-100 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={recordAdvance.isPending} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50">
          {recordAdvance.isPending ? "Recording..." : "Record Advance"}
        </button>
      </div>
    </form>
  );
}
