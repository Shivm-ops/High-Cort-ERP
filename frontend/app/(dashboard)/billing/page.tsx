"use client";

import { useState } from "react";
import { Plus, Search, IndianRupee, CheckCircle, Clock, AlertTriangle, Send, ExternalLink, FileText, Scale, Landmark, Banknote } from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import InvoiceForm from "@/components/forms/InvoiceForm";
import FeeExpenseForm from "@/components/forms/FeeExpenseForm";
import AdvanceForm from "@/components/forms/AdvanceForm";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useInvoices, useBillingStats, useSendInvoice, useRecordPayment, useSendReminder, Invoice } from "@/lib/hooks/useBilling";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: <FileText className="w-3 h-3" /> },
  sent: { label: "Sent", color: "bg-blue-50 text-blue-700", icon: <Send className="w-3 h-3" /> },
  paid: { label: "Paid", color: "bg-green-50 text-green-700", icon: <CheckCircle className="w-3 h-3" /> },
  overdue: { label: "Overdue", color: "bg-red-50 text-red-700", icon: <AlertTriangle className="w-3 h-3" /> },
  partial: { label: "Partial", color: "bg-amber-50 text-amber-700", icon: <Clock className="w-3 h-3" /> },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-400", icon: null },
};

export default function BillingPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreateFee, setShowCreateFee] = useState(false);
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [showCreateAdvance, setShowCreateAdvance] = useState(false);

  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("bank_transfer");

  const { data, isLoading, error } = useInvoices({ status: statusFilter || undefined });
  const { data: stats } = useBillingStats();
  
  const sendMutation = useSendInvoice();
  const paymentMutation = useRecordPayment();
  const reminderMutation = useSendReminder();

  const handlePayment = async () => {
    if (!paymentInvoice) return;
    await paymentMutation.mutateAsync({
      id: paymentInvoice.id,
      amount: parseFloat(payAmount),
      payment_method: payMethod,
    });
    setPaymentInvoice(null);
    setPayAmount("");
  };

  const filteredInvoices = search
    ? data?.invoices.filter((i) => i.invoice_no.toLowerCase().includes(search.toLowerCase()) || i.client_name?.toLowerCase().includes(search.toLowerCase()))
    : data?.invoices;

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="Legal Fee Management" subtitle="Matter-based billing, expenses, and advance payments" />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Top Actions */}
        <div className="flex gap-3 pb-2 border-b border-gray-200">
          <button onClick={() => setShowCreateInvoice(true)} className="flex items-center gap-2 rounded-xl bg-sidebar px-5 py-2.5 text-sm font-semibold text-white hover:bg-sidebar-dark transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Generate Invoice
          </button>
          <button onClick={() => setShowCreateAdvance(true)} className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-sm">
            <Landmark className="w-4 h-4" /> Receive Advance
          </button>
          <div className="h-10 w-px bg-gray-200 mx-2"></div>
          <button onClick={() => setShowCreateFee(true)} className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-5 py-2.5 text-sm font-semibold text-charcoal hover:bg-gray-50 transition-colors shadow-sm">
            <Scale className="w-4 h-4 text-indigo-600" /> Log Fee
          </button>
          <button onClick={() => setShowCreateExpense(true)} className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-5 py-2.5 text-sm font-semibold text-charcoal hover:bg-gray-50 transition-colors shadow-sm">
            <Banknote className="w-4 h-4 text-amber-600" /> Log Expense
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <IndianRupee className="w-5 h-5 text-indigo-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Billed</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats ? `₹${(stats.total_billed / 100000).toFixed(2)}L` : "—"}</div>
            <div className="text-xs text-gray-500 mt-1 flex justify-between">
              <span>Collected: <span className="text-green-600 font-semibold">₹{stats ? (stats.total_received / 100000).toFixed(2) : "0"}L</span></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm border-l-4 border-l-amber-500">
            <div className="flex justify-between items-start mb-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Outstanding</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">{stats ? `₹${(stats.outstanding / 100000).toFixed(2)}L` : "—"}</div>
            <div className="text-xs text-gray-500 mt-1 flex justify-between">
              <span>Overdue Invoices: <span className="text-red-600 font-semibold">{stats?.overdue_count ?? 0}</span></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start mb-3">
              <Scale className="w-5 h-5 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Unbilled WIP</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">₹{stats ? stats.unbilled_fees.toLocaleString('en-IN') : "—"}</div>
            <div className="text-xs text-gray-500 mt-1 flex justify-between">
              <span>Unbilled Expenses: <span className="font-semibold text-gray-700">₹{stats ? stats.unbilled_expenses.toLocaleString('en-IN') : "0"}</span></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm border-l-4 border-l-green-500">
            <div className="flex justify-between items-start mb-3">
              <Landmark className="w-5 h-5 text-green-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Advance Retainers</span>
            </div>
            <div className="text-2xl font-bold text-green-700">₹{stats ? stats.advance_balance.toLocaleString('en-IN') : "—"}</div>
            <div className="text-xs text-gray-500 mt-1">Available balance in trust/advance</div>
          </div>
        </div>

        {/* Invoice List Toolbar */}
        <div className="flex items-center justify-between pt-4">
          <h2 className="text-sm font-bold text-charcoal">Recent Invoices</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices..."
                className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white w-60" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none">
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>

        {/* Invoice Table */}
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600 text-sm">Failed to load invoices.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {!filteredInvoices?.length ? (
              <div className="py-16 text-center">
                <IndianRupee className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {["Invoice No.", "Client", "Matter / Case", "Amount", "Balance", "Due Date", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredInvoices.map((inv) => {
                      const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-sidebar">{inv.invoice_no}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900 text-[13px]">{inv.client_name}</div>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-gray-600">{inv.case_no ? `${inv.case_title} (${inv.case_no})` : "—"}</td>
                          <td className="px-4 py-3 font-bold text-gray-900">₹{inv.total.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3">
                            {inv.balance_due > 0 ? (
                              <span className="text-amber-600 font-bold">₹{inv.balance_due.toLocaleString("en-IN")}</span>
                            ) : (
                              <span className="text-green-600 font-bold">Nil</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{inv.due_date || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={cn("flex items-center gap-1 text-[11px] px-2 py-1 rounded-md font-bold uppercase tracking-wider w-fit", cfg.color)}>
                              {cfg.icon}{cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => router.push(`/billing/${inv.id}`)} title="View Invoice"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-sidebar hover:bg-sidebar/5">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                              
                              {inv.status === "draft" && (
                                <button onClick={() => sendMutation.mutate(inv.id)} title="Send to Client"
                                  className="text-xs px-2 py-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 font-medium">
                                  Send
                                </button>
                              )}
                              
                              {inv.balance_due > 0 && inv.status !== "draft" && (
                                <>
                                  <button onClick={() => { setPaymentInvoice(inv); setPayAmount(String(inv.balance_due)); }} title="Record Payment"
                                    className="text-xs px-2 py-1 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 font-medium">
                                    Pay
                                  </button>
                                  <button onClick={() => reminderMutation.mutate({ id: inv.id, type: "whatsapp" })} title="Send WhatsApp Reminder"
                                    className="text-xs px-2 py-1 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 font-medium">
                                    WA Remind
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Modal open={showCreateInvoice} onClose={() => setShowCreateInvoice(false)} title="Generate Invoice" size="xl">
        <InvoiceForm onSuccess={() => setShowCreateInvoice(false)} />
      </Modal>

      {/* Log Fee Modal */}
      <Modal open={showCreateFee} onClose={() => setShowCreateFee(false)} title="Log Legal Fee" size="lg">
        <FeeExpenseForm type="fee" onSuccess={() => setShowCreateFee(false)} />
      </Modal>

      {/* Log Expense Modal */}
      <Modal open={showCreateExpense} onClose={() => setShowCreateExpense(false)} title="Log Case Expense" size="lg">
        <FeeExpenseForm type="expense" onSuccess={() => setShowCreateExpense(false)} />
      </Modal>

      {/* Record Advance Modal */}
      <Modal open={showCreateAdvance} onClose={() => setShowCreateAdvance(false)} title="Receive Advance Payment" size="lg">
        <AdvanceForm onSuccess={() => setShowCreateAdvance(false)} />
      </Modal>

      {/* Record Payment Modal */}
      <Modal open={!!paymentInvoice} onClose={() => setPaymentInvoice(null)} title="Record Payment" size="sm">
        {paymentInvoice && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">Invoice</span>
                <span className="font-medium">{paymentInvoice.invoice_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Balance Due</span>
                <span className="font-semibold text-amber-600">₹{paymentInvoice.balance_due.toLocaleString("en-IN")}</span>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-2">
              <Landmark className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800">
                You can apply advance retainers as a payment method if the client has sufficient balance.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">Payment Amount (₹)</label>
              <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} min={1} max={paymentInvoice.balance_due}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">Payment Method</label>
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white">
                <option value="bank_transfer">Bank Transfer / NEFT</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="advance">Apply Advance / Retainer</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setPaymentInvoice(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={paymentMutation.isPending || !payAmount}
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {paymentMutation.isPending ? "Recording..." : "Record Payment"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
