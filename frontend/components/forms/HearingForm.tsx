"use client";
import React from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HearingCreate, useCreateHearing, useUpdateHearing, Hearing } from "@/lib/hooks/useHearings";
import { useCases } from "@/lib/hooks/useCases";
import { useRecordFee } from "@/lib/hooks/useBilling";
import { cn } from "@/lib/utils";

const schema = z.object({
  case_id: z.string().min(1, "Case is required"),
  hearing_date: z.string().min(1, "Date is required"),
  hearing_time: z.string().optional(),
  court: z.string().optional(),
  courtroom: z.string().optional(),
  judge: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  attended_by: z.string().optional(),
  order_passed: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  hearing?: Hearing;
  defaultCaseId?: string;
  onSuccess?: () => void;
}

const PURPOSES = ["Arguments", "Evidence", "Cross-examination", "Filing", "Framing of Issues", "Judgment", "Order", "Mediation", "Bail Hearing", "Interim Relief", "Status", "Other"];

export default function HearingForm({ hearing, defaultCaseId, onSuccess }: Props) {
  const isEdit = !!hearing;
  const create = useCreateHearing();
  const update = useUpdateHearing();
  const recordFee = useRecordFee();
  const isPending = create.isPending || update.isPending || recordFee.isPending;
  const { data: casesData } = useCases({ status: "active", limit: 200 });

  const [logFee, setLogFee] = React.useState(false);
  const [feeAmount, setFeeAmount] = React.useState("");
  const [caseSearch, setCaseSearch] = React.useState("");

  const filteredCases = (casesData?.cases || []).filter((c) =>
    c.case_no.toLowerCase().includes(caseSearch.toLowerCase()) ||
    c.title.toLowerCase().includes(caseSearch.toLowerCase()) ||
    (c.client_name && c.client_name.toLowerCase().includes(caseSearch.toLowerCase())) ||
    (c.client_phone && c.client_phone.replace(/[^0-9]/g, "").includes(caseSearch.replace(/[^0-9]/g, "")))
  );

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: hearing
      ? {
          case_id: hearing.case_id,
          hearing_date: hearing.hearing_date,
          hearing_time: hearing.hearing_time || "",
          court: hearing.court || "",
          courtroom: hearing.courtroom || "",
          judge: hearing.judge || "",
          purpose: hearing.purpose || "",
          notes: hearing.notes || "",
          attended_by: hearing.attended_by || "",
          order_passed: hearing.order_passed || "",
        }
      : {
          case_id: defaultCaseId || "",
          hearing_date: new Date().toISOString().split("T")[0],
        },
  });

  const onSubmit = async (data: FormData) => {
    if (isEdit) {
      await update.mutateAsync({ id: hearing.id, ...data });
    } else {
      const h = await create.mutateAsync(data as HearingCreate);
      if (logFee && feeAmount) {
        const c = casesData?.cases.find(x => x.id === data.case_id);
        if (c) {
          await recordFee.mutateAsync({
            client_id: c.client_id,
            case_id: data.case_id,
            hearing_id: h.id,
            category: "Hearing Fee",
            description: `Hearing on ${data.hearing_date} for ${data.purpose || "general"}`,
            amount: parseFloat(feeAmount),
            date: data.hearing_date
          });
        }
      }
    }
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Case *" error={errors.case_id?.message}>
        {!isEdit && (
          <input
            type="text"
            placeholder="Search by case number, title, client name, or phone..."
            value={caseSearch}
            onChange={(e) => setCaseSearch(e.target.value)}
            className="w-full h-9 px-3 rounded-lg text-xs bg-gray-50 border border-gray-100 focus:outline-none focus:ring-1 focus:ring-mint focus:bg-white text-charcoal placeholder:text-muted mb-2"
          />
        )}
        <select {...register("case_id")} disabled={isEdit} className={inputCls(errors.case_id)}>
          <option value="">Select Case {!isEdit && `(${filteredCases.length} matches)`}</option>
          {filteredCases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.case_no} — {c.title.slice(0, 40)} {c.client_name ? `(${c.client_name}${c.client_phone ? ` - ${c.client_phone}` : ""})` : ""}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Hearing Date *" error={errors.hearing_date?.message}>
          <input {...register("hearing_date")} type="date" className={inputCls(errors.hearing_date)} />
        </Field>
        <Field label="Time">
          <input {...register("hearing_time")} type="time" className={inputCls()} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Court">
          <input {...register("court")} placeholder="Bombay High Court" className={inputCls()} />
        </Field>
        <Field label="Courtroom / Hall">
          <input {...register("courtroom")} placeholder="Court No. 12" className={inputCls()} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Judge">
          <input {...register("judge")} placeholder="Justice S. Mhase" className={inputCls()} />
        </Field>
        <Field label="Purpose">
          <select {...register("purpose")} className={inputCls()}>
            <option value="">Select Purpose</option>
            {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Attended By">
        <input {...register("attended_by")} placeholder="Adv. Rajesh Sharma" className={inputCls()} />
      </Field>

      <Field label="Order Passed (if any)">
        <textarea {...register("order_passed")} rows={3} placeholder="Record the order passed during this hearing..." className={inputCls() + " resize-none"} />
      </Field>

      <Field label="Notes">
        <textarea {...register("notes")} rows={3} placeholder="Hearing notes, observations..." className={inputCls() + " resize-none"} />
      </Field>

      {!isEdit && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={logFee} onChange={e => setLogFee(e.target.checked)} className="rounded text-sidebar focus:ring-sidebar/30" />
            <span className="text-sm font-semibold text-indigo-900">Log Hearing Fee</span>
          </label>
          {logFee && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-indigo-700 font-medium whitespace-nowrap">Fee Amount (₹):</span>
              <input type="number" min="0" step="0.01" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} required={logFee}
                className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white" placeholder="e.g. 5000" />
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-sidebar px-6 py-2.5 text-sm font-semibold text-white hover:bg-sidebar-dark transition-colors disabled:opacity-60"
        >
          {isPending ? "Saving..." : isEdit ? "Update Hearing" : "Schedule Hearing"}
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
