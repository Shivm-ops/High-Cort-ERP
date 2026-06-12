"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Shield, Plus, Lock, Check, Search, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Available permissions mapped out for the UI builder
  const PERMISSIONS = [
    { id: 'view_cases', label: 'View Cases', category: 'Cases' },
    { id: 'create_cases', label: 'Create Cases', category: 'Cases' },
    { id: 'delete_cases', label: 'Delete Cases', category: 'Cases' },
    { id: 'view_documents', label: 'View Evidence & Docs', category: 'Storage' },
    { id: 'upload_documents', label: 'Upload Documents', category: 'Storage' },
    { id: 'billing_access', label: 'View Billing & Ledger', category: 'Financials' },
    { id: 'create_invoices', label: 'Create Invoices', category: 'Financials' },
    { id: 'team_access', label: 'Manage Firm Team', category: 'Administration' },
    { id: 'draft_access', label: 'Access Global Drafts', category: 'Content' },
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/roles");
      setRoles(res.data);
    } catch (err) {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleCreateRole = async () => {
    if (!/^[a-zA-Z0-9 _-]+$/.test(newRoleName)) {
      toast.error("Invalid role name. Only alphanumeric, space, underscore, and dash allowed.");
      return;
    }
    try {
      setIsSaving(true);
      const res = await api.post("/admin/roles", { name: newRoleName, description: newRoleDesc });
      setRoles([...roles, res.data]);
      setIsModalOpen(false);
      setNewRoleName("");
      setNewRoleDesc("");
      toast.success("Role created securely.");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create role");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePermission = (permId: string) => {
    if (!selectedRole) return;
    const newPerms = { ...selectedRole.permissions, [permId]: !selectedRole.permissions[permId] };
    setSelectedRole({ ...selectedRole, permissions: newPerms });
    setRoles(roles.map(r => r.id === selectedRole.id ? { ...r, permissions: newPerms } : r));
  };

  const handleSaveChanges = async () => {
    if (!selectedRole) return;
    try {
      setIsSaving(true);
      await api.put(`/admin/roles/${selectedRole.id}`, { permissions: selectedRole.permissions });
      toast.success("Permissions updated successfully.");
    } catch (err) {
      toast.error("Failed to update permissions");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col max-w-7xl mx-auto">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role & Permission Management</h1>
          <p className="text-gray-500 mt-1">Configure custom RBAC roles and control granular module access.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">
          <Plus className="w-4 h-4" />
          Create New Role
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* Roles List */}
        <div className="col-span-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-400" />
            <h2 className="font-bold text-gray-800">Platform Roles</h2>
          </div>
          <div className="p-3 overflow-y-auto flex-1 space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={cn(
                  "w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all border",
                  selectedRole?.id === role.id ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-indigo-300 hover:bg-gray-50"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-gray-900">{role.name}</p>
                    {role.is_system && (
                      <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" /> System
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{role.description}</p>
                </div>
              </button>
            ))}
            {roles.length === 0 && (
              <p className="text-sm text-gray-500 p-4 text-center">No roles defined. Click &apos;Create New Role&apos;.</p>
            )}
          </div>
        </div>

        {/* Permission Builder Canvas */}
        <div className="col-span-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Permission Matrix</h2>
              <p className="text-sm text-gray-500 mt-1">Select a role on the left to configure its access.</p>
            </div>
            <button 
              onClick={handleSaveChanges} 
              disabled={!selectedRole || isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold text-sm rounded-lg transition-colors"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div className={cn("flex-1 overflow-y-auto p-6", !selectedRole ? "flex items-center justify-center bg-gray-50" : "bg-gray-50/50")}>
            {!selectedRole ? (
              <div className="text-center text-gray-400 max-w-sm mx-auto">
                <Shield className="w-16 h-16 mx-auto mb-4 opacity-20 text-indigo-500" />
                <h3 className="font-bold text-xl text-gray-700 mb-2">No Role Selected</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Please select a platform role from the left panel to view and modify its granular module permissions.</p>
              </div>
            ) : (
              <>
                {['Cases', 'Storage', 'Financials', 'Administration', 'Content'].map((category) => (
                  <div key={category} className="mb-8 last:mb-0">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
                      {category}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {PERMISSIONS.filter(p => p.category === category).map((perm) => (
                        <label key={perm.id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors shadow-sm">
                          <div className="relative flex items-center">
                            <input 
                              type="checkbox" 
                              checked={selectedRole?.permissions?.[perm.id] || false}
                              onChange={() => handleTogglePermission(perm.id)}
                              className="peer w-5 h-5 appearance-none rounded border-2 border-gray-300 checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer" 
                            />
                            <Check className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                          </div>
                          <span className="text-sm font-bold text-gray-700">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-[400px]">
            <h3 className="text-lg font-bold mb-4">Create New Role</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500">Role Name (Alphanumeric only)</label>
                <input 
                  type="text" 
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                  placeholder="e.g. Senior Paralegal"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Description</label>
                <input 
                  type="text" 
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleCreateRole} disabled={isSaving || !newRoleName} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:bg-gray-300">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
