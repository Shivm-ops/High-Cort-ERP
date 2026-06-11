"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Phone, Mail, MapPin, Briefcase, Plus, ExternalLink, CheckCircle, AlertCircle, FileText, ImageIcon, Video, Music, File, Calendar, Shield, IndianRupee } from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import CaseForm from "@/components/forms/CaseForm";
import InvoiceForm from "@/components/forms/InvoiceForm";
import ClientForm from "@/components/forms/ClientForm";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { useClient } from "@/lib/hooks/useClients";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  urgent: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-700",
  stayed: "bg-blue-50 text-blue-700",
  closed: "bg-gray-50 text-gray-600",
  disposed: "bg-gray-50 text-gray-600",
};

function DocIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    photo: <ImageIcon className="w-4 h-4 text-blue-500" />,
    video: <Video className="w-4 h-4 text-purple-500" />,
    audio: <Music className="w-4 h-4 text-green-500" />,
  };
  return <>{icons[type] || <FileText className="w-4 h-4 text-gray-400" />}</>;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: client, isLoading, error } = useClient(id);
  const [showAddCase, setShowAddCase] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "cases" | "documents" | "evidence" | "invoices">("overview");

  if (isLoading) return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="Loading..." subtitle="" />
      <div className="p-6"><FormSkeleton /></div>
    </div>
  );

  if (error || !client) return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="Client not found" subtitle="" />
      <div className="p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-gray-600 text-sm">Could not load client.</p>
        <button onClick={() => router.back()} className="mt-3 text-sidebar text-sm font-medium hover:underline">← Go back</button>
      </div>
    </div>
  );

  const allDocs = client.documents || [];
  const documents = allDocs.filter((d) => !d.is_evidence);
  const evidence = allDocs.filter((d) => d.is_evidence);

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title={client.name} subtitle={`${client.type.charAt(0).toUpperCase() + client.type.slice(1)} Client · ${client.city || "Location not set"}`} />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </button>

        {/* Matter Summary */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Cases", value: client.total_cases_count ?? 0, color: "text-gray-900" },
            { label: "Active Cases", value: client.active_cases_count ?? 0, color: "text-green-600" },
            { label: "Closed Cases", value: client.closed_cases_count ?? 0, color: "text-gray-500" },
            { label: "Upcoming Hearings", value: client.upcoming_hearings_count ?? 0, color: "text-amber-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <div className={cn("text-2xl font-bold", color)}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Left: Client info */}
          <div className="col-span-1 space-y-4">

            {/* Profile */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {client.photograph_url ? (
                    <img src={client.photograph_url} alt={client.name} className="w-16 h-16 rounded-2xl object-cover border border-gray-100" />
                  ) : (
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold",
                      client.type === "corporate" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="font-semibold text-gray-900 text-sm">{client.name}</h2>
                    <p className="text-xs text-gray-400 capitalize">{client.type}</p>
                    {client.occupation && <p className="text-xs text-gray-400">{client.occupation}</p>}
                  </div>
                </div>
                <button onClick={() => setShowEdit(true)} className="p-2 rounded-lg text-gray-400 hover:text-sidebar hover:bg-sidebar/5 flex-shrink-0">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{client.phone}{client.alternate_phone ? ` / ${client.alternate_phone}` : ""}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {client.email}
                  </div>
                )}
                {(client.city || client.state || client.address) && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs">{[client.address, client.city, client.state, client.pincode].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {client.date_of_birth && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> DOB: {client.date_of_birth}
                  </div>
                )}
              </div>
              {client.kyc_verified && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> KYC Verified
                </div>
              )}
            </div>

            {/* Identification */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-3.5 h-3.5 text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Identification</h3>
              </div>
              <div className="space-y-2 text-sm">
                {client.pan && (
                  <div className="flex justify-between"><span className="text-gray-500 text-xs">PAN</span><span className="font-mono font-medium text-gray-900 text-xs">{client.pan}</span></div>
                )}
                {client.aadhaar_number && (
                  <div className="flex justify-between"><span className="text-gray-500 text-xs">Aadhaar</span><span className="font-mono font-medium text-gray-900 text-xs">XXXX XXXX {client.aadhaar_number.slice(-4)}</span></div>
                )}
                {client.gstin && (
                  <div className="flex justify-between"><span className="text-gray-500 text-xs">GSTIN</span><span className="font-mono font-medium text-gray-900 text-xs">{client.gstin}</span></div>
                )}
                {!client.pan && !client.aadhaar_number && !client.gstin && (
                  <p className="text-xs text-gray-400 text-center py-1">No IDs on file · Edit to add</p>
                )}
              </div>
            </div>

            {/* Fees */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Financials</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Fees Outstanding</span>
                  <span className="font-semibold text-amber-600 text-sm">₹{(client.fees_outstanding || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Total Invoices</span>
                  <span className="font-medium text-sm">{client.invoices?.length || 0}</span>
                </div>
              </div>
            </div>

            {client.company_name && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Organisation</h3>
                <div className="font-medium text-gray-900 text-sm">{client.company_name}</div>
                {client.contact_person && <div className="text-xs text-gray-500 mt-0.5">Contact: {client.contact_person}</div>}
              </div>
            )}
          </div>

          {/* Right: Tab content */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {(["overview", "cases", "documents", "evidence", "invoices"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn("px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                    activeTab === tab ? "bg-sidebar text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === "cases" && <span className={cn("ml-1.5 text-xs rounded-full px-1.5 py-0.5", activeTab === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500")}>{client.cases?.length || 0}</span>}
                  {tab === "documents" && <span className={cn("ml-1.5 text-xs rounded-full px-1.5 py-0.5", activeTab === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500")}>{documents.length}</span>}
                  {tab === "evidence" && <span className={cn("ml-1.5 text-xs rounded-full px-1.5 py-0.5", activeTab === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500")}>{evidence.length}</span>}
                  {tab === "invoices" && <span className={cn("ml-1.5 text-xs rounded-full px-1.5 py-0.5", activeTab === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500")}>{client.invoices?.length || 0}</span>}
                </button>
              ))}
              {(activeTab === "cases" || activeTab === "invoices") && (
                <button onClick={() => activeTab === "cases" ? setShowAddCase(true) : setShowAddInvoice(true)}
                  className="ml-auto flex items-center gap-1.5 rounded-xl bg-mint/10 px-3 py-2 text-sm font-medium text-sidebar hover:bg-mint/20">
                  <Plus className="w-4 h-4" /> {activeTab === "cases" ? "Add Case" : "Create Invoice"}
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden min-h-[400px]">

              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div className="p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Client Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Full Name", value: client.name },
                      { label: "Client Type", value: client.type.charAt(0).toUpperCase() + client.type.slice(1) },
                      { label: "Mobile", value: client.phone || "—" },
                      { label: "Alternate Mobile", value: client.alternate_phone || "—" },
                      { label: "Email", value: client.email || "—" },
                      { label: "Occupation", value: client.occupation || "—" },
                      { label: "Date of Birth", value: client.date_of_birth || "—" },
                      { label: "PAN Number", value: client.pan || "—" },
                      { label: "Aadhaar No.", value: client.aadhaar_number ? `XXXX XXXX ${client.aadhaar_number.slice(-4)}` : "—" },
                      { label: "Address", value: [client.address, client.city, client.state, client.pincode].filter(Boolean).join(", ") || "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                        <div className="font-medium text-gray-900 text-sm">{value}</div>
                      </div>
                    ))}
                  </div>
                  {client.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <div className="text-xs font-semibold text-amber-700 mb-1">Notes</div>
                      <p className="text-sm text-amber-900 whitespace-pre-wrap">{client.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* CASES */}
              {activeTab === "cases" && (
                !client.cases?.length ? (
                  <div className="py-16 text-center">
                    <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No cases yet</p>
                    <button onClick={() => setShowAddCase(true)} className="mt-2 text-sm text-sidebar hover:underline">Add first case</button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {client.cases.map((c) => (
                      <div key={c.id} onClick={() => router.push(`/cases/${c.id}`)}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="font-medium text-gray-900 text-sm font-mono text-xs">{c.case_no}</span>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[c.status] || "bg-gray-100 text-gray-600")}>{c.status}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
                            <span>{c.practice_area}</span><span>·</span>
                            <span>{c.court}</span><span>·</span>
                            <span className="capitalize">{c.stage}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {c.next_hearing_date && <div className="text-xs text-amber-600 font-medium">{c.next_hearing_date}</div>}
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-sidebar transition-colors flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* DOCUMENTS */}
              {activeTab === "documents" && (
                !documents.length ? (
                  <div className="py-16 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No documents uploaded</p>
                    <p className="text-xs text-gray-400 mt-1">Aadhaar, PAN, Photo, Identity Proofs, Other documents</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {documents.map((d) => (
                      <div key={d.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                        <DocIcon type={d.doc_type} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{d.name}</div>
                          <div className="text-xs text-gray-400 capitalize">{d.doc_type.replace(/_/g, " ")} {d.file_size ? `· ${formatFileSize(d.file_size)}` : ""}</div>
                        </div>
                        {d.description && <span className="text-xs text-gray-400 truncate max-w-[120px]">{d.description}</span>}
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* EVIDENCE */}
              {activeTab === "evidence" && (
                !evidence.length ? (
                  <div className="py-16 text-center">
                    <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No evidence uploaded</p>
                    <p className="text-xs text-gray-400 mt-1">Photos, Videos, Audio, PDFs, Court documents</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {evidence.map((d) => (
                      <div key={d.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                        <DocIcon type={d.doc_type} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{d.name}</div>
                          <div className="text-xs text-gray-400 capitalize">{d.doc_type.replace(/_/g, " ")} {d.file_size ? `· ${formatFileSize(d.file_size)}` : ""}</div>
                          {d.description && <div className="text-xs text-gray-500 mt-0.5">{d.description}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* INVOICES */}
              {activeTab === "invoices" && (
                !client.invoices?.length ? (
                  <div className="py-16 text-center">
                    <p className="text-gray-500 text-sm">No invoices yet</p>
                    <button onClick={() => setShowAddInvoice(true)} className="mt-2 text-sm text-sidebar hover:underline">Create first invoice</button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {client.invoices.map((inv) => (
                      <div key={inv.id} onClick={() => router.push(`/billing/${inv.id}`)}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer group">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 text-sm">{inv.invoice_no}</span>
                          <p className="text-xs text-gray-500 mt-0.5">{inv.due_date ? `Due: ${inv.due_date}` : "No due date"}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 text-sm">₹{inv.total.toLocaleString("en-IN")}</div>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                            inv.status === "paid" ? "bg-green-50 text-green-700" :
                            inv.status === "overdue" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700")}>
                            {inv.status}
                          </span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-sidebar opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal open={showAddCase} onClose={() => setShowAddCase(false)} title="New Case" size="xl">
        <CaseForm defaultClientId={id} onSuccess={(caseId) => { setShowAddCase(false); if (caseId) router.push(`/cases/${caseId}`); }} />
      </Modal>
      <Modal open={showAddInvoice} onClose={() => setShowAddInvoice(false)} title="Create Invoice" size="lg">
        <InvoiceForm defaultClientId={id} onSuccess={() => setShowAddInvoice(false)} />
      </Modal>
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Client" size="lg">
        <ClientForm client={client} onSuccess={() => setShowEdit(false)} />
      </Modal>
    </div>
  );
}
