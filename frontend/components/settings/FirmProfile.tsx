import React, { useState } from "react";
import { Building2, FileImage, CreditCard, Mail, Phone, MapPin, Globe, Banknote } from "lucide-react";

export default function FirmProfile() {
  const [logo, setLogo] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogo(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <h2 className="text-[15px] font-semibold text-charcoal mb-5">Law Firm Profile</h2>
      <p className="text-[12px] text-muted mb-6">Firm details are used in invoices and professional correspondence.</p>

      <div className="flex gap-6 mb-6">
        <div className="w-32 flex-shrink-0">
          <div className="border border-dashed border-gray-200 rounded-xl p-2 h-32 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors relative overflow-hidden">
            {logo ? (
              <div className="relative group w-full h-full flex items-center justify-center">
                 <img src={logo} alt="Firm Logo" className="max-h-full max-w-full object-contain" />
                 <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[11px] font-bold text-red-600 cursor-pointer" onClick={() => setLogo(null)}>Remove</div>
              </div>
            ) : (
              <>
                <FileImage className="w-8 h-8 text-gray-300 mb-2" />
                <span className="text-[11px] font-semibold text-gray-700">Firm Logo</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Firm Name", icon: Building2, placeholder: "e.g. Sharma & Associates" },
            { label: "GST Number", icon: CreditCard, placeholder: "e.g. 27AAAAA0000A1Z5" },
            { label: "PAN Number", icon: CreditCard, placeholder: "e.g. ABCDE1234F" },
            { label: "Website", icon: Globe, placeholder: "www.sharma-law.in" },
            { label: "Email Address", icon: Mail, placeholder: "contact@sharma-law.in" },
            { label: "Mobile Number", icon: Phone, placeholder: "+91 98765 43210" },
          ].map((f, i) => (
            <div key={i}>
              <label className="text-[11px] font-semibold text-muted block mb-1.5">{f.label}</label>
              <div className="relative">
                <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                <input 
                  placeholder={f.placeholder}
                  className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-[11px] font-semibold text-muted block mb-1.5">Office Address</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-muted" />
          <textarea 
            placeholder="Complete office address"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal h-20 resize-none"
          />
        </div>
      </div>

      <h3 className="text-[13px] font-semibold text-charcoal mb-4 border-t border-gray-100 pt-5">Banking Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "Bank Account Details", icon: Banknote, placeholder: "A/C Number, IFSC, Branch Name" },
          { label: "UPI ID", icon: Phone, placeholder: "e.g. firmname@upi" },
        ].map((f, i) => (
          <div key={i}>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">{f.label}</label>
            <div className="relative">
              <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input 
                placeholder={f.placeholder}
                className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
