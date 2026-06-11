"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Users, Building2, RefreshCw, Pencil, Trash2, ExternalLink, Phone, Mail, MapPin } from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ClientForm from "@/components/forms/ClientForm";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useClients, useClientStats, useDeleteClient, Client } from "@/lib/hooks/useClients";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const TYPE_COLORS: Record<string, string> = {
  individual: "bg-blue-50 text-blue-700",
  corporate: "bg-purple-50 text-purple-700",
  government: "bg-orange-50 text-orange-700",
};

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  const { data, isLoading, error } = useClients({ search: search || undefined, type: typeFilter || undefined });
  const { data: stats } = useClientStats();
  const deleteMutation = useDeleteClient();

  const handleDelete = async () => {
    if (!deleteClient) return;
    await deleteMutation.mutateAsync(deleteClient.id);
    setDeleteClient(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="Clients CRM" subtitle="Manage your clients and their cases" />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Clients", value: stats?.total ?? "—", icon: Users, color: "text-blue-600 bg-blue-50" },
            { label: "Individual", value: stats?.individual ?? "—", icon: Users, color: "text-green-600 bg-green-50" },
            { label: "Corporate", value: stats?.corporate ?? "—", icon: Building2, color: "text-purple-600 bg-purple-50" },
            { label: "Fees Outstanding", value: stats ? `₹${(stats.fees_outstanding / 100000).toFixed(1)}L` : "—", icon: RefreshCw, color: "text-amber-600 bg-amber-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color.split(" ")[1]}`}>
                <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients by name, phone or email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white"
            />
          </div>
          <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden">
            {["", "individual", "corporate", "government"].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={cn("px-4 py-2.5 text-sm font-medium transition-colors", typeFilter === t ? "bg-sidebar text-white" : "text-gray-600 hover:bg-gray-50")}>
                {t === "" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-sidebar px-4 py-2.5 text-sm font-semibold text-white hover:bg-sidebar-dark transition-colors ml-auto">
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600 text-sm">Failed to load clients. Ensure the backend is running at localhost:8000</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{data?.total ?? 0} clients</span>
            </div>
            {!data?.clients.length ? (
              <div className="py-16 text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No clients yet</p>
                <button onClick={() => setShowCreate(true)}
                  className="mt-3 text-sm text-sidebar font-medium hover:underline">
                  Add your first client
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.clients.map((client) => (
                  <div key={client.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                    {/* Avatar */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0",
                      client.type === "corporate" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Name + type */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm truncate">{client.name}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", TYPE_COLORS[client.type] || "bg-gray-100 text-gray-600")}>
                          {client.type}
                        </span>
                        {client.kyc_verified && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">KYC ✓</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {client.phone && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone className="w-3 h-3" />{client.phone}
                          </span>
                        )}
                        {client.email && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 truncate max-w-[180px]">
                            <Mail className="w-3 h-3" />{client.email}
                          </span>
                        )}
                        {client.city && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />{client.city}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Fees */}
                    {client.fees_outstanding > 0 && (
                      <div className="text-right">
                        <div className="text-sm font-semibold text-amber-600">₹{client.fees_outstanding.toLocaleString("en-IN")}</div>
                        <div className="text-xs text-gray-400">outstanding</div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => router.push(`/clients/${client.id}`)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-sidebar hover:bg-sidebar/5 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditClient(client)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteClient(client)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Client" size="lg">
        <ClientForm onSuccess={() => setShowCreate(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editClient} onClose={() => setEditClient(null)} title="Edit Client" size="lg">
        {editClient && <ClientForm client={editClient} onSuccess={() => setEditClient(null)} />}
      </Modal>

      {/* Delete Confirm */}
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
