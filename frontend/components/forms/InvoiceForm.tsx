"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InvoiceCreate, useCreateInvoice } from "@/lib/hooks/useInvoices";
import { useClients } from "@/lib/hooks/useClients";
import { useCases } from "@/lib/hooks/useCases";
import { cn } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

const itemSchema = z.object({
  description: z.string().min(1, "Description required"),
  quantity: z.coerce.number().min(0.01),
  rate: z.coerce.number().min(0),
  amount: z.coerce.number().min(0),
});

const schema = z.object({
  client_id: z.string().min(1, "Client is required"),
  case_id: z.string().optional(),
  gst_rate: z.coerce.number().min(0).max(28),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  place_of_supply: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item required"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultClientId?: string;
  defaultCaseId?: string;
  onSuccess?: () => void;
}

export default function InvoiceForm({ defaultClientId, defaultCaseId, onSuccess }: Props) {
  const create = useCreateInvoice();
  const { data: clientsData } = useClients({ limit: 200 });
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId || "");
  const { data: casesData } = useCases({ client_id: selectedClientId || undefined, limit: 100 });
  const [clientSearch, setClientSearch] = useState("");

  const filteredClients = (clientsData?.clients || []).filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone && c.phone.replace(/[^0-9]/g, "").includes(clientSearch.replace(/[^0-9]/g, "")))
  );

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: defaultClientId || "",
      case_id: defaultCaseId || "",
      gst_rate: 18,
      items: [{ description: "Professional Legal Services", quantity: 1, rate: 0, amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const gstRate = watch("gst_rate");
  const subtotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const gstAmount = subtotal * (gstRate / 100);
  const total = subtotal + gstAmount;

  const onSubmit = async (data: FormData) => {
    const payload: InvoiceCreate = {
      ...data,
      case_id: data.case_id || undefined,
      due_date: data.due_date || undefined,
    };
    await create.mutateAsync(payload);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Client *" error={errors.client_id?.message}>
          <div className="space-y-1">
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full h-8 px-3 rounded-lg text-xs bg-gray-50 border border-gray-100 focus:outline-none focus:ring-1 focus:ring-mint focus:bg-white text-charcoal placeholder:text-muted mb-1"
            />
            <select
              {...register("client_id")}
              onChange={(e) => { 
                register("client_id").onChange(e); 
                setSelectedClientId(e.target.value); 
                setValue("case_id", ""); 
                const selectedClient = clientsData?.clients.find(c => c.id === e.target.value);
                if (selectedClient?.state) {
                  setValue("place_of_supply", selectedClient.state);
                } else {
                  setValue("place_of_supply", "");
                }
              }}
              className={inputCls(errors.client_id)}
            >
              <option value="">Select Client ({filteredClients.length} match)</option>
              {filteredClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>
        </Field>
        <Field label="Linked Case">
          <select {...register("case_id")} className={inputCls()}>
            <option value="">No Case / General</option>
            {casesData?.cases.map((c) => <option key={c.id} value={c.id}>{c.case_no} — {c.title.slice(0, 40)}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="GST Rate (%)">
          <select {...register("gst_rate")} className={inputCls()}>
            <option value="0">0% (Exempt)</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </Field>
        <Field label="Due Date">
          <input {...register("due_date")} type="date" className={inputCls()} />
        </Field>
        <Field label="Place of Supply">
          <input {...register("place_of_supply")} placeholder="Maharashtra" className={inputCls()} />
        </Field>
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600">Invoice Items *</label>
          <button
            type="button"
            onClick={() => append({ description: "", quantity: 1, rate: 0, amount: 0 })}
            className="flex items-center gap-1 text-xs font-medium text-sidebar hover:text-sidebar-dark"
          >
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
            <span className="col-span-5">Description</span>
            <span className="col-span-2 text-right">Qty</span>
            <span className="col-span-2 text-right">Rate (₹)</span>
            <span className="col-span-2 text-right">Amount (₹)</span>
            <span className="col-span-1" />
          </div>
          {fields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 border-t border-gray-100 px-3 py-2 items-center">
              <input
                {...register(`items.${idx}.description`)}
                placeholder="Service description"
                className="col-span-5 rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-mint"
              />
              <input
                {...register(`items.${idx}.quantity`)}
                type="number"
                step="0.01"
                className="col-span-2 rounded border border-gray-200 px-2 py-1.5 text-sm text-right outline-none focus:border-mint"
                onChange={(e) => {
                  register(`items.${idx}.quantity`).onChange(e);
                  const qty = parseFloat(e.target.value) || 0;
                  const rate = parseFloat(String(items[idx]?.rate)) || 0;
                  setValue(`items.${idx}.amount`, parseFloat((qty * rate).toFixed(2)));
                }}
              />
              <input
                {...register(`items.${idx}.rate`)}
                type="number"
                step="0.01"
                className="col-span-2 rounded border border-gray-200 px-2 py-1.5 text-sm text-right outline-none focus:border-mint"
                onChange={(e) => {
                  register(`items.${idx}.rate`).onChange(e);
                  const rate = parseFloat(e.target.value) || 0;
                  const qty = parseFloat(String(items[idx]?.quantity)) || 0;
                  setValue(`items.${idx}.amount`, parseFloat((qty * rate).toFixed(2)));
                }}
              />
              <input
                {...register(`items.${idx}.amount`)}
                type="number"
                readOnly
                className="col-span-2 rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-sm text-right outline-none text-gray-700"
              />
              <button
                type="button"
                onClick={() => fields.length > 1 && remove(idx)}
                className="col-span-1 flex justify-center text-gray-300 hover:text-red-400 transition-colors"
                disabled={fields.length <= 1}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        {errors.items && <p className="text-xs text-red-500 mt-1">{errors.items.message || errors.items.root?.message}</p>}
      </div>

      {/* Totals */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>GST ({gstRate}%)</span>
          <span>₹{gstAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-base font-semibold text-gray-900 border-t border-gray-200 pt-2">
          <span>Total</span>
          <span>₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <Field label="Notes">
        <textarea {...register("notes")} rows={2} placeholder="Payment instructions, terms..." className={inputCls() + " resize-none"} />
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-xl bg-sidebar px-6 py-2.5 text-sm font-semibold text-white hover:bg-sidebar-dark transition-colors disabled:opacity-60"
        >
          {create.isPending ? "Creating..." : "Create Invoice"}
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
