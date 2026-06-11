"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, UploadCloud, FileText, Languages, ChevronDown, CheckCircle, 
  Loader2, Wand2, Download, Printer, Save, FileCheck, Layers, Scale, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMyLetterhead } from "@/lib/hooks/useLetterhead";
import LetterheadPreview from "@/components/drafts/LetterheadPreview";
import LetterheadSettings from "@/components/settings/LetterheadSettings";
import Modal from "@/components/ui/Modal";

const CLIENTS = [
  { id: "c1", name: "Ramesh Patel", phone: "9876543210" },
  { id: "c2", name: "ABC Corp", phone: "8765432109" },
  { id: "c3", name: "Suresh Desai", phone: "7654321098" },
];

const MATTERS = [
  { id: "m1", name: "Cheque Dishonour u/s 138" },
  { id: "m2", name: "Property Dispute - Plot 44" },
  { id: "m3", name: "Writ Petition No. 1209" },
];

const TEMPLATES = [
  { id: "t1", name: "Liability Denial Reply (Cheque Bounce)", type: "Cheque Bounce", matchScore: 98 },
  { id: "t2", name: "Standard Dispute Reply", type: "General", matchScore: 85 },
  { id: "t3", name: "Settlement Offer Reply", type: "Cheque Bounce", matchScore: 75 },
];

