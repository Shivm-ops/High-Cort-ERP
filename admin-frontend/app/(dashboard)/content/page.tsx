"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { FileText, BookOpen, Search, Eye, RefreshCw, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState("drafts");
  const [drafts, setDrafts] = useState<any[]>([]);
  const [tenantDrafts, setTenantDrafts] = useState<any[]>([]);
  const [caseLaws, setCaseLaws] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<{type: string, id: string, title: string} | null>(null);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === "drafts") {
        const res = await api.get("/admin/content/drafts");
        setDrafts(res.data);
      } else if (tab === "tenant-drafts") {
        const res = await api.get("/admin/content/tenant-drafts");
        setTenantDrafts(res.data);
      } else if (tab === "case-laws") {
        const res = await api.get("/admin/content/case-laws");
        setCaseLaws(res.data);
      }
    } catch (err) {
      toast.error(`Failed to fetch ${tab} data`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "draft") {
        await api.delete(`/admin/content/drafts/${itemToDelete.id}`);
      } else {
        await api.delete(`/admin/content/case-laws/${itemToDelete.id}`);
      }
      toast.success("Item deleted successfully");
      setItemToDelete(null);
      fetchData(activeTab);
    } catch (err) {
      toast.error("Failed to delete item");
      setItemToDelete(null);
    }
  };

  const renderDraftsTable = (data: any[]) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
      <div className="overflow-y-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((draft) => (
              <tr key={draft.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{draft.title || "Untitled Draft"}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{draft.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-700">{draft.author}</p>
                  <p className="text-xs text-gray-500">{draft.firm_name}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-md uppercase">
                    {draft.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">{new Date(draft.created_at).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setPreviewContent({ type: 'draft', data: draft })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" /> Preview
                    </button>
                    <button 
                      onClick={() => setItemToDelete({ type: 'draft', id: draft.id, title: draft.title || "Untitled Draft" })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">No drafts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCaseLawsTab = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
      <div className="overflow-y-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Case Title</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Citation</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Court</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {caseLaws.map((cl) => (
              <tr key={cl.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-bold text-gray-900">{cl.title}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-md uppercase whitespace-nowrap">
                    {cl.citation}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-700 font-medium">{cl.court}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">{new Date(cl.date).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setPreviewContent({ type: 'case_law', data: cl })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button 
                      onClick={() => setItemToDelete({ type: 'case_law', id: cl.id, title: cl.title })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {caseLaws.length === 0 && !loading && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">No case laws found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-8 h-full flex flex-col">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drafts & Case Laws</h1>
          <p className="text-gray-500 mt-1">Global repository of all legal documents and seeded case laws.</p>
        </div>
        <button 
          onClick={() => fetchData(activeTab)}
          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-4">
        {[
          { id: "drafts", label: "Global Templates", icon: FileText },
          { id: "tenant-drafts", label: "Tenant Drafts", icon: FileText },
          { id: "case-laws", label: "Case Law Repository", icon: BookOpen }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
              activeTab === tab.id 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-indigo-100" : "text-gray-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {activeTab === "drafts" && renderDraftsTable(drafts)}
            {activeTab === "tenant-drafts" && renderDraftsTable(tenantDrafts)}
            {activeTab === "case-laws" && renderCaseLawsTab()}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewContent && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gray-50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {previewContent.type === 'draft' ? previewContent.data.title || 'Untitled Draft' : previewContent.data.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {previewContent.type === 'draft' ? `Authored by ${previewContent.data.author}` : `${previewContent.data.citation} - ${previewContent.data.court}`}
                </p>
              </div>
              <button onClick={() => setPreviewContent(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 bg-white">
              {previewContent.type === 'draft' ? (
                <div 
                  className="prose prose-sm max-w-none prose-indigo"
                  dangerouslySetInnerHTML={{ __html: previewContent.data.content || '<p class="text-gray-400 italic">No content available.</p>' }}
                />
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Summary</h3>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                      {previewContent.data.summary}
                    </p>
                  </div>
                  {previewContent.data.url && (
                    <div>
                      <a href={previewContent.data.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 font-bold text-sm">
                        View Full Judgment Source &rarr;
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete {itemToDelete.type === 'draft' ? 'Draft' : 'Case Law'}?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to delete <span className="font-bold text-gray-900">{itemToDelete.title}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm shadow-red-200"
                >
                  Yes, Delete Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
