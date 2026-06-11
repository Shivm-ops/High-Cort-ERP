import React, { useState } from "react";
import { Palette, Type, Layout, Image as ImageIcon, Monitor, CheckCircle2, SlidersHorizontal, ChevronRight, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

import { PREDEFINED_THEMES, useThemeStore } from "@/lib/store/themeStore";

export default function ThemeSettings() {
  const { activeThemeId, customColors, typography, setActiveThemeId, setCustomColors, setTypography } = useThemeStore();

  const currentThemeObj = activeThemeId === "custom" ? { primary: customColors.primary, accent: customColors.accent, isLight: false } : PREDEFINED_THEMES.find(t => t.id === activeThemeId) || PREDEFINED_THEMES[0];
  const isLightPrimary = currentThemeObj.primary === "#FFFFFF";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-charcoal">Professional Theme Management</h2>
          <p className="text-[12px] text-muted mt-1">Personalize the platform to match your professional image.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Settings Configuration Column */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Predefined Themes */}
          <div>
            <h3 className="text-[13px] font-semibold text-charcoal mb-4 flex items-center gap-1.5"><Palette className="w-4 h-4" /> Predefined Themes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PREDEFINED_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setActiveThemeId(theme.id)}
                  className={cn(
                    "flex flex-col text-left p-3 rounded-xl border transition-all relative overflow-hidden group",
                    activeThemeId === theme.id ? "border-[#013B36] ring-1 ring-[#013B36]" : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                  style={activeThemeId === theme.id ? { backgroundColor: theme.isLight ? '#f9fafb' : theme.primary + '08' } : {}}
                >
                  {/* Color Swatch */}
                  <div className="flex w-full h-8 rounded-lg mb-2 overflow-hidden border border-gray-100 shadow-sm">
                    <div className="flex-1" style={{ backgroundColor: theme.primary }}></div>
                    <div className="w-1/3" style={{ backgroundColor: theme.accent }}></div>
                  </div>
                  <div className="text-[12px] font-semibold text-charcoal group-hover:text-[#013B36]">{theme.name}</div>
                  <div className="text-[10px] text-muted leading-tight mt-0.5">{theme.desc}</div>
                  {activeThemeId === theme.id && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-[#013B36]" />}
                </button>
              ))}
              
              {/* Custom Theme Button */}
              <button
                onClick={() => setActiveThemeId("custom")}
                className={cn(
                  "flex flex-col items-center justify-center text-center p-3 rounded-xl border transition-all border-dashed",
                  activeThemeId === "custom" ? "border-[#013B36] bg-[#013B36]/5" : "border-gray-300 hover:border-gray-400 bg-gray-50/50"
                )}
              >
                <SlidersHorizontal className={cn("w-5 h-5 mb-1.5", activeThemeId === "custom" ? "text-[#013B36]" : "text-gray-400")} />
                <div className="text-[12px] font-semibold text-charcoal">Custom Theme</div>
              </button>
            </div>
          </div>

          {/* Custom Theme Picker (Only visible if activeThemeId === "custom") */}
          {activeThemeId === "custom" && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="text-[12px] font-semibold text-charcoal mb-3">Custom Color Palette</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(customColors).map(([key, val]) => {
                  if (key === 'isLight') return null;
                  return (
                    <div key={key}>
                      <label className="text-[10px] font-semibold text-muted uppercase block mb-1">{key} Color</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={val as string}
                          onChange={(e) => setCustomColors({ [key]: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                        />
                        <input 
                          type="text" 
                          value={val as string}
                          onChange={(e) => setCustomColors({ [key]: e.target.value })}
                          className="flex-1 h-8 px-2 text-[11px] font-medium text-charcoal border border-gray-200 rounded outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Typography & Layout */}
          <div>
            <h3 className="text-[13px] font-semibold text-charcoal mb-4 flex items-center gap-1.5"><Type className="w-4 h-4" /> Typography & Structure</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1.5">Font Style</label>
                <select 
                  value={typography.fontStyle}
                  onChange={(e) => setTypography({ fontStyle: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 outline-none focus:border-[#6EE7B7]"
                >
                  <option value="Inter">Inter (Modern & Clean)</option>
                  <option value="Merriweather">Merriweather (Traditional Serif)</option>
                  <option value="Roboto">Roboto (Professional)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1.5">Font Size Base</label>
                <select 
                  value={typography.fontSize}
                  onChange={(e) => setTypography({ fontSize: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 outline-none focus:border-[#6EE7B7]"
                >
                  <option value="12px">Compact (12px)</option>
                  <option value="13px">Standard (13px)</option>
                  <option value="14px">Large (14px)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1.5">Border Radius (Corners)</label>
                <select 
                  value={typography.borderRadius}
                  onChange={(e) => setTypography({ borderRadius: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 outline-none focus:border-[#6EE7B7]"
                >
                  <option value="0.25rem">Sharp (4px)</option>
                  <option value="0.5rem">Subtle (8px)</option>
                  <option value="0.75rem">Rounded (12px) - Default</option>
                  <option value="1rem">Pill (16px)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1.5">Density / Layout</label>
                <select 
                  value={typography.layout}
                  onChange={(e) => setTypography({ layout: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 outline-none focus:border-[#6EE7B7]"
                >
                  <option value="compact">Compact (More data)</option>
                  <option value="comfortable">Comfortable (More spacing)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Branding Assets */}
          <div>
            <h3 className="text-[13px] font-semibold text-charcoal mb-4 flex items-center gap-1.5"><ImageIcon className="w-4 h-4" /> Branding Assets</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Dashboard Logo', 'Login Branding', 'Invoice Accent', 'Portal Banner'].map(label => (
                <div key={label} className="border border-dashed border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer h-24 relative overflow-hidden">
                  <FileImage className="w-5 h-5 text-gray-300 mb-1" />
                  <span className="text-[10px] font-semibold text-gray-600">{label}</span>
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Live Preview Panel Column */}
        <div className="lg:col-span-5 relative">
           <div className="sticky top-6">
             <h3 className="text-[13px] font-semibold text-charcoal mb-4 flex items-center gap-1.5"><Monitor className="w-4 h-4" /> Live Theme Preview</h3>
             
             {/* THE PREVIEW CONTAINER */}
             <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-lg bg-gray-50 flex" style={{ height: '500px', fontFamily: typography.fontStyle }}>
               
               {/* Preview Sidebar */}
               <div className="w-16 md:w-32 flex-shrink-0 flex flex-col transition-colors duration-300" style={{ backgroundColor: currentThemeObj.primary }}>
                 {/* Sidebar Header */}
                 <div className="h-12 flex items-center justify-center border-b border-white/10">
                   <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shadow-sm" style={{ backgroundColor: currentThemeObj.accent, color: isLightPrimary ? '#ffffff' : '#000000' }}>
                     L
                   </div>
                 </div>
                 {/* Sidebar Menu Items */}
                 <div className="flex-1 py-4 flex flex-col gap-2 px-2">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="h-8 rounded flex items-center px-2 gap-2 transition-colors duration-300" style={{ backgroundColor: i === 1 ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                       <div className="w-4 h-4 rounded-sm bg-white/20"></div>
                       <div className="h-2 w-12 rounded hidden md:block" style={{ backgroundColor: i === 1 ? currentThemeObj.accent : 'rgba(255,255,255,0.4)' }}></div>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Preview Main Content */}
               <div className="flex-1 flex flex-col bg-[#F8FAFC]">
                 {/* Preview Header */}
                 <div className="h-12 bg-white border-b border-gray-100 flex items-center px-4 justify-between">
                   <div className="w-24 h-3 bg-gray-200 rounded"></div>
                   <div className="w-6 h-6 rounded-full" style={{ backgroundColor: currentThemeObj.primary }}></div>
                 </div>

                 {/* Preview Body */}
                 <div className="flex-1 p-4" style={{ padding: typography.layout === 'compact' ? '0.75rem' : '1.25rem' }}>
                   
                   <div className="flex justify-between items-center mb-4">
                     <div>
                       <div className="w-32 h-4 bg-gray-800 rounded mb-1" style={{ fontSize: typography.fontSize }}></div>
                       <div className="w-20 h-2 bg-gray-400 rounded"></div>
                     </div>
                     <button className="px-3 h-7 flex items-center text-[10px] font-semibold text-white shadow-sm transition-colors duration-300" style={{ backgroundColor: currentThemeObj.primary, borderRadius: typography.borderRadius }}>
                       Create New
                     </button>
                   </div>

                   {/* Preview Cards */}
                   <div className="grid grid-cols-2 gap-3 mb-4">
                     {[1,2].map(i => (
                       <div key={i} className="bg-white border border-gray-100 shadow-sm p-3" style={{ borderRadius: typography.borderRadius }}>
                         <div className="w-6 h-6 rounded mb-2 flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: currentThemeObj.accent + '20' }}>
                           <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: currentThemeObj.accent }}></div>
                         </div>
                         <div className="w-16 h-3 bg-gray-800 rounded mb-1.5"></div>
                         <div className="w-8 h-5 bg-gray-200 rounded"></div>
                       </div>
                     ))}
                   </div>

                   {/* Preview List */}
                   <div className="bg-white border border-gray-100 shadow-sm" style={{ borderRadius: typography.borderRadius }}>
                     <div className="p-3 border-b border-gray-100">
                       <div className="w-24 h-3 bg-gray-800 rounded"></div>
                     </div>
                     {[1,2,3].map(i => (
                       <div key={i} className="px-3 py-2 border-b border-gray-50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className="w-5 h-5 rounded-full bg-gray-100"></div>
                           <div>
                             <div className="w-16 h-2 bg-gray-700 rounded mb-1"></div>
                             <div className="w-12 h-1.5 bg-gray-400 rounded"></div>
                           </div>
                         </div>
                         <ChevronRight className="w-3 h-3 text-gray-300" />
                       </div>
                     ))}
                   </div>

                 </div>
               </div>
             </div>
             {/* End Preview Container */}
             <div className="mt-3 text-[11px] text-center text-muted">
               Styles will apply to Dashboards, Portals, and Invoices.
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
