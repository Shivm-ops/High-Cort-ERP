"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Users, Building2, RefreshCw, Pencil, Trash2, ExternalLink,
  Phone, Mail, MapPin, FileText, Briefcase, Calendar, ArrowRight, X,
  Clock, Scale, FolderOpen, CheckCircle, AlertCircle, ChevronRight
} from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ClientForm from "@/components/forms/ClientForm";
import CaseForm from "@/components/forms/CaseForm";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useClients, useClient, useClientStats, useDeleteClient, Client } from "@/lib/hooks/useClients";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

const TYPE_COLORS: Record<string, string> = {
  individual: "bg-blue-50 text-blue-700",
  corporate: "bg-purple-50 text-purple-700",
  government: "bg-orange-50 text-orange-700",
};

const CASE_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  stayed: "bg-blue-50 text-blue-700 border-blue-200",
  closed: "bg-gray-100 text-gray-700 border-gray-200",
  disposed: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function ClientsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddCase, setShowAddCase] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  const { data, isLoading, error } = useClients({ search: search || undefined, type: typeFilter || undefined });
  const { data: stats } = useClientStats();
  const deleteMutation = useDeleteClient();

  // Fetch full details and cases of selected client
  const { data: clientDetail, isLoading: isLoadingDetail } = useClient(selectedClient?.id || "");

  const handleDelete = async () => {
    if (!deleteClient) return;
    await deleteMutation.mutateAsync(deleteClient.id);
    if (selectedClient?.id === deleteClient.id) {
      setSelectedClient(null);
    }
    setDeleteClient(null);
  };

  const clientCases = clientDetail?.cases || [];

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header
        title="Clients CRM"
        subtitle="Manage your clients, relationships, and linked court matters"
        rightContent={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-sidebar px-4 py-2.5 text-sm font-semibold text-white hover:bg-sidebar-dark transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Client
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* CRM Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Clients", value: stats?.total ?? "—", icon: Users, color: "text-blue-600 bg-blue-50" },
            { label: "Individual", value: stats?.individual ?? "—", icon: Users, color: "text-green-600 bg-green-50" },
            { label: "Corporate", value: stats?.corporate ?? "—", icon: Building2, color: "text-purple-600 bg-purple-50" },
            { label: "Fees Outstanding", value: stats ? `₹${(stats.fees_outstanding / 100000).toFixed(1)}L` : "—", icon: RefreshCw, color: "text-amber-600 bg-amber-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color.split(" ")[1]}`}>
                <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients by name, phone or email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-sidebar/20 focus:border-sidebar bg-white shadow-sm"
            />
          </div>
          <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {["", "individual", "corporate", "government"].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={cn("px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors", typeFilter === t ? "bg-sidebar text-white" : "text-gray-600 hover:bg-gray-50")}>
                {t === "" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {selectedClient && (
            <button
              onClick={() => setSelectedClient(null)}
              className="px-3 py-2 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Close Cases Panel
            </button>
          )}
        </div>

        {/* Master-Detail Layout */}
        <div className={cn("grid gap-5 items-start", selectedClient ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1")}>
          {/* Client Table Column */}
          <div className={cn(selectedClient ? "lg:col-span-7" : "w-full")}>
            {isLoading ? (
              <TableSkeleton rows={6} cols={4} />
            ) : error ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center space-y-2">
                <p className="text-red-600 text-sm font-medium">Failed to load clients. Please check your network connection or try reloading.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <span className="text-sm font-bold text-gray-800">
                    {data?.total ?? 0} Client{data?.total !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-gray-400">
                    Click any client row to view their court cases
                  </span>
                </div>

                {!data?.clients.length ? (
                  <div className="py-16 text-center">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm font-semibold">No clients yet</p>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="mt-3 text-sm text-sidebar font-bold hover:underline"
                    >
                      Add your first client
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {data.clients.map((client) => {
                      const isSelected = selectedClient?.id === client.id;
                      return (
                        <div
                          key={client.id}
                          onClick={() => setSelectedClient(isSelected ? null : client)}
                          className={cn(
                            "flex items-center gap-4 px-5 py-4 transition-all cursor-pointer group border-l-4",
                            isSelected
                              ? "bg-sidebar/5 border-sidebar shadow-inner"
                              : "border-transparent hover:bg-gray-50/80"
                          )}
                        >
                          {/* Avatar */}
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-transform group-hover:scale-105",
                            client.type === "corporate" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {client.name.slice(0, 2).toUpperCase()}
                          </div>

                          {/* Client details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn("text-sm font-bold truncate transition-colors", isSelected ? "text-sidebar" : "text-gray-900")}>
                                {client.name}
                              </span>
                              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", TYPE_COLORS[client.type] || "bg-gray-100 text-gray-600")}>
                                {client.type}
                              </span>
                              {client.kyc_verified && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-bold border border-green-200">
                                  KYC ✓
                                </span>
                              )}
                              {isSelected && (
                                <span className="ml-auto text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sidebar text-white tracking-wider flex items-center gap-1">
                                  Cases Open <ChevronRight className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                              {client.phone && (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <Phone className="w-3 h-3 text-gray-400" />{client.phone}
                                </span>
                              )}
                              {client.email && (
                                <span className="flex items-center gap-1 text-gray-500 truncate max-w-[200px]">
                                  <Mail className="w-3 h-3 text-gray-400" />{client.email}
                                </span>
                              )}
                              {client.city && (
                                <span className="flex items-center gap-1 text-gray-400">
                                  <MapPin className="w-3 h-3" />{client.city}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Fees */}
                          {client.fees_outstanding > 0 && (
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-bold text-amber-600">₹{client.fees_outstanding.toLocaleString("en-IN")}</div>
                              <div className="text-[10px] text-gray-400 font-medium">due balance</div>
                            </div>
                          )}

                          {/* Action icons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/draft-workspace?clientId=${client.id}`);
                              }}
                              title="Draft Document for Client"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/clients/${client.id}`);
                              }}
                              title="Open Full Profile"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-sidebar hover:bg-sidebar/10 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditClient(client);
                              }}
                              title="Edit Client"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteClient(client);
                              }}
                              title="Deactivate Client"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Client Cases & Overview (Side Panel) */}
          {selectedClient && (
            <div className="lg:col-span-5 sticky top-4 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-lg overflow-hidden">
                {/* Panel Header */}
                <div className="p-5 bg-gradient-to-br from-[#013B36] to-[#014D46] text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-lg font-bold">
                        {selectedClient.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-white">{selectedClient.name}</h3>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-mint/20 text-[#6EE7B7]">
                            {selectedClient.type}
                          </span>
                        </div>
                        <div className="text-xs text-white/75 mt-0.5 flex items-center gap-3">
                          {selectedClient.phone && <span>📞 {selectedClient.phone}</span>}
                          {selectedClient.city && <span>📍 {selectedClient.city}</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Close panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Client Actions */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/15">
                    <button
                      onClick={() => setShowAddCase(true)}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white text-sidebar font-bold text-xs hover:bg-gray-100 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Case
                    </button>
                    <button
                      onClick={() => router.push(`/draft-workspace?clientId=${selectedClient.id}`)}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> Draft
                    </button>
                    <button
                      onClick={() => router.push(`/clients/${selectedClient.id}`)}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Full Profile
                    </button>
                  </div>
                </div>

                {/* Cases Section Header */}
                <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-sidebar" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Cases Linked ({clientCases.length})
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAddCase(true)}
                    className="text-xs font-bold text-sidebar hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Case
                  </button>
                </div>

                {/* Cases List */}
                <div className="p-4 max-h-[550px] overflow-y-auto space-y-3">
                  {isLoadingDetail ? (
                    <div className="space-y-3 py-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : !clientCases.length ? (
                    <div className="py-10 px-4 text-center bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
                      <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-gray-800">No cases found for {selectedClient.name}</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                        This client does not have any active court matters registered yet.
                      </p>
                      <button
                        onClick={() => setShowAddCase(true)}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-sidebar text-white rounded-xl text-xs font-bold hover:bg-sidebar-dark transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create First Case
                      </button>
                    </div>
                  ) : (
                    clientCases.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => router.push(`/cases/${c.id}`)}
                        className="p-4 rounded-xl border border-gray-200 hover:border-sidebar/40 bg-white hover:shadow-md transition-all cursor-pointer group"
                      >
                        {/* Case Number & Status */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                            {c.case_no}
                          </span>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold border", CASE_STATUS_COLORS[c.status] || "bg-gray-100 text-gray-700 border-gray-200")}>
                            {c.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-sidebar transition-colors line-clamp-2">
                          {c.title}
                        </h4>

                        {/* Meta info */}
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
                          <span className="font-semibold text-gray-700">{c.court}</span>
                          <span>•</span>
                          <span className="capitalize">{c.stage}</span>
                          {c.practice_area && (
                            <>
                              <span>•</span>
                              <span>{c.practice_area}</span>
                            </>
                          )}
                        </div>

                        {/* Next Hearing Date Badge */}
                        {c.next_hearing_date && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/70 w-fit">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            <span>Hearing: {new Date(c.next_hearing_date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                        )}

                        {/* Click to open */}
                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                          <span className="text-gray-400 font-medium">Open case matter</span>
                          <span className="inline-flex items-center gap-1 font-bold text-sidebar group-hover:translate-x-1 transition-transform">
                            View Case <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Client" size="lg">
        <ClientForm onSuccess={() => setShowCreate(false)} />
      </Modal>

      {/* Edit Client Modal */}
      <Modal open={!!editClient} onClose={() => setEditClient(null)} title="Edit Client" size="lg">
        {editClient && <ClientForm client={editClient} onSuccess={() => setEditClient(null)} />}
      </Modal>

      {/* Add Case for Selected Client Modal */}
      {selectedClient && (
        <Modal
          open={showAddCase}
          onClose={() => setShowAddCase(false)}
          title={`Create Case for ${selectedClient.name}`}
          size="xl"
        >
          <CaseForm
            defaultClientId={selectedClient.id}
            onSuccess={(caseId) => {
              setShowAddCase(false);
              queryClient.invalidateQueries({ queryKey: ["clients", selectedClient.id] });
              queryClient.invalidateQueries({ queryKey: ["clients"] });
              queryClient.invalidateQueries({ queryKey: ["cases"] });
              if (caseId) {
                router.push(`/cases/${caseId}`);
              }
            }}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteClient}
        onClose={() => setDeleteClient(null)}
        onConfirm={handleDelete}
        title="Remove Client"
        message={`Are you sure you want to deactivate ${deleteClient?.name}? This will hide them from your active client list.`}
        confirmLabel="Deactivate"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