export default function NoticeReplyBuilder() {
  const router = useRouter();
  
  // States
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "ocr" | "done">("idle");
  const [parsedData, setParsedData] = useState<{ type: string; language: string; opponent: string; date: string } | null>(null);
  
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedMatter, setSelectedMatter] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("t1");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  
  const [draftGenerated, setDraftGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  
  const { data: myLetterhead } = useMyLetterhead();
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleUpload = () => {
    if (uploadState !== "idle") return;
    setUploadState("uploading");
    
    // Simulate upload delay
    setTimeout(() => {
      setUploadState("ocr");
      
      // Simulate OCR delay
      setTimeout(() => {
        setUploadState("done");
        setParsedData({
          type: "Cheque Bounce Notice (u/s 138)",
          language: "English",
          opponent: "Ramesh Patel",
          date: "12 May 2025"
        });
        setSelectedClient("c3"); // Suresh Desai
        setSelectedMatter("m1"); // Cheque Dishonour
        toast.success("Notice processed successfully!");
      }, 2500);
      
    }, 1500);
  };

  const handleGenerateReply = () => {
    setIsGenerating(true);
    setDraftGenerated(false);
    
    setTimeout(() => {
      setIsGenerating(false);
      setDraftGenerated(true);
      
      let content = "";
      if (selectedLanguage.includes("Marathi")) {
        content = `नोंदणीकृत ए.डी. / स्पीड पोस्ट / कुरिअर

प्रति,
अ‍ॅड. रमेश पटेल
१०२, लीगल चेंबर्स, जिल्हा न्यायालय रोड,
मुंबई, महाराष्ट्र ४००००१

संदर्भ: आपल्या अशिलाच्या वतीने पाठविलेल्या दिनांक १२ मे २०२५ च्या कायदेशीर नोटीसला उत्तर.

महोदय,

माझे अशील, श्री. सुरेश देसाई (यापुढे "माझे अशील" म्हणून संदर्भित) यांच्या सूचनेनुसार आणि त्यांच्या वतीने, मी आपल्या दिनांक १२ मे २०२५ च्या कायदेशीर नोटीसला खालीलप्रमाणे उत्तर देत आहे:

१. आपल्या नोटीसमधील मजकूर, जो रेकॉर्डचा भाग आहे तो वगळता, पूर्णपणे खोटा, बिनबुडाचा आणि त्रासदायक आहे, त्यामुळे तो पूर्णपणे नाकारला जात आहे.

२. माझे अशील आपल्या अशिलाचे कोणतेही कायदेशीर कर्ज किंवा उत्तरदायित्व देणे लागत नाहीत, हे ठामपणे नाकारले जाते. चेक क्रमांक ००१२३४ हा केवळ सुरुवातीच्या व्यावसायिक व्यवहारादरम्यान सुरक्षितता म्हणून दिला होता आणि तो वटवण्यासाठी नव्हता.

३. आपल्या अशिलाने माझ्या अशिलाकडून पैसे उकळण्याच्या वाईट हेतूने सुरक्षिततेसाठी दिलेल्या चेकचा गैरवापर केला आहे.

४. या उत्तराच्या पावतीपासून ७ दिवसांच्या आत आपण आपल्या अशिलाला सदर नोटीस मागे घेण्याचा सल्ला द्यावा, असे आपणास कळवण्यात येत आहे. तसे न केल्यास, माझे अशील आपल्या अशिलाविरुद्ध दिवाणी आणि फौजदारी दोन्ही योग्य कायदेशीर कार्यवाही सुरू करण्यास बांधील असतील, ज्याचा संपूर्ण धोका आणि खर्च आपल्या अशिलाचा असेल.

या उत्तराची एक प्रत भविष्यातील संदर्भासाठी माझ्या कार्यालयात जतन केली आहे.

आपला विश्वासू,


अ‍ॅड. राजेश शर्मा
मॅनेजिंग पार्टनर
शर्मा आणि असोसिएट्स`;
      } else if (selectedLanguage.includes("Hindi")) {
        content = `पंजीकृत ए.डी. / स्पीड पोस्ट / कूरियर

प्रति,
एड. रमेश पटेल
102, लीगल चैंबर्स, जिला न्यायालय रोड,
मुंबई, महाराष्ट्र 400001

विषय: आपके मुवक्किल की ओर से जारी दिनांक 12 मई 2025 के कानूनी नोटिस का उत्तर।

महोदय,

मेरे मुवक्किल, श्री सुरेश देसाई (जिन्हें इसके बाद "मेरे मुवक्किल" के रूप में संदर्भित किया जाएगा) के निर्देशों के तहत और उनकी ओर से, मैं आपके दिनांक 12 मई 2025 के कानूनी नोटिस का उत्तर इस प्रकार देता हूँ:

1. आपके नोटिस की विषय-वस्तु, सिवाय इसके जो रिकॉर्ड का मामला है, पूरी तरह से झूठी, आधारहीन और परेशान करने वाली है और इसलिए पूरी तरह से नकारी जाती है।

2. यह सख्ती से नकारा जाता है कि मेरे मुवक्किल पर आपके मुवक्किल का कोई भी कानूनी रूप से लागू करने योग्य ऋण या दायित्व था। चेक नंबर 001234 केवल शुरुआती व्यावसायिक लेनदेन के दौरान सुरक्षा के रूप में दिया गया था और इसे भुनाने के लिए नहीं था।

3. आपके मुवक्किल ने मेरे मुवक्किल से पैसे ऐंठने के गलत इरादे से सुरक्षा चेक का दुरुपयोग किया है।

4. आपको इसके द्वारा कहा जाता है कि आप अपने मुवक्किल को इस उत्तर की प्राप्ति के 7 दिनों के भीतर उक्त नोटिस वापस लेने की सलाह दें, ऐसा न करने पर मेरे मुवक्किल आपके मुवक्किल के खिलाफ उचित कानूनी कार्यवाही, दोनों सिविल और आपराधिक, शुरू करने के लिए मजबूर होंगे, जिसका जोखिम और खर्च आपके मुवक्किल का होगा।

भविष्य के संदर्भ के लिए इस उत्तर की एक प्रति मेरे कार्यालय में रखी गई है।

भवदीय,


एड. राजेश शर्मा
मैनेजिंग पार्टनर
शर्मा एंड एसोसिएट्स`;
      } else if (selectedLanguage.includes("Gujarati")) {
        content = `રજિસ્ટર્ડ એ.ડી. / સ્પીડ પોસ્ટ / કુરિયર

પ્રતિ,
એડવોકેટ રમેશ પટેલ
૧૦૨, લીગલ ચેમ્બર્સ, જિલ્લા અદાલત રોડ,
મુંબઈ, મહારાષ્ટ્ર ૪૦૦૦૦૧

સંદર્ભ: તમારા અસીલ વતી જારી કરાયેલ તારીખ ૧૨ મે ૨૦૨૫ ની કાનૂની નોટિસનો જવાબ.

મહોદય,

મારા અસીલ, શ્રી સુરેશ દેસાઈ (જેઓ હવે પછી "મારા અસીલ" તરીકે ઓળખાશે) ની સૂચના મુજબ અને તેમના વતી, હું તમારી તારીખ ૧૨ મે ૨૦૨૫ ની કાનૂની નોટિસનો જવાબ નીચે મુજબ આપું છું:

૧. તમારી નોટિસની વિગતો, જે રેકોર્ડની બાબત છે તે સિવાય, સંપૂર્ણપણે ખોટી, પાયાવિહોણી અને પરેશાન કરનારી છે, તેથી તેને સંપૂર્ણપણે નકારવામાં આવે છે.

૨. એ સખત રીતે નકારવામાં આવે છે કે મારા અસીલ તમારા અસીલનું કોઈપણ કાયદેસર રીતે વસૂલવા પાત્ર દેવું અથવા જવાબદારી ધરાવતા હતા. ચેક નંબર ૦૦૧૨૩૪ ફક્ત પ્રારંભિક વ્યવસાયિક વ્યવહારો દરમિયાન જામીનગીરી તરીકે આપવામાં આવ્યો હતો અને તે વટાવવા માટે ન હતો.

૩. તમારા અસીલે મારા અસીલ પાસેથી પૈસા પડાવવાના બદઈરાદાથી જામીનગીરીના ચેકનો દુરુપયોગ કર્યો છે.

૪. આથી તમને જણાવવામાં આવે છે કે તમે તમારા અસીલને આ જવાબ મળ્યાના ૭ દિવસની અંદર સદર નોટિસ પાછી ખેંચી લેવાની સલાહ આપો, તેમ કરવામાં નિષ્ફળ જતાં મારા અસીલ તમારા અસીલ સામે સિવિલ અને ફોજદારી બંને યોગ્ય કાનૂની કાર્યવાહી શરૂ કરવાની ફરજ પડશે, જેનું સંપૂર્ણ જોખમ અને ખર્ચ તમારા અસીલનો રહેશે.

આ જવાબની એક નકલ ભવિષ્યના સંદર્ભ માટે મારી ઓફિસમાં રાખવામાં આવી છે.

આપનો વિશ્વાસુ,


એડવોકેટ રાજેશ શર્મા
મેનેજિંગ પાર્ટનર
શર્મા એન્ડ એસોસિએટ્સ`;
      } else {
        content = `REGD. A.D. / SPEED POST / COURIER

To,
Adv. Ramesh Patel
102, Legal Chambers, District Court Road,
Mumbai, Maharashtra 400001

Ref: Reply to your Legal Notice dated 12 May 2025 issued on behalf of your client.

Sir,

Under instructions from and on behalf of my client, Mr. Suresh Desai (hereinafter referred to as "My Client"), I do hereby reply to your legal notice dated 12 May 2025 as follows:

1. That the contents of your notice, save and except those which are matters of record, are totally false, frivolous, vexatious and hence denied in toto.

2. It is strictly denied that my client owed any legally enforceable debt or liability to your client. The cheque bearing number 001234 was given merely as a security during the initial business dealings and was not meant to be encashed.

3. That your client has misused the security cheque with a mala fide intention to extort money from my client. 

4. You are hereby called upon to advise your client to withdraw the said notice within 7 days of receipt of this reply, failing which my client will be constrained to initiate appropriate legal proceedings, both civil and criminal, against your client at his risk as to costs and consequences.

A copy of this reply is retained in my office for future reference.

Yours faithfully,


Adv. Rajesh Sharma
Managing Partner
Sharma & Associates`;
      }
      
      setDraftContent(content);
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-enter min-h-screen bg-workspace-bg flex flex-col">
      <div className={cn("flex flex-col flex-1 min-h-0", showPrintPreview && "print:hidden")}>
        {/* Header */}
      <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-charcoal transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[15px] font-bold text-charcoal flex items-center gap-2">
              Notice Reply Builder
              <span className="px-2 py-0.5 rounded-md bg-mint/10 text-mint-dark text-[10px] uppercase tracking-wider">AI Powered</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-8 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-sm border border-gray-100 bg-white hover:bg-gray-50 text-charcoal">
            <Download className="w-3.5 h-3.5 text-muted" /> Export
          </button>
          <button onClick={() => setShowPrintPreview(true)} className="h-8 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-sm border border-gray-100 bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200">
            <FileCheck className="w-3.5 h-3.5" /> Preview & Print
          </button>
          <button 
            onClick={() => toast.success("Draft saved successfully to Matter: Cheque Dishonour u/s 138")}
            className="h-8 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-sm" style={{ background: "linear-gradient(135deg,#6EE7B7,#72D6C9)", color: "#013B36" }}>
            <Save className="w-3.5 h-3.5" /> Save to Matter
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: OCR & Configuration */}
        <div className="w-[420px] bg-white border-r border-gray-100 overflow-y-auto p-6 shrink-0 flex flex-col gap-6">
          
          {/* Section 1: Upload & OCR */}
          <div>
            <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center text-[10px]">1</span>
              Upload Notice
            </div>
            
            {uploadState === "idle" && (
              <div 
                onClick={handleUpload}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-gray-50 hover:border-mint/50 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-mint/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-5 h-5 text-mint-dark" />
                </div>
                <div className="text-[13px] font-semibold text-charcoal">Click to upload or drag & drop</div>
                <div className="text-[11px] text-muted mt-1">PDF, DOCX, Scanned Images</div>
              </div>
            )}

            {(uploadState === "uploading" || uploadState === "ocr") && (
              <div className="border border-mint/20 rounded-2xl p-6 bg-mint/5 text-center">
                <Loader2 className="w-8 h-8 text-mint-dark animate-spin mx-auto mb-3" />
                <div className="text-[13px] font-semibold text-mint-dark">
                  {uploadState === "uploading" ? "Uploading Document..." : "Running AI OCR & Extracting Entities..."}
                </div>
                <div className="text-[11px] text-mint-dark/70 mt-1">Analyzing notice contents, dates, and opponent details.</div>
              </div>
            )}

            {uploadState === "done" && parsedData && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="border border-emerald-100 rounded-2xl p-4 bg-emerald-50/50">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[13px] mb-3">
                  <CheckCircle className="w-4 h-4" /> Notice Analyzed Successfully
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-muted">Classification:</span>
                    <span className="font-semibold text-charcoal flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500"/> {parsedData.type}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-muted">Detected Language:</span>
                    <span className="font-semibold text-charcoal">{parsedData.language}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-muted">Opponent:</span>
                    <span className="font-semibold text-charcoal">{parsedData.opponent}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-muted">Notice Date:</span>
                    <span className="font-semibold text-charcoal">{parsedData.date}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="h-px bg-gray-100 w-full" />

          {/* Section 2: Context Assignment */}
          <div className={cn("transition-opacity duration-300", uploadState !== "done" ? "opacity-40 pointer-events-none" : "opacity-100")}>
            <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center text-[10px]">2</span>
              Assign Context
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">Client</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                    className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/40 text-charcoal text-left flex justify-between items-center font-medium"
                  >
                    <span className="truncate">
                      {selectedClient ? CLIENTS.find(c => c.id === selectedClient)?.name : "Select Client..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted shrink-0" />
                  </button>

                  {isClientDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-60">
                      <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-1.5 shrink-0">
                        <input
                          type="text"
                          placeholder="Search name or phone..."
                          value={clientSearchQuery}
                          onChange={(e) => setClientSearchQuery(e.target.value)}
                          className="w-full bg-white border border-gray-200 text-[12px] py-1 px-2.5 rounded-md outline-none focus:border-mint/40"
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto flex-1 py-1">
                        <button
                          onClick={() => {
                            setSelectedClient("");
                            setIsClientDropdownOpen(false);
                            setClientSearchQuery("");
                          }}
                          className="w-full text-left px-3 py-1.5 text-[12px] text-gray-500 hover:bg-gray-50 font-medium"
                        >
                          -- Clear Selection --
                        </button>
                        {CLIENTS.filter(c =>
                          c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                          (c.phone && c.phone.includes(clientSearchQuery))
                        ).map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedClient(c.id);
                              setIsClientDropdownOpen(false);
                              setClientSearchQuery("");
                            }}
                            className={cn(
                              "w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 transition-colors flex flex-col",
                              selectedClient === c.id ? "bg-mint/5 text-mint-dark font-semibold" : "text-charcoal"
                            )}
                          >
                            <span className="font-medium">{c.name}</span>
                            <span className="text-[10px] text-muted">{c.phone}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">Matter / Case</label>
                <div className="relative">
                  <select 
                    value={selectedMatter} onChange={(e) => setSelectedMatter(e.target.value)}
                    className="w-full h-10 pl-3 pr-8 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/40 text-charcoal appearance-none font-medium"
                  >
                    <option value="" disabled>Select Matter...</option>
                    {MATTERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full" />

          {/* Section 3: Draft Configuration */}
          <div className={cn("transition-opacity duration-300", uploadState !== "done" ? "opacity-40 pointer-events-none" : "opacity-100")}>
            <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center text-[10px]">3</span>
              Template & Generation
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1 flex items-center justify-between">
                  Suggested Templates
                  <span className="text-[9px] bg-mint/10 text-mint-dark px-1.5 py-0.5 rounded">Based on OCR</span>
                </label>
                <div className="space-y-2">
                  {TEMPLATES.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => setSelectedTemplate(t.id)}
                      className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                        selectedTemplate === t.id ? "bg-mint/5 border-mint/40 shadow-sm" : "bg-white border-gray-100 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", selectedTemplate === t.id ? "bg-mint/10 text-mint-dark" : "bg-gray-100 text-gray-500")}>
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={cn("text-[12px] font-bold", selectedTemplate === t.id ? "text-mint-dark" : "text-charcoal")}>{t.name}</div>
                          <div className="text-[10px] text-muted">{t.type}</div>
                        </div>
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{t.matchScore}% Match</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">Reply Language</label>
                <div className="relative">
                  <select 
                    value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full h-10 pl-9 pr-8 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/40 text-charcoal appearance-none font-medium"
                  >
                    <option>English</option>
                    <option>Marathi (मराठी)</option>
                    <option>Hindi (हिंदी)</option>
                    <option>Gujarati (ગુજરાતી)</option>
                  </select>
                  <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                </div>
              </div>

              <button 
                onClick={handleGenerateReply}
                disabled={isGenerating}
                className="w-full h-11 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all shadow-md mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#013B36,#02564F)", color: "#FFFFFF" }}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {isGenerating ? "Drafting Reply..." : "Generate Auto-Reply"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Editable Workspace */}
        <div className="flex-1 bg-gray-50/50 p-6 flex flex-col items-center overflow-y-auto relative">
          
          <AnimatePresence mode="wait">
            {!draftGenerated && !isGenerating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center mb-4 shadow-sm text-gray-300">
                  <FileText className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-bold text-charcoal mb-2">No Reply Generated Yet</h3>
                <p className="text-[13px] text-muted leading-relaxed">
                  Upload a notice on the left, let the AI extract the details, and click Generate to auto-draft your reply.
                </p>
              </motion.div>
            )}

            {isGenerating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-mint-dark animate-spin mb-4" />
                <div className="text-[14px] font-semibold text-charcoal">Analyzing Notice & Drafting Reply</div>
                <div className="text-[12px] text-muted mt-1">Applying template formatting and injecting facts...</div>
              </motion.div>
            )}

            {draftGenerated && !isGenerating && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                className="w-full max-w-3xl bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col"
              >
                <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="ml-4 text-[11px] font-medium text-muted flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" /> Legal Editor Workspace - Fully Editable
                  </div>
                </div>
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="w-full h-[700px] p-8 text-[14px] leading-relaxed text-charcoal font-medium resize-none focus:outline-none"
                  style={{ fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" }}
                  spellCheck="false"
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
      </div>

      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex bg-gray-500/80 items-center justify-center p-6 print:p-0 print:bg-white print:block">
          <div className="bg-gray-100 rounded-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:w-full print:max-h-none print:shadow-none print:bg-white print:rounded-none">
            
            {/* Modal Header (Hidden when printing) */}
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center print:hidden">
              <h2 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Reply Letterhead Print Preview
              </h2>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowSettingsModal(true)} className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2 shadow-sm">
                  Configure Letterhead
                </button>
                <button onClick={handlePrint} className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm">
                  <Download className="w-4 h-4"/> Print / Save PDF
                </button>
                <button onClick={() => setShowPrintPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
                  ✕
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible relative">
              <LetterheadPreview 
                letterhead={myLetterhead || null} 
                content={draftContent} 
                onConfigure={() => setShowSettingsModal(true)}
              />
            </div>
            
          </div>
        </div>
      )}

      {/* Inline Letterhead Settings Modal */}
      <Modal open={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Configure Letterhead" size="lg">
        <LetterheadSettings />
      </Modal>

    </div>
  );
}
