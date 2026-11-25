"use client";

import React, { useState, useEffect } from "react";
import {
  FileImage,
  Save,
  Type,
  LayoutTemplate,
  Image as ImageIcon,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguageStore } from "@/lib/store/languageStore";
import { api, getErrorMessage } from "@/lib/api";

const LANG_OPTIONS = [
  { code: "en", label: "English" },
  { code: "mr", label: "मराठी" },
  { code: "hi", label: "हिन्दी" },
  { code: "gu", label: "ગુજરાતી" },
] as const;

type LangMap = { en: string; mr: string; hi: string; gu: string };

const EMPTY_LANG_MAP: LangMap = { en: "", mr: "", hi: "", gu: "" };

function safeParseLangMap(raw?: string | null): LangMap {
  if (!raw) return { ...EMPTY_LANG_MAP };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        en: parsed.en || "",
        mr: parsed.mr || "",
        hi: parsed.hi || "",
        gu: parsed.gu || "",
      };
    }
  } catch {
    return { ...EMPTY_LANG_MAP, en: raw };
  }
  return { ...EMPTY_LANG_MAP };
}

export default function LetterheadSettings() {
  const { documentLanguage } = useLanguageStore();
  const [activeLangTab, setActiveLangTab] = useState(documentLanguage || "en");

  const defaultFormData = {
    name: "Primary Letterhead",
    is_default: false,
    template_type: "traditional",
    applicable_docs: ["notice", "reply", "affidavit", "petition", "invoice"],
    header_content: { ...EMPTY_LANG_MAP },
    footer_content: { ...EMPTY_LANG_MAP },
    logo: "",
    signature: "",
    seal: "",
  };

  const [letterheads, setLetterheads] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string>("new");
  const [formData, setFormData] = useState<any>(defaultFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) =>
      setFormData((prev: any) => ({ ...prev, [field]: event.target?.result as string }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const toggleDoc = (docId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      applicable_docs: prev.applicable_docs.includes(docId)
        ? prev.applicable_docs.filter((d: string) => d !== docId)
        : [...prev.applicable_docs, docId],
    }));
  };

  const handleTextChange = (field: "header_content" | "footer_content", val: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: { ...prev[field], [activeLangTab]: val },
    }));
  };

  const setActiveLetterhead = (id: string, list: any[] = letterheads) => {
    setActiveId(id);
    setConfirmDelete(false);
    if (id === "new") {
      setFormData(defaultFormData);
      return;
    }
    const l = list.find((x) => x.id === id);
    if (l) {
      setFormData({
        name: l.name || "Unnamed Letterhead",
        is_default: Boolean(l.is_default),
        template_type: l.template_type || "traditional",
        applicable_docs: ["notice", "reply", "affidavit", "petition", "invoice"],
        logo: l.logo_base64 || "",
        signature: l.signature_base64 || "",
        seal: l.stamp_base64 || "",
        header_content: safeParseLangMap(l.custom_header_html),
        footer_content: safeParseLangMap(l.custom_footer_html),
      });
    }
  };

  const fetchLetterheads = async (isInitial = false, selectId?: string) => {
    try {
      const { data } = await api.get("/letterhead/");
      if (Array.isArray(data)) {
        setLetterheads(data);
        if (selectId) {
          setActiveLetterhead(selectId, data);
        } else if (isInitial && data.length > 0) {
          setActiveLetterhead(data[0].id, data);
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetterheads(true);
  }, []);

  const saveSettings = async () => {
    if (!formData.name?.trim()) {
      toast.error("Please enter a letterhead name.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        is_default: formData.is_default,
        template_type: formData.template_type,
        logo_base64: formData.logo || "",
        signature_base64: formData.signature || "",
        stamp_base64: formData.seal || "",
        custom_header_html: JSON.stringify(formData.header_content),
        custom_footer_html: JSON.stringify(formData.footer_content),
      };

      const res =
        activeId === "new"
          ? await api.post("/letterhead/", payload)
          : await api.put(`/letterhead/${activeId}`, payload);

      toast.success("Letterhead saved successfully!");
      await fetchLetterheads(false, res.data.id);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteLetterhead = async () => {
    if (activeId === "new") return;
    setDeleting(true);
    try {
      await api.delete(`/letterhead/${activeId}`);
      toast.success("Letterhead deleted!");
      setConfirmDelete(false);
      setActiveId("new");
      setFormData(defaultFormData);
      await fetchLetterheads(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const currentHeader = formData.header_content[activeLangTab] || "";
  const currentFooter = formData.footer_content[activeLangTab] || "";

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#013B36]" />
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 p-6"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-charcoal flex items-center gap-2">
            Letterhead Builder{" "}
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded-full border border-indigo-100">
              Multilingual
            </span>
          </h2>
          <p className="text-[12px] text-muted mt-1">
            Create and manage multiple letterheads for notices, replies, and invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeId !== "new" && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="h-9 px-4 rounded-xl border border-red-200 text-red-600 text-[12px] font-semibold hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
          {activeId !== "new" && confirmDelete && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-2 py-1">
              <span className="text-[11px] font-semibold text-red-700 px-1">Delete?</span>
              <button
                type="button"
                onClick={deleteLetterhead}
                disabled={deleting}
                className="h-7 px-2.5 rounded-lg bg-red-600 text-white text-[11px] font-semibold hover:bg-red-700"
              >
                {deleting ? "Deleting..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-7 px-2 rounded-lg text-gray-600 text-[11px] font-semibold hover:bg-white"
              >
                Cancel
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="h-9 px-4 rounded-xl bg-[#013B36] text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#014D46] transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving..." : "Save Letterhead"}
          </button>
        </div>
      </div>

      {/* Letterhead Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-gray-100 scrollbar-hide">
        {letterheads.map((l) => (
          <button
            type="button"
            key={l.id}
            onClick={() => setActiveLetterhead(l.id)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-xl text-[12px] font-semibold transition-all border",
              activeId === l.id
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            {l.name || "Unnamed"} {l.is_default && "★"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setActiveLetterhead("new")}
          className={cn(
            "whitespace-nowrap px-4 py-2 rounded-xl text-[12px] font-semibold transition-all border border-dashed flex items-center gap-1",
            activeId === "new"
              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-emerald-600"
          )}
        >
          <span className="text-lg leading-none mb-0.5">+</span> Create New
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1.5">
                Letterhead Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Firm Primary, Chambers Letterhead..."
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-indigo-300 text-charcoal"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-[12px] font-medium text-charcoal cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600"
                />
                Set as default letterhead
              </label>
            </div>
          </div>

          {/* Templates */}
          <div>
            <h3 className="text-[13px] font-semibold text-charcoal mb-3 flex items-center gap-1.5">
              <LayoutTemplate className="w-4 h-4 text-indigo-500" /> Template Layout
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: "traditional", label: "Traditional" },
                { id: "law_firm", label: "Law Firm" },
                { id: "corporate", label: "Corporate" },
                { id: "custom", label: "Custom" },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setFormData({ ...formData, template_type: t.id })}
                  className={cn(
                    "p-3 rounded-xl border text-[12px] font-semibold transition-all text-center",
                    formData.template_type === t.id
                      ? "border-[#013B36] bg-[#013B36]/5 text-[#013B36]"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Media Uploads */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-[13px] font-semibold text-charcoal mb-3 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-500" /> Branding Media
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "logo", label: "Firm Logo" },
                { id: "signature", label: "Digital Signature" },
                { id: "seal", label: "Official Seal" },
              ].map((item) => (
                <div
                  key={item.id}
                  className="border border-dashed border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors relative overflow-hidden h-28 bg-white group"
                >
                  {formData[item.id] ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <img src={formData[item.id]} alt={item.label} className="max-h-16 object-contain" />
                      <button
                        type="button"
                        onClick={() => setFormData((prev: any) => ({ ...prev, [item.id]: "" }))}
                        className="text-[10px] font-bold text-red-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <FileImage className="w-5 h-5 text-gray-300 mb-1 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-[11px] font-semibold text-gray-600">{item.label}</span>
                      <span className="text-[10px] text-gray-400">PNG/JPG ≤ 2 MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, item.id)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Multilingual Text Configurations */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-charcoal flex items-center gap-1.5">
                <Type className="w-4 h-4 text-purple-500" /> Letterhead Content
              </h3>
              <div className="flex bg-gray-100 p-0.5 rounded-lg">
                {LANG_OPTIONS.map((lang) => (
                  <button
                    type="button"
                    key={lang.code}
                    onClick={() => setActiveLangTab(lang.code)}
                    className={cn(
                      "px-3 py-1 text-[11px] font-bold rounded-md transition-all",
                      activeLangTab === lang.code
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1.5">
                  Header Text ({LANG_OPTIONS.find((l) => l.code === activeLangTab)?.label})
                </label>
                <textarea
                  placeholder={
                    activeLangTab === "en"
                      ? "Firm Name, Advocate Name, Address..."
                      : "संस्थेचे नाव, वकिलाचे नाव, पत्ता..."
                  }
                  className="w-full p-3 rounded-xl text-[12px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-purple-300 focus:bg-white transition-colors text-charcoal h-24 resize-none"
                  value={currentHeader}
                  onChange={(e) => handleTextChange("header_content", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1.5">
                  Footer Text ({LANG_OPTIONS.find((l) => l.code === activeLangTab)?.label})
                </label>
                <textarea
                  placeholder="Email, Website, Mobile, Disclaimer"
                  className="w-full p-3 rounded-xl text-[12px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-purple-300 focus:bg-white transition-colors text-charcoal h-24 resize-none"
                  value={currentFooter}
                  onChange={(e) => handleTextChange("footer_content", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Applicability */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-[13px] font-semibold text-charcoal mb-3">
              Auto-Apply To Documents
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "notice", label: "Notices" },
                { id: "reply", label: "Replies" },
                { id: "affidavit", label: "Affidavits" },
                { id: "petition", label: "Petitions" },
                { id: "application", label: "Applications" },
                { id: "complaint", label: "Complaints" },
                { id: "ws", label: "Written Statements" },
                { id: "appeal", label: "Appeals" },
                { id: "vakalatnama", label: "Vakalatnamas" },
                { id: "invoice", label: "Invoices" },
              ].map((doc) => {
                const isActive = formData.applicable_docs.includes(doc.id);
                return (
                  <button
                    type="button"
                    key={doc.id}
                    onClick={() => toggleDoc(doc.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors border",
                      isActive
                        ? "bg-[#013B36] text-white border-[#013B36]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {doc.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-charcoal">Live Preview</h3>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                {LANG_OPTIONS.find((l) => l.code === activeLangTab)?.label}
              </span>
            </div>

            <div className="bg-gray-100 w-full aspect-[1/1.414] rounded-xl border border-gray-200 p-4 flex flex-col justify-between shadow-inner relative overflow-hidden">
              <div className="text-center border-b border-gray-300 pb-2 relative z-10">
                {formData.logo && (
                  <img src={formData.logo} alt="Logo" className="h-8 mx-auto mb-1" />
                )}
                {currentHeader ? (
                  <div
                    className={cn(
                      "text-[6px] whitespace-pre-wrap leading-tight text-gray-800",
                      activeLangTab === "mr" || activeLangTab === "hi"
                        ? "font-['Noto_Sans_Devanagari']"
                        : "",
                      activeLangTab === "gu" ? "font-['Noto_Sans_Gujarati']" : ""
                    )}
                  >
                    {currentHeader}
                  </div>
                ) : (
                  <>
                    <div className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">
                      {formData.name || "Chambers Letterhead"}
                    </div>
                    <div className="text-[6px] text-gray-600 mt-0.5">
                      Advocates & Legal Consultants
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1 py-4 flex flex-col gap-2 relative z-10">
                <div className="text-[8px] font-bold text-center mb-2 uppercase text-gray-400">
                  Notice / Petition Body Content
                </div>
                <div className="w-3/4 h-2 bg-gray-200 rounded" />
                <div className="w-full h-2 bg-gray-200 rounded" />
                <div className="w-full h-2 bg-gray-200 rounded" />
                <div className="w-5/6 h-2 bg-gray-200 rounded" />
              </div>

              <div className="pt-2 border-t border-gray-300 text-center relative z-10">
                {currentFooter ? (
                  <div
                    className={cn(
                      "text-[5px] whitespace-pre-wrap leading-tight text-gray-600",
                      activeLangTab === "mr" || activeLangTab === "hi"
                        ? "font-['Noto_Sans_Devanagari']"
                        : "",
                      activeLangTab === "gu" ? "font-['Noto_Sans_Gujarati']" : ""
                    )}
                  >
                    {currentFooter}
                  </div>
                ) : (
                  <div className="text-[5px] text-gray-500">Footer details appear here</div>
                )}
                {formData.seal && (
                  <img src={formData.seal} alt="Seal" className="absolute right-0 bottom-4 h-12 opacity-80" />
                )}
                {formData.signature && (
                  <img src={formData.signature} alt="Signature" className="absolute left-0 bottom-4 h-8" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
