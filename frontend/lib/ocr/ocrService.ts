import Tesseract from "tesseract.js";

/**
 * Tesseract.js language codes mapping
 * en: eng
 * mr: mar
 * hi: hin
 * gu: guj
 */
export type SupportedOCRLang = "en" | "mr" | "hi" | "gu" | "all";

const LANG_MAP: Record<SupportedOCRLang, string> = {
  en: "eng",
  mr: "mar+eng", // Often Marathi documents have some English (names, numbers, etc.)
  hi: "hin+eng", // Hindi documents have English numbers/dates
  gu: "guj+eng", // Gujarati documents have English
  all: "eng+mar+hin+guj", // Universal fallback
};

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
}

export const performOCR = async (
  image: File | string | HTMLImageElement,
  language: SupportedOCRLang = "all",
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  const tesseractLang = LANG_MAP[language];

  try {
    const worker = await Tesseract.createWorker(tesseractLang, 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          // m.progress is between 0 and 1
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    const { data } = await worker.recognize(image);
    await worker.terminate();

    return {
      text: data.text,
      confidence: data.confidence,
      language: tesseractLang,
    };
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to extract text from document.");
  }
};

/**
 * Utility to guess language from extracted text if 'all' was used.
 * Very basic heuristic based on script blocks.
 */
export const detectDominantLanguage = (text: string): SupportedOCRLang => {
  let devanagariCount = 0;
  let gujaratiCount = 0;
  let latinCount = 0;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (charCode >= 0x0900 && charCode <= 0x097f) {
      devanagariCount++;
    } else if (charCode >= 0x0a80 && charCode <= 0x0aff) {
      gujaratiCount++;
    } else if ((charCode >= 0x0041 && charCode <= 0x005a) || (charCode >= 0x0061 && charCode <= 0x007a)) {
      latinCount++;
    }
  }

  const total = devanagariCount + gujaratiCount + latinCount;
  if (total === 0) return "en";

  if (gujaratiCount > devanagariCount && gujaratiCount > latinCount) return "gu";
  if (devanagariCount > gujaratiCount && devanagariCount > latinCount) {
    // Both Hindi and Marathi use Devanagari. Without a dictionary, it's hard to separate,
    // so we default to hi as a general fallback, or mr if we know the user is from MH.
    return "mr"; 
  }
  return "en";
};
