import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export interface BridgeUploadItem {
  id: string;
  docId?: string;
  file: File;
  name: string;
  size: number;
  type: string;
  relativePath?: string;
  status: "pending" | "analyzing" | "uploading" | "completed" | "error";
  progress: number;
  errorMessage?: string;
  docType: string;
  confidence?: number;
  caseId?: string;
  caseTitle?: string;
  clientId?: string;
  clientName?: string;
  hashSha256?: string;
  ocrProcessed?: boolean;
  previewUrl?: string;
  downloadUrl?: string;
  hints?: any;
}

export interface ClientDocument {
  id: string;
  name: string;
  original_filename: string;
  doc_type: string;
  file_size: number;
  mime_type: string;
  description?: string;
  case_id?: string;
  case_title?: string;
  case_no?: string;
  client_id?: string;
  client_name?: string;
  client_phone?: string;
  preview_url: string;
  download_url: string;
  token?: string;
  ocr_processed?: boolean;
  hash_sha256?: string;
  created_at: string;
}

export interface AIDraftRequest {
  doc_id?: string;
  text?: string;
  operation: string;
  instructions?: string;
  facts?: string;
  save_as_draft?: boolean;
  draft_title?: string;
  category?: string;
  language?: string;
  client_id?: string;
  case_id?: string;
}

export interface AIDraftResult {
  operation: string;
  original_text: string;
  proposed_draft: string;
  word_count: number;
  saved_as_draft: boolean;
  draft_id?: string;
  document_id?: string;
}

export interface MigrationPreviewResult {
  filename: string;
  total_rows: number;
  headers: string[];
  preview_rows: Record<string, string>[];
  suggested_entity: "client" | "case";
  suggested_mapping: Record<string, string>;
}

export interface MigrationValidationResult {
  total_evaluated: number;
  valid_count: number;
  invalid_count: number;
  duplicate_count: number;
  invalid_records: Array<{ row_number: number; row: Record<string, string>; errors: string[] }>;
  duplicate_records: Array<{
    row_number: number;
    row: Record<string, string>;
    matched_existing_id: string;
    matched_existing_name?: string;
    matched_existing_title?: string;
    matched_reason: string;
  }>;
}

export interface MigrationExecutionResult {
  success: boolean;
  entity_type: string;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface BridgeAuditItem {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
  details: any;
  status: string;
}

export function useDataBridgeHistory() {
  return useQuery({
    queryKey: ["data_bridge_history"],
    queryFn: async () => {
      const { data } = await api.get<{ history: BridgeAuditItem[] }>("/data-bridge/history");
      return data.history || [];
    },
    refetchInterval: 15000,
  });
}

export async function analyzeBridgeFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/data-bridge/analyze-file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function uploadBridgeFile(
  file: File,
  options?: {
    caseId?: string;
    clientId?: string;
    docType?: string;
    relativePath?: string;
    description?: string;
    autoClassify?: boolean;
    onProgress?: (percent: number) => void;
  }
) {
  const formData = new FormData();
  formData.append("file", file);
  if (options?.caseId) formData.append("case_id", options.caseId);
  if (options?.clientId) formData.append("client_id", options.clientId);
  if (options?.docType) formData.append("doc_type", options.docType);
  if (options?.relativePath) formData.append("relative_path", options.relativePath);
  if (options?.description) formData.append("description", options.description);
  formData.append("auto_classify", options?.autoClassify !== false ? "true" : "false");

  const { data } = await api.post("/data-bridge/upload-file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && options?.onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        options.onProgress(percent);
      }
    },
  });
  return data;
}

