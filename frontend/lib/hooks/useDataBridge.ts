import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export interface BridgeUploadItem {
  id: string;
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
