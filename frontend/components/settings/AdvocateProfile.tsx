"use client";

import React, { useEffect, useState } from "react";
import { User, Key, Mail, Phone, FileImage, Save, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";
import { useUserProfile, useUpdateUserProfile } from "@/lib/hooks/useSettings";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export default function AdvocateProfile() {
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [barCouncilNo, setBarCouncilNo] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [seal, setSeal] = useState<string>("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setPhone(profile.phone || "");
    setBarCouncilNo(profile.bar_council_no || "");
    setEmail(profile.email || "");
    setPhoto(profile.avatar_url || "");
    setSignature(profile.signature_url || "");
    setSeal(profile.seal_url || "");
  }, [profile]);

  const handleUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be under 2 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setter((event.target?.result as string) || "");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Advocate name is required.");
      return;
    }
    try {
      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        phone: phone.trim(),
        bar_council_no: barCouncilNo.trim(),
        avatar_url: photo,
        signature_url: signature,
        seal_url: seal,
      });
      toast.success("Advocate profile saved successfully!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#013B36]" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <div>
        <h2 className="text-[15px] font-semibold text-charcoal mb-1">Advocate Profile</h2>
        <p className="text-[12px] text-muted">
          These details automatically appear in your notices, affidavits, petitions, and invoices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-semibold text-muted block mb-1.5">
            Advocate Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Abhijit Patil"
              className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted block mb-1.5">
            Mobile Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted block mb-1.5">
            Bar Council Enrollment Number
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              value={barCouncilNo}
              onChange={(e) => setBarCouncilNo(e.target.value)}
              placeholder="e.g. MAH/1234/2020"
              className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted block mb-1.5">
            Account Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              value={email}
              readOnly
              className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-100/80 border border-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-[13px] font-semibold text-charcoal mb-1">
          Identity & Signatures
        </h3>
        <p className="text-[11.5px] text-muted mb-4">
          Upload PNG or JPG images (up to 2 MB each). Remember to save changes below.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Advocate Photograph", value: photo, setter: setPhoto },
            { label: "Digital Signature", value: signature, setter: setSignature },
            { label: "Advocate Seal", value: seal, setter: setSeal },
          ].map((item) => (
            <div
              key={item.label}
              className="border border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors relative overflow-hidden min-h-[124px]"
            >
              {item.value ? (
                <div className="w-full flex flex-col items-center gap-2">
                  <img
                    src={item.value}
                    alt={item.label}
                    className="max-h-20 object-contain rounded"
                  />
                  <div className="flex items-center gap-2 z-10">
                    <span className="text-[11px] font-semibold text-gray-600">{item.label}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        item.setter("");
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 px-2 py-0.5 rounded bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <FileImage className="w-8 h-8 text-gray-300 mb-2" />
                  <span className="text-[12px] font-semibold text-gray-700">{item.label}</span>
                  <span className="text-[10.5px] text-muted mt-0.5">Click to upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUpload(e, item.setter)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="h-10 px-6 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
            color: "#013B36",
            boxShadow: "0 4px 12px rgba(110,231,183,0.25)",
          }}
        >
          {updateProfile.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Advocate Profile
            </>
          )}
        </button>
      </div>
    </form>
  );
}
