import React, { useState } from "react";
import { Scale, MapPin, Key, Laptop, FileCheck, Landmark } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";

export default function EFilingSettings() {
  const [activePortal, setActivePortal] = useState<string | null>(null);
  
  const [portals, setPortals] = useState([
    { name: "eCourts Services", status: "Connected", icon: Scale },
    { name: "High Court E-Filing", status: "Setup Required", icon: Landmark },
    { name: "Consumer Commission E-Filing (NCDRC/SCDRC)", status: "Connected", icon: FileCheck },
    { name: "MACT E-Filing", status: "Setup Required", icon: Laptop },
  ]);

  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Mumbai City");

  const handleSaveCredentials = () => {
    if (!activePortal) return;
    setPortals(prev => prev.map(p => p.name === activePortal ? { ...p, status: "Connected" } : p));
    toast.success(`${activePortal} credentials saved successfully!`);
    setActivePortal(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <h2 className="text-[15px] font-semibold text-charcoal mb-5">Court & E-Filing Settings</h2>
      <p className="text-[12px] text-muted mb-6">Configure your court jurisdictions and e-filing credentials.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="text-[11px] font-semibold text-muted block mb-1.5">Primary State</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <select 
              value={state}
              onChange={(e) => { setState(e.target.value); toast.success("Primary state updated"); }}
              className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal appearance-none"
            >
              <option>Maharashtra</option>
              <option>Delhi</option>
              <option>Karnataka</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted block mb-1.5">Primary District</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <select 
              value={district}
              onChange={(e) => { setDistrict(e.target.value); toast.success("Primary district updated"); }}
              className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal appearance-none"
            >
              <option>Mumbai City</option>
              <option>Mumbai Suburban</option>
              <option>Pune</option>
            </select>
          </div>
        </div>
      </div>

      <h3 className="text-[13px] font-semibold text-charcoal mb-4 border-t border-gray-100 pt-5">E-Filing Credentials</h3>
      <div className="space-y-4">
        {portals.map(portal => (
          <div key={portal.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50/50">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                 <portal.icon className="w-4 h-4 text-charcoal" />
               </div>
               <div>
                 <div className="text-[13px] font-semibold text-charcoal">{portal.name}</div>
                 <div className="text-[11px] text-muted">{portal.status === "Connected" ? "Credentials saved" : "Action needed"}</div>
               </div>
             </div>
             {portal.status === "Connected" ? (
               <button onClick={() => setActivePortal(portal.name)} className="text-[12px] font-semibold text-gray-500 border border-gray-300 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Manage</button>
             ) : (
               <button onClick={() => setActivePortal(portal.name)} className="text-[12px] font-semibold text-white bg-[#013B36] px-3 py-1.5 rounded-lg hover:bg-[#014D46] transition-colors">Connect</button>
             )}
          </div>
        ))}
      </div>

      <Modal open={!!activePortal} onClose={() => setActivePortal(null)} title={`Configure ${activePortal}`} size="sm">
        <div className="space-y-4">
          <p className="text-xs text-gray-500">Enter your official credentials for the {activePortal} portal to enable automatic data sync.</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Advocate Username / Reg No.</label>
            <input placeholder="Enter username" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6EE7B7]/30 focus:border-[#6EE7B7]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
            <input type="password" placeholder="••••••••" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6EE7B7]/30 focus:border-[#6EE7B7]" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setActivePortal(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSaveCredentials} className="rounded-xl bg-[#013B36] px-4 py-2 text-sm font-semibold text-white hover:bg-[#024a44]">Save Credentials</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