export async function previewMigrationFile(file: File): Promise<MigrationPreviewResult> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<MigrationPreviewResult>("/data-bridge/migrate/preview", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function validateMigrationData(
  entityType: "client" | "case",
  rows: Record<string, any>[],
  mapping: Record<string, string>
): Promise<MigrationValidationResult> {
  const { data } = await api.post<MigrationValidationResult>("/data-bridge/migrate/validate", {
    entity_type: entityType,
    rows,
    mapping,
  });
  return data;
}

export async function executeMigration(
  entityType: "client" | "case",
  rows: Record<string, any>[],
  mapping: Record<string, string>,
  duplicateStrategy: "skip" | "update" | "create_new"
): Promise<MigrationExecutionResult> {
  const { data } = await api.post<MigrationExecutionResult>("/data-bridge/migrate/execute", {
    entity_type: entityType,
    rows,
    mapping,
    duplicate_strategy: duplicateStrategy,
  });
  return data;
}

export async function validatePracticeRestore(file: File, passphrase?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (passphrase) formData.append("passphrase", passphrase);
  const { data } = await api.post("/data-bridge/restore/validate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function executePracticeRestore(
  file: File,
  passphrase?: string,
  conflictStrategy: "skip" | "update" = "skip"
) {
  const formData = new FormData();
  formData.append("file", file);
  if (passphrase) formData.append("passphrase", passphrase);
  formData.append("conflict_strategy", conflictStrategy);
  const { data } = await api.post("/data-bridge/restore/execute", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export function useClientDocuments(params: {
  clientId?: string;
  caseId?: string;
  docType?: string;
  search?: string;
  unassignedOnly?: boolean;
}) {
  return useQuery({
    queryKey: ["client_documents", params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params.clientId) query.set("client_id", params.clientId);
      if (params.caseId) query.set("case_id", params.caseId);
      if (params.docType && params.docType !== "all") query.set("doc_type", params.docType);
      if (params.search) query.set("search", params.search);
      if (params.unassignedOnly) query.set("unassigned_only", "true");
      const { data } = await api.get<{
        total: number;
        unassigned_count?: number;
        assigned_count?: number;
        documents: ClientDocument[];
      }>(
        `/data-bridge/client-documents?${query.toString()}`
      );
      return data;
    },
  });
}

export async function getDocumentContent(docId: string) {
  const { data } = await api.get<{
    id: string;
    name: string;
    original_filename: string;
    doc_type: string;
    mime_type: string;
    file_size: number;
    text: string;
    has_text: boolean;
    preview_url: string;
    download_url: string;
    case_id?: string;
    case_title?: string;
    case_no?: string;
    client_id?: string;
    client_name?: string;
    created_at?: string;
  }>(`/documents/${docId}/content`);
  return data;
}

export async function aiDraftImprove(payload: AIDraftRequest): Promise<AIDraftResult> {
  const { data } = await api.post<AIDraftResult>("/data-bridge/ai-draft-improve", payload);
  return data;
}

export async function updateDocument(docId: string, payload: {
  name?: string;
  doc_type?: string;
  client_id?: string;
  case_id?: string;
  description?: string;
}) {
  const { data } = await api.patch(`/documents/${docId}`, payload);
  return data;
}

export async function deleteDocument(docId: string) {
  const { data } = await api.delete(`/documents/${docId}`);
  return data;
}

export async function exportClientDocuments(clientId: string, caseId?: string, docIds?: string[]) {
  const params = new URLSearchParams();
  params.set("client_id", clientId);
  if (caseId) params.set("case_id", caseId);
  if (docIds && docIds.length > 0) {
    docIds.forEach((id) => params.append("doc_ids", id));
  }
  const response = await api.get(`/data-bridge/export/client-documents?${params.toString()}`, {
    responseType: "blob",
  });
  return response;
}

export interface ImportedClient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: string;
  company_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  kyc_verified?: boolean;
  notes?: string;
  tags?: string[];
  cases_count: number;
  docs_count: number;
  created_at?: string;
}

export interface ImportedCase {
  id: string;
  case_no: string;
  title: string;
  ecourts_cnr?: string;
  court: string;
  practice_area: string;
  judge?: string;
  petitioner?: string;
  respondent?: string;
  status: string;
  stage: string;
  priority: string;
  client_id?: string;
  client_name?: string;
  tags?: string[];
  docs_count: number;
  created_at?: string;
}

export interface ImportedDocument {
  id: string;
  name: string;
  original_filename: string;
  doc_type: string;
  file_size: number;
  mime_type: string;
  case_id?: string;
  case_no?: string;
  case_title?: string;
  client_id?: string;
  client_name?: string;
  tags?: string[];
  description?: string;
  ocr_processed: boolean;
  hash_sha256?: string;
  extracted_metadata?: Record<string, any>;
  preview_url: string;
  download_url: string;
  created_at?: string;
}

export interface ImportedRecordsResponse {
  summary: {
    total_clients: number;
    total_cases: number;
    total_documents: number;
    unassigned_documents: number;
    matched_clients: number;
    matched_cases: number;
    matched_documents: number;
  };
  clients: ImportedClient[];
  cases: ImportedCase[];
  documents: ImportedDocument[];
}

export function useImportedRecords(params: {
  search?: string;
  type?: "all" | "client" | "case" | "document";
  clientId?: string;
  caseId?: string;
}) {
  return useQuery({
    queryKey: ["imported_records", params],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params.search) q.set("search", params.search);
      if (params.type) q.set("type", params.type);
      if (params.clientId) q.set("client_id", params.clientId);
      if (params.caseId) q.set("case_id", params.caseId);
      const { data } = await api.get<ImportedRecordsResponse>(
        `/data-bridge/imported-records?${q.toString()}`
      );
      return data;
    },
    refetchInterval: 20000,
  });
}

export async function resolveRecordConflict(payload: {
  entity_type: "client" | "case";
  target_id: string;
  source_id?: string;
  resolution: "update" | "merge" | "overwrite";
  update_data?: Record<string, any>;
}) {
  const { data } = await api.post("/data-bridge/resolve-conflict", payload);
  return data;
}

export async function updateClientRecord(clientId: string, payload: Record<string, any>) {
  const { data } = await api.put(`/clients/${clientId}`, payload);
  return data;
}

export async function updateCaseRecord(caseId: string, payload: Record<string, any>) {
  const { data } = await api.put(`/cases/${caseId}`, payload);
  return data;
}

