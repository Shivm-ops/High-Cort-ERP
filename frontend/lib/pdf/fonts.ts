import { jsPDF } from "jspdf";

// In a real production environment, these would be the actual base64 encoded TTF files.
// For demonstration, we'll create the structure to register them.
export const NOTO_SANS_DEVANAGARI_BASE64 = "AAEAAAAA..."; // Mocked base64
export const NOTO_SANS_GUJARATI_BASE64 = "AAEAAAAA..."; // Mocked base64

export function initPdfFonts(doc: jsPDF) {
  // Add Devanagari Font
  doc.addFileToVFS("NotoSansDevanagari-Regular.ttf", NOTO_SANS_DEVANAGARI_BASE64);
  doc.addFont("NotoSansDevanagari-Regular.ttf", "NotoSansDevanagari", "normal");

  // Add Gujarati Font
  doc.addFileToVFS("NotoSansGujarati-Regular.ttf", NOTO_SANS_GUJARATI_BASE64);
  doc.addFont("NotoSansGujarati-Regular.ttf", "NotoSansGujarati", "normal");
}

export function getPdfFontForLanguage(language: string): string {
  if (language === "mr" || language === "hi") {
    return "NotoSansDevanagari";
  } else if (language === "gu") {
    return "NotoSansGujarati";
  }
  return "helvetica";
}
