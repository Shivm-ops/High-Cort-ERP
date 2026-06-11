"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Case, CaseCreate, useCreateCase, useUpdateCase } from "@/lib/hooks/useCases";
import { useClients } from "@/lib/hooks/useClients";
import { cn } from "@/lib/utils";

const schema = z.object({
  case_no: z.string().min(1, "Case number is required"),
  title: z.string().min(3, "Title is required"),
  court: z.string().min(2, "Court is required"),
  client_id: z.string().min(1, "Client is required"),
  practice_area: z.string().min(1, "Practice area is required"),
  status: z.string(),
  stage: z.string(),
  priority: z.string(),
  case_type: z.string().optional(),
  judge: z.string().optional(),
  bench: z.string().optional(),
  court_state: z.string().optional(),
  petitioner: z.string().optional(),
  respondent: z.string().optional(),
  opposing_counsel: z.string().optional(),
  filing_date: z.string().optional(),
  limitation_date: z.string().optional(),
  fees_agreed: z.coerce.number().min(0),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  caseData?: Case;
  defaultClientId?: string;
  defaultDescription?: string;
  defaultCourt?: string;
  defaultPracticeArea?: string;
  onSuccess?: (caseId?: string) => void;
}

const PRACTICE_AREAS = ["Criminal", "Civil", "Property", "Family", "Consumer", "GST/Tax", "Banking/NI Act", "Corporate", "Constitutional/Writ", "MACT", "Labour", "Arbitration", "RERA", "Other"];
const COURTS = ["Supreme Court of India", "Bombay High Court", "Delhi High Court", "Madras High Court", "Calcutta High Court", "Gujarat High Court", "Allahabad High Court", "District & Sessions Court", "City Civil Court", "Family Court", "Magistrate Court", "Consumer Court", "NCLT", "NCLAT", "ITAT", "CESTAT", "RERA Authority", "Labour Court", "Other"];

export default function CaseForm({ caseData, defaultClientId, defaultDescription, defaultCourt, defaultPracticeArea, onSuccess }: Props) {
  const isEdit = !!caseData;
  const create = useCreateCase();
  const update = useUpdateCase();
  const isPending = create.isPending || update.isPending;
  const { data: clientsData } = useClients({ limit: 200 });
  const [clientSearch, setClientSearch] = useState("");

  const filteredClients = (clientsData?.clients || []).filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone && c.phone.replace(/[^0-9]/g, "").includes(clientSearch.replace(/[^0-9]/g, "")))
  );

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: caseData
      ? {
          case_no: caseData.case_no,
          title: caseData.title,
          court: caseData.court,
          client_id: caseData.client_id,
          practice_area: caseData.practice_area,
          status: caseData.status,
          stage: caseData.stage,
          priority: caseData.priority,
          case_type: caseData.case_type || "",
          judge: caseData.judge || "",
          bench: caseData.bench || "",
          petitioner: caseData.petitioner || "",
          respondent: caseData.respondent || "",
          opposing_counsel: caseData.opposing_counsel || "",
          filing_date: caseData.filing_date || "",
          limitation_date: caseData.limitation_date || "",
          fees_agreed: caseData.fees_agreed || 0,
          description: caseData.description || "",
        }
      : {
          status: "active",
          stage: "filing",
          priority: "medium",
          fees_agreed: 0,
          client_id: defaultClientId || "",
          description: defaultDescription || "",
          court: defaultCourt || "District & Sessions Court",
          case_no: "",
          title: "",
          practice_area: defaultPracticeArea || "Criminal",
        },
  });

  const onSubmit = async (data: FormData) => {
    const payload: CaseCreate = {
      ...data,
      filing_date: data.filing_date || undefined,
      limitation_date: data.limitation_date || undefined,
    };
    if (isEdit) {
      await update.mutateAsync({ id: caseData.id, ...payload });
      onSuccess?.();
    } else {
      const result = await create.mutateAsync(payload);
      onSuccess?.(result.id);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Case Number *" error={errors.case_no?.message}>
          <input {...register("case_no")} placeholder="BHC/CRL/1234/2024" className={inputCls(errors.case_no)} />
        </Field>
        <Field label="Client *" error={errors.client_id?.message}>
          <div className="space-y-1">
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full h-8 px-3 rounded-lg text-xs bg-gray-50 border border-gray-100 focus:outline-none focus:ring-1 focus:ring-mint focus:bg-white text-charcoal placeholder:text-muted mb-1"
            />
            <select {...register("client_id")} className={inputCls(errors.client_id)}>
              <option value="">Select Client ({filteredClients.length} match)</option>
              {filteredClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>
        </Field>
      </div>

      <Field label="Case Title *" error={errors.title?.message}>
        <input {...register("title")} placeholder="State vs Rajesh Kumar" className={inputCls(errors.title)} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Court *" error={errors.court?.message}>
          <select {...register("court")} className={inputCls(errors.court)}>
            <option value="">Select Court</option>
            {COURTS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Practice Area *" error={errors.practice_area?.message}>
          <select {...register("practice_area")} className={inputCls(errors.practice_area)}>
            <option value="">Select Area</option>
            {PRACTICE_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Status">
          <select {...register("status")} className={inputCls()}>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="urgent">Urgent</option>
            <option value="stayed">Stayed</option>
            <option value="disposed">Disposed</option>
            <option value="closed">Closed</option>
          </select>
        </Field>
        <Field label="Stage">
          <select {...register("stage")} className={inputCls()}>
            <option value="filing">Filing</option>
            <option value="notice">Notice</option>
            <option value="reply">Reply</option>
            <option value="evidence">Evidence</option>
            <option value="arguments">Arguments</option>
            <option value="judgment">Judgment</option>
            <option value="execution">Execution</option>
          </select>
        </Field>
        <Field label="Priority">
          <select {...register("priority")} className={inputCls()}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Judge / Bench">
          <input {...register("judge")} placeholder="Justice A.K. Sharma" className={inputCls()} />
        </Field>
        <Field label="Case Type">
          <input {...register("case_type")} placeholder="Criminal / Civil / Writ" className={inputCls()} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Petitioner">
          <input {...register("petitioner")} placeholder="State of Maharashtra" className={inputCls()} />
        </Field>
        <Field label="Respondent">
          <input {...register("respondent")} placeholder="Rajesh Kumar" className={inputCls()} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Filing Date">
          <input {...register("filing_date")} type="date" className={inputCls()} />
        </Field>
        <Field label="Limitation Date">
          <input {...register("limitation_date")} type="date" className={inputCls()} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Opposing Counsel">
          <input {...register("opposing_counsel")} placeholder="Adv. Pradeep Mehta" className={inputCls()} />
        </Field>
        <Field label="Fees Agreed (₹)">
          <input {...register("fees_agreed")} type="number" min={0} placeholder="50000" className={inputCls()} />
        </Field>
      </div>

      <Field label="Description">
        <textarea {...register("description")} rows={3} placeholder="Brief case description..." className={inputCls() + " resize-none"} />
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-sidebar px-6 py-2.5 text-sm font-semibold text-white hover:bg-sidebar-dark transition-colors disabled:opacity-60"
        >
          {isPending ? "Saving..." : isEdit ? "Update Case" : "Create Case"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputCls(error?: unknown) {
  return cn(
    "w-full rounded-lg border px-3 py-2 text-sm transition-colors outline-none",
    "placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint",
    error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"
  );
}
