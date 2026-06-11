"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, CheckCircle, Clock, AlertTriangle, FileText, IndianRupee, AlertCircle, Printer, X } from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { useInvoice, useSendInvoice, useRecordPayment, useCancelInvoice } from "@/lib/hooks/useBilling";
import { useMyLetterhead } from "@/lib/hooks/useLetterhead";
import LetterheadPreview from "@/components/drafts/LetterheadPreview";
import LetterheadSettings from "@/components/settings/LetterheadSettings";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: <FileText className="w-4 h-4" /> },
  sent: { label: "Sent", color: "bg-blue-50 text-blue-700", icon: <Send className="w-4 h-4" /> },
  paid: { label: "Paid", color: "bg-green-50 text-green-700", icon: <CheckCircle className="w-4 h-4" /> },
  overdue: { label: "Overdue", color: "bg-red-50 text-red-700", icon: <AlertTriangle className="w-4 h-4" /> },
  partial: { label: "Partial", color: "bg-amber-50 text-amber-700", icon: <Clock className="w-4 h-4" /> },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-400", icon: <X className="w-4 h-4" /> },
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const { data: invoice, isLoading, error } = useInvoice(id);
  const sendMutation = useSendInvoice();
  const paymentMutation = useRecordPayment();
  const cancelMutation = useCancelInvoice();

  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [payRef, setPayRef] = useState("");
  
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { data: letterhead } = useMyLetterhead();

  const handlePayment = async () => {
    await paymentMutation.mutateAsync({
      id,
      amount: parseFloat(payAmount),
      payment_method: payMethod,
      payment_reference: payRef || undefined,
    });
    setShowPayModal(false);
    setPayAmount("");
    setPayRef("");
  };

  if (isLoading) return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="Loading Invoice..." subtitle="" />
      <div className="p-6"><FormSkeleton /></div>
    </div>
  );

  if (error || !invoice) return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="Invoice not found" subtitle="" />
      <div className="p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-gray-600 text-sm">Could not load invoice. Ensure the backend is running.</p>
        <button onClick={() => router.back()} className="mt-3 text-sidebar text-sm font-medium hover:underline">← Go back</button>
      </div>
    </div>
  );

  const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
  const canSend = invoice.status === "draft";
  const canPay = ["sent", "partial", "overdue"].includes(invoice.status);
  const canCancel = !["paid", "cancelled"].includes(invoice.status);
  const isIgst = invoice.place_of_supply && invoice.place_of_supply.toLowerCase() !== "maharashtra";

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title={`Invoice ${invoice.invoice_no}`} subtitle={invoice.client_name || "Invoice Details"} />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Billing
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowPrintPreview(true)} 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sidebar text-white text-sm font-semibold hover:bg-sidebar-dark transition-colors"
            >
              <Printer className="w-4 h-4" /> Print on Letterhead
            </button>
            {canSend && (
              <button
                onClick={() => sendMutation.mutate(invoice.id)}
                disabled={sendMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                <Send className="w-4 h-4" /> {sendMutation.isPending ? "Sending..." : "Mark as Sent"}
              </button>
            )}
            {canPay && (
              <button
                onClick={() => { setPayAmount(String(invoice.balance_due)); setShowPayModal(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                <IndianRupee className="w-4 h-4" /> Record Payment
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => { if (confirm("Cancel this invoice?")) cancelMutation.mutate(invoice.id); }}
                disabled={cancelMutation.isPending}
                className="px-3 py-2 rounded-xl border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Cancel Invoice
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Invoice document */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="text-2xl font-bold text-gray-900">INVOICE</div>
                <div className="font-mono text-gray-500 text-sm mt-1">{invoice.invoice_no}</div>
              </div>
              <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold", cfg.color)}>
                {cfg.icon} {cfg.label}
              </span>
            </div>

            {/* Bill to */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Bill To</div>
                <div className="font-semibold text-gray-900">{invoice.client_name}</div>
                {invoice.place_of_supply && (
                  <div className="text-sm text-gray-500 mt-0.5">{invoice.place_of_supply}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Invoice Details</div>
                <div className="text-sm text-gray-600">
                  <div className="flex justify-end gap-8 mb-1">
                    <span>Invoice Date</span>
                    <span className="font-medium text-gray-900">{new Date(invoice.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                  {invoice.due_date && (
                    <div className="flex justify-end gap-8 mb-1">
                      <span>Due Date</span>
                      <span className="font-medium text-gray-900">{invoice.due_date}</span>
                    </div>
                  )}
                  {invoice.case_no && (
                    <div className="flex justify-end gap-8">
                      <span>Case No.</span>
                      <span className="font-medium text-gray-900 font-mono text-xs">{invoice.case_no}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line items table */}
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="text-center py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Qty</th>
                  <th className="text-right py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Rate (₹)</th>
                  <th className="text-right py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoice.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 text-gray-900">{item.description}</td>
                    <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600">{item.rate.toLocaleString("en-IN")}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{item.amount.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">₹{invoice.subtotal.toLocaleString("en-IN")}</span>
                </div>
                {invoice.gst_rate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">GST ({invoice.gst_rate}%)</span>
                    <span className="font-medium">₹{invoice.gst_amount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900 text-lg">₹{invoice.total.toLocaleString("en-IN")}</span>
                </div>
                {invoice.amount_paid > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount Paid</span>
                      <span className="font-medium text-green-600">₹{invoice.amount_paid.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                      <span className="font-semibold text-amber-700">Balance Due</span>
                      <span className="font-bold text-amber-700">₹{invoice.balance_due.toLocaleString("en-IN")}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 gap-6">
                {invoice.notes && (
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Notes</div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Terms & Conditions</div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="col-span-1 space-y-4">
            {/* Payment Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="font-semibold text-gray-900">₹{invoice.total.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Received</span>
                    <span className="font-semibold text-green-600">₹{invoice.amount_paid.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Balance Due</span>
                    <span className={cn("font-semibold", invoice.balance_due > 0 ? "text-amber-600" : "text-green-600")}>
                      {invoice.balance_due > 0 ? `₹${invoice.balance_due.toLocaleString("en-IN")}` : "Nil"}
                    </span>
                  </div>
                </div>
                {invoice.total > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Collection</span>
                      <span>{Math.round((invoice.amount_paid / invoice.total) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round((invoice.amount_paid / invoice.total) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment info (if paid) */}
            {invoice.payment_method && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Method</span>
                    <span className="font-medium capitalize">{invoice.payment_method.replace("_", " ")}</span>
                  </div>
                  {invoice.paid_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span className="font-medium">{invoice.paid_date}</span>
                    </div>
                  )}
                  {invoice.payment_reference && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reference</span>
                      <span className="font-medium font-mono text-xs">{invoice.payment_reference}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Linked case */}
            {invoice.case_no && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Linked Case</h3>
                <div className="text-sm">
                  <div className="font-mono text-xs text-gray-500">{invoice.case_no}</div>
                  {invoice.case_title && <div className="font-medium text-gray-900 mt-1">{invoice.case_title}</div>}
                </div>
                <button
                  onClick={() => router.push(`/cases/${invoice.case_id}`)}
                  className="mt-3 text-xs text-sidebar hover:underline font-medium"
                >
                  View case →
                </button>
              </div>
            )}

            {/* GST breakdown */}
            {invoice.gst_rate > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("GST Breakdown")}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("Taxable Amount")}</span>
                    <span className="font-medium">₹{invoice.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {isIgst ? (
                    <div className="flex justify-between">
                      <span className="text-gray-500">IGST ({invoice.gst_rate}%)</span>
                      <span className="font-medium">₹{invoice.gst_amount.toLocaleString("en-IN")}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">CGST ({invoice.gst_rate / 2}%)</span>
                        <span className="font-medium">₹{(invoice.gst_amount / 2).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">SGST ({invoice.gst_rate / 2}%)</span>
                        <span className="font-medium">₹{(invoice.gst_amount / 2).toLocaleString("en-IN")}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t border-gray-100 pt-2">
                    <span className="font-semibold text-gray-700">{t("Total GST")}</span>
                    <span className="font-semibold">₹{invoice.gst_amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title="Record Payment" size="sm">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">Invoice</span>
              <span className="font-medium">{invoice.invoice_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Balance Due</span>
              <span className="font-semibold text-amber-600">₹{invoice.balance_due.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Amount (₹)</label>
            <input
              type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
              min={1} max={invoice.balance_due}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white">
              <option value="bank_transfer">Bank Transfer / NEFT</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash</option>
              <option value="rtgs">RTGS</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Reference No. (optional)</label>
            <input
              type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)}
              placeholder="UTR / Cheque no. / Transaction ID"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowPayModal(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
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
      </Modal>

      {/* Print Preview Modal */}
      <Modal open={showPrintPreview} onClose={() => setShowPrintPreview(false)} title={`Print ${invoice.status === 'paid' ? 'Receipt' : 'Invoice'}`} size="xl">
        <div className="bg-gray-50 rounded-xl overflow-hidden shadow-inner max-h-[70vh] overflow-y-auto border border-gray-200 relative">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 bg-sidebar text-white rounded-lg shadow font-medium text-sm hover:bg-sidebar-dark flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print PDF
            </button>
            {!letterhead && (
              <button onClick={() => setShowSettings(true)} className="px-4 py-2 bg-white text-sidebar rounded-lg shadow font-medium text-sm hover:bg-gray-50 border border-gray-200">
                Configure Letterhead
              </button>
            )}
          </div>
          
          <LetterheadPreview
            letterhead={letterhead || null}
            onConfigure={() => setShowSettings(true)}
            content={`
<div style="text-align: center; margin-bottom: 2rem;">
  <h2 style="margin: 0; font-size: 1.5rem;">${invoice.status === 'paid' ? t('PAYMENT RECEIPT') : t('INVOICE')}</h2>
  <div style="color: #666; font-size: 0.9rem;">${invoice.invoice_no} | Date: ${new Date(invoice.created_at).toLocaleDateString()}</div>
</div>

<div style="display: flex; justify-content: space-between; margin-bottom: 2rem; border-bottom: 2px solid #eee; padding-bottom: 1rem;">
  <div>
    <strong>${t("Billed To")}:</strong><br/>
    ${invoice.client_name}<br/>
    ${invoice.place_of_supply || ''}
  </div>
  <div style="text-align: right;">
    ${invoice.case_no ? `<strong>${t("Case")}:</strong> ${invoice.case_no}<br/>` : ''}
    ${invoice.due_date ? `<strong>${t("Due Date")}:</strong> ${invoice.due_date}` : ''}
  </div>
</div>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; text-align: left;">
  <thead>
    <tr style="border-bottom: 2px solid #ddd;">
      <th style="padding: 0.5rem 0;">${t("Description")}</th>
      <th style="padding: 0.5rem 0; text-align: center;">${t("Qty")}</th>
      <th style="padding: 0.5rem 0; text-align: right;">${t("Rate (₹)")}</th>
      <th style="padding: 0.5rem 0; text-align: right;">${t("Amount (₹)")}</th>
    </tr>
  </thead>
  <tbody>
    ${invoice.items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 0.5rem 0;">${item.description}</td>
        <td style="padding: 0.5rem 0; text-align: center;">${item.quantity}</td>
        <td style="padding: 0.5rem 0; text-align: right;">${item.rate.toLocaleString('en-IN')}</td>
        <td style="padding: 0.5rem 0; text-align: right;">${item.amount.toLocaleString('en-IN')}</td>
      </tr>
    `).join('')}
  </tbody>
</table>

<div style="display: flex; justify-content: flex-end; margin-bottom: 2rem;">
  <table style="width: 300px; text-align: right;">
    <tr><td style="padding: 0.25rem 0; color: #666;">${t("Subtotal")}:</td><td style="padding: 0.25rem 0;">₹${invoice.subtotal.toLocaleString('en-IN')}</td></tr>
    ${invoice.gst_rate > 0 ? (isIgst ? `<tr><td style="padding: 0.25rem 0; color: #666;">IGST (${invoice.gst_rate}%):</td><td style="padding: 0.25rem 0;">₹${invoice.gst_amount.toLocaleString('en-IN')}</td></tr>` : `<tr><td style="padding: 0.25rem 0; color: #666;">CGST (${invoice.gst_rate / 2}%):</td><td style="padding: 0.25rem 0;">₹${(invoice.gst_amount / 2).toLocaleString('en-IN')}</td></tr><tr><td style="padding: 0.25rem 0; color: #666;">SGST (${invoice.gst_rate / 2}%):</td><td style="padding: 0.25rem 0;">₹${(invoice.gst_amount / 2).toLocaleString('en-IN')}</td></tr>`) : ''}
    <tr><td style="padding: 0.5rem 0; font-weight: bold; border-top: 1px solid #ddd;">${t("Total")}:</td><td style="padding: 0.5rem 0; font-weight: bold; font-size: 1.2rem; border-top: 1px solid #ddd;">₹${invoice.total.toLocaleString('en-IN')}</td></tr>
    ${invoice.amount_paid > 0 ? `
      <tr><td style="padding: 0.25rem 0; color: #16a34a;">${t("Amount Paid")}:</td><td style="padding: 0.25rem 0; color: #16a34a;">₹${invoice.amount_paid.toLocaleString('en-IN')}</td></tr>
      <tr><td style="padding: 0.25rem 0; font-weight: bold; color: #d97706;">${t("Balance Due")}:</td><td style="padding: 0.25rem 0; font-weight: bold; color: #d97706;">₹${invoice.balance_due.toLocaleString('en-IN')}</td></tr>
    ` : ''}
  </table>
</div>

${invoice.notes ? `<div style="margin-top: 2rem;"><strong style="font-size: 0.8rem; color: #666; text-transform: uppercase;">Notes:</strong><p style="font-size: 0.9rem;">${invoice.notes}</p></div>` : ''}
            `}
          />
        </div>
      </Modal>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Configure Advocate Letterhead" size="xl">
        <LetterheadSettings />
      </Modal>
    </div>
  );
}
