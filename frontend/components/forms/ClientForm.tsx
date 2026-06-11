"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Client, ClientCreate, useCreateClient, useUpdateClient } from "@/lib/hooks/useClients";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.enum(["individual", "corporate", "government"]),
  phone: z.string().min(10, "Valid phone required"),
  alternate_phone: z.string().optional(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  address: z.string().optional(),
  pan: z.string().optional(),
  gstin: z.string().optional(),
  company_name: z.string().optional(),
  contact_person: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "corporate") {
    if (!data.state) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["state"],
        message: "State is mandatory for corporate clients",
      });
    }
    if (!data.gstin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gstin"],
        message: "GSTIN is mandatory for corporate clients",
      });
    }
  }
});

type FormData = z.infer<typeof schema>;

interface Props {
  client?: Client;
  onSuccess?: () => void;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Puducherry", "Chandigarh",
];

export default function ClientForm({ client, onSuccess }: Props) {
  const isEdit = !!client;
  const create = useCreateClient();
  const update = useUpdateClient();
  const isPending = create.isPending || update.isPending;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: client
      ? {
          name: client.name,
          type: client.type,
          phone: client.phone,
          alternate_phone: client.alternate_phone || "",
          email: client.email || "",
          city: client.city || "",
          state: client.state || "",
          pincode: client.pincode || "",
          address: client.address || "",
          pan: client.pan || "",
          gstin: client.gstin || "",
          company_name: client.company_name || "",
          contact_person: client.contact_person || "",
          notes: client.notes || "",
        }
      : { type: "individual" },
  });

  const clientType = watch("type");

  const onSubmit = async (data: FormData) => {
    const payload = { ...data, email: data.email || undefined };
    if (isEdit) {
      await update.mutateAsync({ id: client.id, ...payload });
    } else {
      await create.mutateAsync(payload as ClientCreate);
    }
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Type selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Type *</label>
        <div className="flex gap-2">
          {(["individual", "corporate", "government"] as const).map((t) => (
            <label key={t} className={cn(
              "flex-1 flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium cursor-pointer transition-all",
              clientType === t
                ? "border-sidebar bg-sidebar/5 text-sidebar"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            )}>
              <input type="radio" value={t} {...register("type")} className="sr-only" />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name *" error={errors.name?.message}>
          <input {...register("name")} placeholder="Rajesh Kumar" className={inputCls(errors.name)} />
        </Field>
        <Field label="Phone *" error={errors.phone?.message}>
          <input {...register("phone")} placeholder="+91 98765 43210" className={inputCls(errors.phone)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" error={errors.email?.message}>
          <input {...register("email")} type="email" placeholder="client@email.com" className={inputCls(errors.email)} />
        </Field>
        <Field label="Alternate Phone">
          <input {...register("alternate_phone")} placeholder="+91 99999 00000" className={inputCls()} />
        </Field>
      </div>

      {clientType === "corporate" && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company Name">
            <input {...register("company_name")} placeholder="ABC Pvt Ltd" className={inputCls()} />
          </Field>
          <Field label="Contact Person">
            <input {...register("contact_person")} placeholder="Mr. Mehta" className={inputCls()} />
          </Field>
        </div>
      )}

      <Field label="Address">
        <textarea {...register("address")} rows={2} placeholder="Flat 202, Landmark, Area" className={inputCls() + " resize-none"} />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="City">
          <input {...register("city")} placeholder="Mumbai" className={inputCls()} />
        </Field>
        <Field label={clientType === "corporate" ? "State *" : "State"} error={errors.state?.message}>
          <select {...register("state")} className={inputCls(errors.state)}>
            <option value="">Select State</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Pincode">
          <input {...register("pincode")} placeholder="400001" className={inputCls()} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="PAN">
          <input {...register("pan")} placeholder="ABCDE1234F" className={inputCls()} style={{ textTransform: "uppercase" }} />
        </Field>
        {clientType === "corporate" && (
          <Field label="GSTIN *" error={errors.gstin?.message}>
            <input {...register("gstin")} placeholder="22AAAAA0000A1Z5" className={inputCls(errors.gstin)} />
          </Field>
        )}
      </div>

      <Field label="Notes">
        <textarea {...register("notes")} rows={2} placeholder="Any additional notes..." className={inputCls() + " resize-none"} />
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-sidebar px-6 py-2.5 text-sm font-semibold text-white hover:bg-sidebar-dark transition-colors disabled:opacity-60"
        >
          {isPending ? "Saving..." : isEdit ? "Update Client" : "Create Client"}
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
