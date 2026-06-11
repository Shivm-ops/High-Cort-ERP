import React from "react";
import { useLedger } from "@/lib/hooks/useBilling";
import { IndianRupee, FileText, Scale, Landmark, Banknote, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  caseId: string;
}

export default function MatterLedger({ caseId }: Props) {
  const { data, isLoading, error } = useLedger(caseId);

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-500 animate-pulse">Loading matter ledger...</div>;
  }

  if (error || !data) {
    return <div className="p-8 text-center text-sm text-red-500">Failed to load ledger data.</div>;
  }

  const { ledger, summary } = data;

  const getIcon = (type: string) => {
    switch (type) {
      case "fee": return <Scale className="w-4 h-4 text-indigo-600" />;
      case "expense": return <Banknote className="w-4 h-4 text-amber-600" />;
      case "advance": return <Landmark className="w-4 h-4 text-green-600" />;
      case "invoice": return <FileText className="w-4 h-4 text-sidebar" />;
      default: return <IndianRupee className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Ledger Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Billed Fees</div>
          <div className="text-xl font-bold text-gray-900">₹{summary.total_fees.toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Expenses</div>
          <div className="text-xl font-bold text-gray-900">₹{summary.total_expenses.toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Advance Balance</div>
          <div className="text-xl font-bold text-green-600">₹{summary.advance_balance.toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Amount Paid</div>
          <div className="text-xl font-bold text-sidebar">₹{summary.total_paid.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Chronological Ledger Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-900">Chronological Ledger</h3>
        </div>
        
        {ledger.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No financial records found for this matter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 w-32">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 w-24">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Details</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 w-32">Debit (-)</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 w-32">Credit (+)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledger.map((entry, idx) => {
                  let debit = null;
                  let credit = null;

                  if (entry.type === "fee" || entry.type === "expense") {
                    debit = entry.amount;
                  } else if (entry.type === "advance") {
                    credit = entry.amount_received;
                  } else if (entry.type === "invoice") {
                    // Invoice is a formalization of fees/expenses, we show it just for reference, but payments are credits.
                    if (entry.amount_paid && entry.amount_paid > 0) {
                      credit = entry.amount_paid;
                    }
                  }

                  return (
                    <tr key={`${entry.type}-${entry.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-gray-600 text-[13px] font-medium">
                        {entry.date}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={cn(
                          "flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-md uppercase tracking-wider w-fit",
                          entry.type === "fee" && "bg-indigo-50 text-indigo-700",
                          entry.type === "expense" && "bg-amber-50 text-amber-700",
                          entry.type === "advance" && "bg-green-50 text-green-700",
                          entry.type === "invoice" && "bg-gray-100 text-gray-700",
                        )}>
                          {getIcon(entry.type)}
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 text-[13px]">
                          {entry.type === "invoice" ? `Invoice Raised: ${entry.invoice_no}` : entry.category || "Advance Payment"}
                        </div>
                        {entry.description && <div className="text-xs text-gray-500 mt-0.5">{entry.description}</div>}
                        {entry.type === "invoice" && entry.status && (
                          <div className="text-xs text-gray-500 mt-0.5">Status: {entry.status.toUpperCase()} | Total: ₹{entry.total?.toLocaleString()}</div>
                        )}
                        {entry.type === "advance" && entry.payment_method && (
                          <div className="text-xs text-gray-500 mt-0.5 capitalize">Via {entry.payment_method.replace('_', ' ')}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        {debit ? (
                          <span className="text-red-600 font-semibold flex justify-end items-center gap-1 text-[13px]">
                            ₹{debit.toLocaleString("en-IN")}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        {credit ? (
                          <span className="text-green-600 font-semibold flex justify-end items-center gap-1 text-[13px]">
                            ₹{credit.toLocaleString("en-IN")}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
