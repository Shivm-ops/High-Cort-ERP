"use client";

import React, { useState } from "react";
import {
  Building2,
  Search,
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Upload,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  HelpCircle,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const MAHARASHTRA_DISTRICTS = [
  "Pune",
  "Mumbai City",
  "Mumbai Suburban",
  "Thane",
  "Nashik",
  "Chhatrapati Sambhajinagar (Aurangabad)",
  "Nagpur",
  "Kolhapur",
  "Solapur",
  "Satara",
  "Ahmednagar",
  "Sangli",
  "Raigad",
  "Palghar",
  "Ratnagiri",
  "Sindhudurg",
  "Jalgaon",
  "Dhule",
  "Nandurbar",
  "Jalna",
  "Beed",
  "Latur",
  "Osmanabad (Dharashiv)",
  "Nanded",
  "Parbhani",
  "Hingoli",
  "Amravati",
  "Akola",
  "Yavatmal",
  "Buldhana",
  "Washim",
  "Wardha",
  "Chandrapur",
  "Gadchiroli",
  "Bhandara",
  "Gondia",
];

const PROPERTY_CATEGORIES = [
  { id: "agricultural_land", label: "शेती जमीन (Agricultural Land)", icon: "🌾", desc: "७/१२ उतारा, फेरफार व दिवाणी दावे" },
  { id: "residential_plot", label: "निवासी प्लॉट (Residential Plot)", icon: "📐", desc: "लेआउट मंजूरी व ७/१२ तपासणी" },
  { id: "na_plot", label: "अकृषक प्लॉट (NA Plot)", icon: "🏗️", desc: "कलेक्टर NA आदेश व बिनशेती दाखला" },
  { id: "flat_apartment", label: "फ्लॅट / सदनिका (Flat / Apartment)", icon: "🏢", desc: "सूची २ (Index II) व खरेदीखत" },
  { id: "commercial_property", label: "व्यावसायिक जागा (Commercial)", icon: "🏪", desc: "प्रॉपर्टी कार्ड व कमर्शियल टायटल" },
  { id: "industrial_property", label: "औद्योगिक भूखंड (Industrial)", icon: "🏭", desc: "MIDC अलॉटमेंट व इंडस्ट्री क्लिअरन्स" },
];

export default function PropertyLegalCheck({ lang = "mr" }: { lang?: string }) {
  // Form State
  const [propertyCategory, setPropertyCategory] = useState("agricultural_land");
  const [district, setDistrict] = useState("Pune");
  const [taluka, setTaluka] = useState("");
  const [villageCity, setVillageCity] = useState("");
  const [surveyNumber, setSurveyNumber] = useState("");
  const [gatNumber, setGatNumber] = useState("");
  const [ctsNumber, setCtsNumber] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [currentOwnerName, setCurrentOwnerName] = useState("");
  const [previousOwners, setPreviousOwners] = useState("");

  // Execution State
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [activeCheckId, setActiveCheckId] = useState<string | null>(null);

  // Document Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  // Advocate Verification State
  const [isRequestingLawyer, setIsRequestingLawyer] = useState(false);
  const [lawyerNotes, setLawyerNotes] = useState("");
  const [advocateOrderSuccess, setAdvocateOrderSuccess] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOwnerName.trim()) {
      toast.error("कृपया सध्याच्या मालकाचे / विक्रेत्याचे नाव भरा.");
      return;
    }
    if (!surveyNumber.trim() && !gatNumber.trim() && !ctsNumber.trim()) {
      toast.error("कृपया सर्व्हे क्र., गट क्र. किंवा सीटीएस (CTS) क्रमांकापैकी एक भरा.");
      return;
    }

    setIsSearching(true);
    setSearchResult(null);
    setAdvocateOrderSuccess(false);

    try {
      const payload = {
        property_category: propertyCategory,
        state: "Maharashtra",
        district: district,
        taluka: taluka,
        village_city: villageCity,
        survey_number: surveyNumber,
        gat_number: gatNumber,
        cts_number: ctsNumber,
        property_address: propertyAddress,
        current_owner_name: currentOwnerName,
        previous_owner_names: previousOwners
          ? previousOwners.split(",").map((s) => s.trim())
          : [],
        search_type: "detailed",
      };

      const res = await api.post("/property-check/search", payload);
      setSearchResult(res.data);
      setActiveCheckId(res.data.check_id);
      toast.success("कायदेशीर तपासणी अहवाल तयार झाला आहे!");
    } catch (err: any) {
      toast.error(getErrorMessage(err, "तपासणी दरम्यान त्रुटी आली. कृपया पुन्हा प्रयत्न करा."));
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeCheckId) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", "sale_deed");

    setIsUploading(true);
    try {
      const res = await api.post(`/property-check/${activeCheckId}/upload-document`, formData);
      toast.success("कागदपत्र यशस्वीरीत्या अपलोड व OCR तपासले गेले!");
      setUploadedDocs((prev) => [...prev, { filename: file.name, metadata: res.data.extracted_metadata }]);
      // Refresh check details
      const refreshed = await api.get(`/property-check/${activeCheckId}`);
      if (refreshed.data.result) {
        setSearchResult((prev: any) => ({
          ...prev,
          ...refreshed.data.result,
        }));
      }
    } catch (err) {
      toast.error("कागदपत्र अपलोड अयशस्वी.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRequestLawyer = async () => {
    if (!activeCheckId) return;
    setIsRequestingLawyer(true);
    try {
      await api.post(`/property-check/${activeCheckId}/request-advocate-opinion`, {
        client_notes: lawyerNotes,
        preferred_language: lang,
      });
      setAdvocateOrderSuccess(true);
      toast.success("वकिलांच्या टायटल पडताळणीसाठी विनंती पाठवली आहे!");
    } catch (err) {
      toast.error("विनंती नोंदवताना त्रुटी आली.");
    } finally {
      setIsRequestingLawyer(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Title Banner ── */}
      <div className="bg-gradient-to-r from-[#11213C] via-[#1C3259] to-[#0B1628] text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-[#1C3259]/60">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6551]/20 border border-[#FF6551]/40 text-[#F5EEDB] text-xs font-black">
            <Building2 className="w-3.5 h-3.5 text-[#FF6551]" />
            <span>महाराष्ट्र जमीन, प्लॉट व फ्लॅट टायटल तपासणी</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F5EEDB]">
            मालमत्ता कायदेशीर तपासणी & कोर्ट केस सर्च
          </h2>
          <p className="text-[#F5EEDB]/85 text-xs sm:text-sm max-w-2xl leading-relaxed">
            जमीन, प्लॉट किंवा फ्लॅट खरेदी करण्यापूर्वी ७/१२ उतारा, महाभूमी नोंदी, चालू दिवाणी दावे (Civil Court Cases),
            बँक बोजा आणि मालकी हक्काची साखळी (Chain of Title) एकाच ठिकाणी तपासा.
          </p>
        </div>
      </div>

      {/* ── Main Search Form ── */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        {/* 1. Category Selector */}
        <div>
          <label className="block text-xs font-black uppercase text-gray-700 tracking-wider mb-2">
            १. मालमत्तेचा प्रकार निवडा (Select Property Category)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PROPERTY_CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setPropertyCategory(cat.id)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer",
                  propertyCategory === cat.id
                    ? "border-[#FF6551] bg-[#F5EEDB]/40 text-[#11213C] shadow-xs ring-2 ring-[#FF6551]/20"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-xs font-black">{cat.label.split("(")[0]}</span>
                </div>
                <span className="text-[10px] text-gray-500">{cat.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Location & Identifiers */}
        <div>
          <label className="block text-xs font-black uppercase text-gray-700 tracking-wider mb-2">
            २. मालमत्ता पत्ता व क्रमांक (Location & Multiple Identifiers)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[11px] font-bold text-gray-600 mb-1 block">जिल्हा (District) *</span>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {MAHARASHTRA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-600 mb-1 block">तालुका (Taluka)</span>
              <input
                type="text"
                value={taluka}
                onChange={(e) => setTaluka(e.target.value)}
                placeholder="उदा. हवेली, मुळशी..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-600 mb-1 block">गाव / शहर (Village / City)</span>
              <input
                type="text"
                value={villageCity}
                onChange={(e) => setVillageCity(e.target.value)}
                placeholder="उदा. वाकड, बावधन..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div>
              <span className="text-[11px] font-bold text-gray-600 mb-1 block">सर्व्हे क्रमांक (Survey No.)</span>
              <input
                type="text"
                value={surveyNumber}
                onChange={(e) => setSurveyNumber(e.target.value)}
                placeholder="उदा. 45/1A"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-600 mb-1 block">गट क्रमांक (Gat No.)</span>
              <input
                type="text"
                value={gatNumber}
                onChange={(e) => setGatNumber(e.target.value)}
                placeholder="उदा. 102"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-600 mb-1 block">CTS क्र. / प्रॉपर्टी आयडी (CTS No.)</span>
              <input
                type="text"
                value={ctsNumber}
                onChange={(e) => setCtsNumber(e.target.value)}
                placeholder="उदा. 1204"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>
        </div>

        {/* 3. Parties */}
        <div>
          <label className="block text-xs font-black uppercase text-gray-700 tracking-wider mb-2">
            ३. मालक व विक्रेत्यांची नावे (Parties for Litigation & Title Search)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-bold text-gray-600 mb-1 block">सध्याच्या मालकाचे / विक्रेत्याचे नाव *</span>
              <input
                type="text"
                value={currentOwnerName}
                onChange={(e) => setCurrentOwnerName(e.target.value)}
                placeholder="उदा. रमेश किसनराव पाटील"
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-600 mb-1 block">मागील मालकांची नावे (स्वल्पविरामाने वेगळी करा)</span>
              <input
                type="text"
                value={previousOwners}
                onChange={(e) => setPreviousOwners(e.target.value)}
                placeholder="उदा. बाळकृष्ण कदम, आनंद जोशी"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSearching}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#FF6551] hover:bg-[#E8523E] text-white font-black text-xs rounded-xl shadow-md shadow-[#FF6551]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>तपासणी सुरू आहे (Checking Records)...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-[#F5EEDB]" />
                <span>कायदेशीर तपासणी अहवाल मिळवा (Execute Legal Check)</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Search Results Presentation ── */}
      {searchResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Risk Verdict Banner */}
          <div
            className={cn(
              "rounded-2xl p-6 border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
              searchResult.risk_category === "records_found"
                ? "bg-[#F5EEDB]/40 border-emerald-300 text-emerald-950"
                : searchResult.risk_category === "further_verification_required"
                ? "bg-[#FFF8EE] border-amber-300 text-amber-950"
                : searchResult.risk_category === "source_unavailable"
                ? "bg-[#FFF0EE] border-red-300 text-red-950"
                : "bg-slate-50 border-slate-300 text-slate-900"
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-white/80 border">
                  {searchResult.risk_category === "records_found"
                    ? "🟢 अधिकृत नोंद आढळली (Records Found)"
                    : searchResult.risk_category === "further_verification_required"
                    ? "🟡 पुढील पडताळणी आवश्यक (Further Verification Required)"
                    : searchResult.risk_category === "source_unavailable"
                    ? "🔴 स्त्रोत अनुपलब्ध (Source Unavailable)"
                    : "⚪ कोणतीही नोंद आढळली नाही (No Record Found)"}
                </span>
                <span className="text-xs font-black">जोखीम निर्देशांक: {searchResult.risk_score}/100</span>
              </div>
              <p className="text-xs sm:text-sm font-bold leading-relaxed">{searchResult.summary_verdict}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={searchResult.report_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#11213C] hover:bg-[#0B1628] text-[#F5EEDB] rounded-xl text-xs font-bold shadow-sm border border-[#F5EEDB]/20"
              >
                <Download className="w-3.5 h-3.5 text-[#FF6551]" />
                <span>PDF अहवाल डाउनलोड करा</span>
              </a>
            </div>
          </div>

          {/* Discrepancies Alert Box */}
          {searchResult.discrepancies?.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase text-red-800 tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                महत्त्वाच्या तफावती व कायदेशीर धोके (Identified Inconsistencies & Risks)
              </h3>
              <div className="space-y-2">
                {searchResult.discrepancies.map((d: any, idx: number) => (
                  <div key={idx} className="p-3 bg-red-50/50 border-l-4 border-red-500 rounded-r-lg space-y-0.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-gray-900">{d.title}</strong>
                      <span className="text-[10px] font-black px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                        {d.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{d.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Court Litigation Match Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-700" />
                न्यायालयीन खटले व वाद (Court Case Search - eCourts India)
              </h3>
              <span className="text-xs text-gray-500 font-medium">
                {searchResult.court_cases?.length || 0} खटले आढळले
              </span>
            </div>

            {searchResult.court_cases?.length > 0 ? (
              <div className="space-y-3">
                {searchResult.court_cases.map((cc: any, idx: number) => (
                  <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="text-xs font-black text-gray-900">{cc.case_type}</span>
                        <span className="text-xs text-gray-500"> (केस क्र: {cc.case_number})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                            cc.relevance_tier === "HIGH"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          )}
                        >
                          मालमत्ता संबंध: {cc.relevance_tier}
                        </span>
                        <span className="text-xs font-bold text-gray-700">स्थिती: {cc.status}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      <strong>कोर्ट:</strong> {cc.court_name} | <strong>CNR:</strong> {cc.cnr_number}
                    </div>
                    <div className="text-xs text-gray-700">
                      <strong>वादी:</strong> {cc.petitioner} &bull; <strong>प्रतिवादी:</strong> {cc.respondent}
                    </div>
                    <div className="p-2 bg-white rounded border border-gray-200 text-[11px] text-gray-500 italic">
                      💡 {cc.relevance_reason}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>तपासलेल्या जिल्हा व उच्च न्यायालयांच्या नोंदीत या पक्षकाराविरुद्ध कोणताही प्रतिकूल खटला आढळला नाही.</span>
              </div>
            )}
          </div>

          {/* Maharashtra Land Records (7/12) */}
          {searchResult.land_records?.satbara_7_12 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                महाभूमी अधिकृत ७/१२ उतारा नोंदी (MahaBhumi 7/12 Satbara)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 block">गट / सर्व्हे क्र.</span>
                  <strong className="text-gray-900">{searchResult.land_records.satbara_7_12.survey_gat_number}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">एकूण क्षेत्र (हेक्टर)</span>
                  <strong className="text-gray-900">{searchResult.land_records.satbara_7_12.total_area_hectares} हे.</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">पोटखराबा</span>
                  <strong className="text-gray-900">{searchResult.land_records.satbara_7_12.pot_kharaba} हे.</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">बँक बोजा नोंद</span>
                  <strong className={searchResult.land_records.satbara_7_12.has_bank_charge_flag ? "text-red-600" : "text-emerald-600"}>
                    {searchResult.land_records.satbara_7_12.has_bank_charge_flag ? "होय (बोजा आढळला)" : "नाही (निरंक)"}
                  </strong>
                </div>
              </div>
              <div className="text-xs text-gray-700 pt-1">
                <strong>नोंदणीकृत खातेदार (Owners):</strong>{" "}
                {searchResult.land_records.satbara_7_12.owners?.join(", ") || "माहिती उपलब्ध नाही"}
              </div>
            </div>
          )}

          {/* Document Upload & OCR Matching */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-700" />
              कागदपत्रे अपलोड व मजकूर पडताळणी (Upload Deeds & OCR Check)
            </h3>
            <p className="text-xs text-gray-500">
              खरेदीखत (Sale Deed), इंडेक्स २ (Index II) किंवा फेरफार प्रत अपलोड करा. सिस्टीम त्यातील सर्व्हे क्रमांक व मालकांची नावे सरकारी नोंदींशी ताडून पाहील.
            </p>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl border border-gray-300 transition">
                <Upload className="w-3.5 h-3.5 text-gray-600" />
                <span>कागदपत्र निवडा (PDF / Image)</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
              {isUploading && <span className="text-xs text-gray-500 font-medium">अपलोड व OCR प्रक्रिया सुरू आहे...</span>}
            </div>

            {uploadedDocs.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {uploadedDocs.map((doc, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs flex items-center justify-between">
                    <span className="font-bold text-gray-800">{doc.filename}</span>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      ओळखलेले सर्व्हे क्र.: {doc.metadata?.identified_survey_numbers?.join(", ") || "काही नाही"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advocate Verification Request Card */}
          <div className="bg-gradient-to-r from-[#F5EEDB]/60 via-white to-[#F5EEDB]/40 rounded-2xl border border-[#E8DFC9] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#11213C] text-[#FF6551] rounded-xl shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#11213C]">
                  वकिलांमार्फत प्रत्यक्ष टायटल शोध व कायदेशीर सल्ला (Advocate Title Opinion)
                </h3>
                <p className="text-xs text-gray-600">
                  ३० वर्षांची मूळ खरेदीखते, कोर्ट केसेस व प्रत्यक्ष मालकी हक्काची खात्री करून अधिकृत कायदेशीर टायटल रिपोर्ट मिळवा.
                </p>
              </div>
            </div>

            {!advocateOrderSuccess ? (
              <div className="space-y-3 pt-2">
                <textarea
                  value={lawyerNotes}
                  onChange={(e) => setLawyerNotes(e.target.value)}
                  placeholder="आपली काही विशेष विचारणा असल्यास येथे लिहा (उदा. सदर जमिनीवर बँकेचे कर्ज आहे का, वारसा हक्काचा वाद आहे का)..."
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF6551]/30"
                  rows={2}
                />
                <button
                  onClick={handleRequestLawyer}
                  disabled={isRequestingLawyer}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#FF6551] hover:bg-[#E8523E] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isRequestingLawyer ? (
                    <span>नोंदणी सुरू आहे...</span>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 text-[#F5EEDB]" />
                      <span>वकिलांची पडताळणी बुक करा (Book Advocate Verification)</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-emerald-300 text-xs text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>आपली विनंती नोंदवण्यात आली आहे. आमचे तज्ज्ञ वकील आपल्याशी लवकरच संपर्क साधतील.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
