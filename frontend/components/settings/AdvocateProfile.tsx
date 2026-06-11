import React, { useState } from "react";
import { User, Key, Mail, Phone, MapPin, Calendar, FileImage, Shield } from "lucide-react";

interface AdvocateProfileProps {
  profileData: { full_name: string; phone: string; };
  setProfileData: React.Dispatch<React.SetStateAction<{ full_name: string; phone: string; }>>;
}

export default function AdvocateProfile({ profileData, setProfileData }: AdvocateProfileProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [seal, setSeal] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setter(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <h2 className="text-[15px] font-semibold text-charcoal mb-5">Advocate Profile</h2>
      <p className="text-[12px] text-muted mb-6">These details will automatically appear in notices, affidavits, petitions, and invoices.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">Advocate Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input 
                value={profileData.full_name}
                onChange={e => setProfileData(p => ({ ...p, full_name: e.target.value }))}
                placeholder="e.g. Abhijit Patil"
                className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input 
                value={profileData.phone}
                onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">Enrollment Number</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input placeholder="e.g. MAH/123/2020" className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input placeholder="advocate@example.com" className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal" />
            </div>
          </div>
        </div>

      <h3 className="text-[13px] font-semibold text-charcoal mb-4 border-t border-gray-100 pt-5">Identity & Signatures</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Advocate Photograph", state: photo, setter: setPhoto },
          { label: "Digital Signature", state: signature, setter: setSignature },
          { label: "Advocate Seal", state: seal, setter: setSeal }
        ].map((item, idx) => (
          <div key={idx} className="border border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors relative overflow-hidden">
            {item.state ? (
              <div className="mb-2 relative group w-full flex justify-center">
                 <img src={item.state} alt={item.label} className="max-h-20 object-contain" />
                 <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[11px] font-bold text-red-600 cursor-pointer" onClick={() => item.setter(null)}>Remove</div>
              </div>
            ) : (
              <FileImage className="w-8 h-8 text-gray-300 mb-2" />
            )}
            <span className="text-[12px] font-semibold text-gray-700">{item.label}</span>
            <input type="file" accept="image/*" onChange={(e) => handleUpload(e, item.setter)} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        ))}
      </div>
    </div>
  );
}
