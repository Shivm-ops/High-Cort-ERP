import { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType } from "docx";
import { Letterhead } from "./hooks/useLetterhead";

export const generateDocx = async (content: string, letterhead: Letterhead | null, documentLanguage: string = "en") => {
  let headerText = "";
  let footerText = "";

  if (letterhead) {
    try {
      if (letterhead.custom_header_html) {
        const parsed = JSON.parse(letterhead.custom_header_html);
        headerText = parsed[documentLanguage] || parsed.en || "";
      }
      if (letterhead.custom_footer_html) {
        const parsed = JSON.parse(letterhead.custom_footer_html);
        footerText = parsed[documentLanguage] || parsed.en || "";
      }
    } catch {
      headerText = letterhead.custom_header_html || "";
      footerText = letterhead.custom_footer_html || "";
    }

    if (!headerText) {
      if (letterhead.template_type === "senior_advocate") {
        headerText = `${letterhead.advocate_name?.toUpperCase() || ""}\nSENIOR ADVOCATE`;
      } else if (letterhead.template_type === "law_firm") {
        headerText = `${letterhead.firm_name || ""}\nAdvocates & Legal Consultants`;
      } else {
        headerText = `${letterhead.advocate_name || ""}\nAdvocate, High Court\n${letterhead.firm_name || ""}`;
      }
      headerText += `\n${letterhead.office_address || ""}\n📞 ${letterhead.mobile_number || ""} | ✉️ ${letterhead.email_id || ""}`;
    }

    if (!footerText) {
      footerText = `${letterhead.firm_name || letterhead.advocate_name || ""} • strictly private & confidential`;
    }
  }

  // Create paragraph nodes from the plain text content
  const contentParagraphs = content.split("\n").map(line => {
    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          font: "Times New Roman",
          size: 24, // 12pt
        })
      ],
      spacing: {
        after: 120, // 6pt
      }
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: headerText.split("\n").map(line => new TextRun({ text: line, break: 1, font: "Times New Roman", size: 20 }))
              })
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: footerText.split("\n").map(line => new TextRun({ text: line, break: 1, font: "Times New Roman", size: 18, color: "888888" }))
              })
            ],
          }),
        },
        children: contentParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
};
