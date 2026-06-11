import React from "react";
import { Letterhead } from "@/lib/hooks/useLetterhead";
import { useLanguageStore } from "@/lib/store/languageStore";
import { cn } from "@/lib/utils";

interface LetterheadPreviewProps {
  letterhead: Letterhead | null;
  content: string;
  onConfigure?: () => void;
}

export default function LetterheadPreview({ letterhead, content, onConfigure }: LetterheadPreviewProps) {
  const { documentLanguage } = useLanguageStore();

  let headerContent = "";
  let footerContent = "";
  if (letterhead) {
    try {
      if (letterhead.custom_header_html) {
        const parsed = JSON.parse(letterhead.custom_header_html);
        headerContent = parsed[documentLanguage] || parsed.en || "";
      }
      if (letterhead.custom_footer_html) {
        const parsed = JSON.parse(letterhead.custom_footer_html);
        footerContent = parsed[documentLanguage] || parsed.en || "";
      }
    } catch {
      headerContent = letterhead.custom_header_html || "";
      footerContent = letterhead.custom_footer_html || "";
    }
  }

  const printStyles = (
    <style dangerouslySetInnerHTML={{__html: `
      @media print {
        @page {
          size: A4;
          margin: 0mm !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        /* Hide scrollbars and reset layout constraints */
        html, body, #__next, [role="dialog"], .fixed {
          padding: 0 !important;
          margin: 0 !important;
        }
      }
    `}} />
  );

  // If no letterhead is configured, just show plain content with a prompt
  if (!letterhead) {
    return (
      <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-200 min-h-[800px] font-serif relative print:shadow-none print:border-none print:p-0"
           style={{ width: '210mm', minHeight: '297mm', padding: '20mm', boxSizing: 'border-box' }}>
        {printStyles}
        <div className="absolute top-0 left-0 right-0 bg-indigo-50 p-4 flex items-center justify-between border-b border-indigo-100 print:hidden">
          <div className="text-sm text-indigo-800 font-medium font-sans">
            Your Letterhead is not configured yet! You are viewing a plain text preview.
          </div>
          {onConfigure && (
            <button onClick={onConfigure} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium font-sans hover:bg-indigo-700 shadow-sm transition-colors">
              Configure Letterhead
            </button>
          )}
        </div>
        <div className="whitespace-pre-wrap mt-16 print:mt-0">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg mx-auto overflow-hidden relative print:shadow-none print:m-0" 
         style={{ width: '210mm', minHeight: '297mm', padding: '20mm', boxSizing: 'border-box' }}>
      {printStyles}
      
      {/* HEADER SECTION */}
      <div className="border-b-2 border-gray-800 pb-4 mb-8">
        <div className="flex justify-between items-start">
          {/* Left: Logo */}
          <div className="w-[120px] shrink-0">
            {letterhead.logo_base64 && (
              <img src={letterhead.logo_base64} alt="Logo" className="max-w-full max-h-[100px] object-contain" />
            )}
          </div>
          
          {/* Middle/Right: Details depending on template */}
          <div className="flex-1 text-right pl-6">
            {headerContent ? (
              <div className={cn(
                "whitespace-pre-wrap leading-tight text-gray-800 text-[13px] font-medium",
                (documentLanguage === "mr" || documentLanguage === "hi") ? "font-['Noto_Sans_Devanagari']" : "",
                documentLanguage === "gu" ? "font-['Noto_Sans_Gujarati']" : ""
              )}>
                {headerContent}
              </div>
            ) : letterhead.template_type === "senior_advocate" ? (
              <>
                <h1 className="text-2xl font-bold font-serif text-gray-900 tracking-wide">{letterhead.advocate_name?.toUpperCase()}</h1>
                <p className="text-[13px] font-semibold text-gray-700 tracking-widest mt-1">SENIOR ADVOCATE</p>
              </>
            ) : letterhead.template_type === "law_firm" ? (
              <>
                <h1 className="text-2xl font-bold font-serif text-indigo-900">{letterhead.firm_name}</h1>
                <p className="text-[14px] font-semibold text-gray-700 mt-1">Advocates & Legal Consultants</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold font-serif text-gray-900">{letterhead.advocate_name}</h1>
                <p className="text-[14px] font-semibold text-gray-700 mt-1">Advocate, High Court</p>
                {letterhead.firm_name && <p className="text-[13px] text-gray-600 font-medium mt-1">{letterhead.firm_name}</p>}
              </>
            )}

            {!headerContent && (
              <div className="mt-3 text-[11px] text-gray-600 space-y-0.5">
                {letterhead.office_address && <p>{letterhead.office_address}</p>}
                <p>
                  {letterhead.mobile_number && <span className="mr-3">📞 {letterhead.mobile_number}</span>}
                  {letterhead.email_id && <span>✉️ {letterhead.email_id}</span>}
                </p>
                <p>
                  {letterhead.enrollment_number && <span className="mr-3">Reg: {letterhead.enrollment_number}</span>}
                  {letterhead.website && <span>🌐 {letterhead.website}</span>}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BODY SECTION */}
      <div className="whitespace-pre-wrap font-serif text-[14px] leading-relaxed text-gray-900 min-h-[500px]">
        {content}
      </div>

      {/* FOOTER / SIGNATURE SECTION */}
      <div className="mt-16 pt-8 flex justify-between items-end break-inside-avoid">
        {/* Seal */}
        <div className="w-[150px]">
          {letterhead.stamp_base64 && (
            <img src={letterhead.stamp_base64} alt="Seal" className="max-w-full max-h-[120px] object-contain opacity-80 mix-blend-multiply" />
          )}
        </div>
        
        {/* Signature */}
        <div className="w-[200px] text-center">
          {letterhead.signature_base64 ? (
            <img src={letterhead.signature_base64} alt="Signature" className="max-w-full max-h-[80px] object-contain mx-auto mb-2 mix-blend-multiply" />
          ) : (
            <div className="h-[80px]"></div>
          )}
          <div className="border-t border-gray-400 pt-2">
            <p className="font-bold text-[14px] font-serif">{letterhead.advocate_name || "Advocate"}</p>
            {letterhead.firm_name && <p className="text-[12px] text-gray-600">{letterhead.firm_name}</p>}
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER LINE */}
      <div className="absolute bottom-0 left-0 right-0 h-[10mm] border-t border-gray-200 flex justify-center items-center">
        {footerContent ? (
          <p className={cn(
            "text-[9px] text-gray-500 whitespace-pre-wrap leading-tight text-center",
            (documentLanguage === "mr" || documentLanguage === "hi") ? "font-['Noto_Sans_Devanagari']" : "",
            documentLanguage === "gu" ? "font-['Noto_Sans_Gujarati']" : ""
          )}>
            {footerContent}
          </p>
        ) : (
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">
            {letterhead.firm_name || letterhead.advocate_name} • strictly private & confidential
          </p>
        )}
      </div>

    </div>
  );
}
