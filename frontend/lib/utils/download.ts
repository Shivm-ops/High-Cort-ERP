import { api } from "@/lib/api";
import { toast } from "sonner";

/**
 * Downloads a document from the server via authenticated stream or fallback signed URL.
 * Automatically handles binary blobs, tokens, and correct filename decoding.
 */
export async function downloadDocumentFile(documentId: string, fallbackName = "document"): Promise<boolean> {
  if (!documentId) {
    toast.error("Document identifier missing for download");
    return false;
  }

  const toastId = toast.loading(`Preparing ${fallbackName}...`);

  try {
    // 1. Fetch file as binary blob with JWT Authorization header attached automatically
    const res = await api.get(`/documents/${documentId}/stream?disposition=attachment`, {
      responseType: "blob",
    });

    let downloadFilename = fallbackName;
    const disposition = String(res.headers["content-disposition"] || "");
    const match = disposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i);
    if (match && match[1]) {
      try {
        const decoded = decodeURIComponent(match[1].trim().replace(/['"]/g, ""));
        if (decoded && decoded.includes(".")) {
          downloadFilename = decoded;
        }
      } catch (e) {
        // use fallbackName
      }
    }
    if (!downloadFilename.includes(".") && fallbackName.includes(".")) {
      downloadFilename += "." + fallbackName.split(".").pop();
    }

    const contentType = String(res.headers["content-type"] || "application/octet-stream");
    const blob = new Blob([res.data], { type: contentType });
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.style.display = "none";
    link.href = blobUrl;
    link.setAttribute("download", downloadFilename);
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (e) {}
    }, 4000);

    toast.success(`Downloaded: ${downloadFilename}`, { id: toastId });
    return true;
  } catch (streamErr: any) {
    // 2. Fallback: try download endpoint and construct absolute URL if relative
    try {
      const response = await api.get<{ download_url?: string; filename?: string }>(
        `/documents/${documentId}/download`
      );
      if (response.data && response.data.download_url) {
        let rawUrl = response.data.download_url;
        let finalUrl = rawUrl;
        if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
          const baseUrl = (api.defaults.baseURL || "http://localhost:8000/api/v1").replace(
            /\/api\/v1\/?$/,
            ""
          );
          finalUrl = `${baseUrl}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
        }

        const link = document.createElement("a");
        link.href = finalUrl;
        link.target = "_blank";
        link.setAttribute("download", response.data.filename || fallbackName);
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          try {
            document.body.removeChild(link);
          } catch (e) {}
        }, 2000);

        toast.success(`Downloaded: ${response.data.filename || fallbackName}`, { id: toastId });
        return true;
      }
    } catch (fallbackErr: any) {
      console.error("Fallback download URL failed:", fallbackErr);
    }

    const errMsg = streamErr?.response?.data?.detail || streamErr?.message || "File unavailable";
    toast.error(`Download failed: ${errMsg}`, { id: toastId });
    return false;
  }
}
