import re

with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "r") as f:
    content = f.read()

overview_new = """{/* OVERVIEW */}
              {activeTab === "overview" && (
                <div className="p-5 space-y-6 bg-gray-50/50">
                  
                  {/* CLIENT SUMMARY CARD */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-sidebar" /> Client Summary
                      </h3>
                      {clientData && (
                        <button onClick={() => router.push(`/clients/${clientData.id}`)} className="text-xs font-semibold text-sidebar hover:underline">
                          View Full Profile
                        </button>
                      )}
                    </div>
                    {clientData ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Name</div>
                          <div className="text-sm font-medium text-gray-900">{clientData.name}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Phone</div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400"/> {clientData.phone || "—"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Email</div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400"/> {clientData.email || "—"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Identity</div>
                          <div className="text-xs text-gray-700 flex flex-col gap-1">
                            <span className="flex items-center gap-1"><Hash className="w-3 h-3 text-gray-400"/> PAN: {clientData.pan_number || "—"}</span>
                            <span className="flex items-center gap-1"><Hash className="w-3 h-3 text-gray-400"/> Aadhaar: {clientData.aadhaar_number || "—"}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Loading client data...</div>
                    )}
                  </div>

                  {/* MATTER PROGRESS & FILING READINESS */}
                  <div className="grid grid-cols-2 gap-5">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-mint" /> Matter Progress
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xl font-bold text-gray-900">{documents.length}</div>
                          <div className="text-xs font-semibold text-gray-500">Documents Uploaded</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xl font-bold text-gray-900">{evidence.length}</div>
                          <div className="text-xs font-semibold text-gray-500">Evidence Uploaded</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xl font-bold text-gray-900">{caseData.drafts?.length || 0}</div>
                          <div className="text-xs font-semibold text-gray-500">Drafts Completed</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xl font-bold text-gray-900">{caseData.hearings?.length || 0}</div>
                          <div className="text-xs font-semibold text-gray-500">Hearings Scheduled</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <Award className="w-4 h-4 text-blue-500" /> Filing Readiness
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">Based on critical documents and drafts present.</p>
                        
                        {(() => {
                          let score = 20; // Base score
                          const hasVakalatnama = caseData.drafts?.some(d => d.title.toLowerCase().includes("vakalatnama") || d.category?.toLowerCase() === "vakalatnama");
                          const hasAffidavit = caseData.drafts?.some(d => d.title.toLowerCase().includes("affidavit"));
                          const hasEvidence = evidence.length > 0;
                          const hasIdentity = documents.some(d => d.title.toLowerCase().includes("aadhaar") || d.title.toLowerCase().includes("pan"));
                          
                          if (hasVakalatnama) score += 30;
                          if (hasAffidavit) score += 20;
                          if (hasEvidence) score += 15;
                          if (hasIdentity) score += 15;
                          
                          return (
                            <>
                              <div className="flex items-end justify-between mb-2">
                                <span className="text-3xl font-black text-gray-900">{score}%</span>
                                <span className="text-xs font-semibold text-gray-500 uppercase">Ready</span>
                              </div>
                              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                                <div className={cn("h-full rounded-full transition-all", score > 80 ? "bg-green-500" : score > 50 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${score}%` }}></div>
                              </div>
                              
                              <div className="space-y-1.5">
                                {!hasVakalatnama && <div className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3 h-3"/> Missing Vakalatnama</div>}
                                {!hasAffidavit && <div className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3 h-3"/> Missing Affidavit</div>}
                                {!hasIdentity && <div className="text-xs text-amber-600 flex items-center gap-1.5"><AlertCircle className="w-3 h-3"/> Missing Client ID Proof</div>}
                                {!hasEvidence && <div className="text-xs text-amber-600 flex items-center gap-1.5"><AlertCircle className="w-3 h-3"/> No Evidence Uploaded</div>}
                                {score === 100 && <div className="text-xs text-green-600 flex items-center gap-1.5"><CheckCircle className="w-3 h-3"/> Ready for filing</div>}
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* EVIDENCE SUMMARY & LEGAL WORK SUMMARY */}
                  <div className="grid grid-cols-2 gap-5">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-purple-500" /> Evidence Summary
                      </h3>
                      {(() => {
                        const photos = evidence.filter(e => e.doc_type === "photo").length;
                        const videos = evidence.filter(e => e.doc_type === "video").length;
                        const audio = evidence.filter(e => e.doc_type === "audio").length;
                        const pdfs = evidence.filter(e => e.doc_type === "document").length;
                        return (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <ImageIcon className="w-5 h-5 text-blue-500"/>
                              <div><div className="text-sm font-bold">{photos}</div><div className="text-[10px] font-semibold text-gray-500 uppercase">Photos</div></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <Video className="w-5 h-5 text-purple-500"/>
                              <div><div className="text-sm font-bold">{videos}</div><div className="text-[10px] font-semibold text-gray-500 uppercase">Videos</div></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <FileText className="w-5 h-5 text-red-500"/>
                              <div><div className="text-sm font-bold">{pdfs}</div><div className="text-[10px] font-semibold text-gray-500 uppercase">PDFs/Docs</div></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <Music className="w-5 h-5 text-green-500"/>
                              <div><div className="text-sm font-bold">{audio}</div><div className="text-[10px] font-semibold text-gray-500 uppercase">Audio</div></div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                    
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Gavel className="w-4 h-4 text-amber-600" /> Legal Work Summary
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-sm font-bold text-gray-900">{caseData.case_laws?.length || 0}</div>
                            <div className="text-[10px] font-semibold text-gray-500 uppercase">Case Laws Added</div>
                          </div>
                          <button onClick={() => setActiveTab("case_laws")} className="text-xs text-sidebar font-semibold hover:underline">View</button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-sm font-bold text-gray-900">{caseData.arguments?.length || 0}</div>
                            <div className="text-[10px] font-semibold text-gray-500 uppercase">Arguments Drafted</div>
                          </div>
                          <button onClick={() => setActiveTab("arguments")} className="text-xs text-sidebar font-semibold hover:underline">View</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* APPLICABLE SECTIONS PANEL */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                     <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-700" /> Applicable Acts & Sections
                     </h3>
                     {(caseData.acts_involved?.length || caseData.sections_involved?.length) ? (
                      <div className="space-y-4">
                        {caseData.acts_involved?.length > 0 && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Acts</div>
                            <div className="flex flex-wrap gap-2">
                              {caseData.acts_involved.map((a) => <span key={a} className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2.5 py-1">{a}</span>)}
                            </div>
                          </div>
                        )}
                        {caseData.sections_involved?.length > 0 && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Sections</div>
                            <div className="flex flex-wrap gap-2">
                              {caseData.sections_involved.map((s) => <span key={s} className="text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1">Section {s}</span>)}
                            </div>
                          </div>
                        )}
                      </div>
                     ) : (
                       <div className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-lg">No acts or sections added yet.</div>
                     )}
                  </div>
                  
                  {/* EXISTING CASE INFO DETAILS (Moved to bottom of overview) */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Matter Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Case Number", value: caseData.case_no },
                        { label: "Court Name", value: caseData.court },
                        { label: "Judge Name", value: caseData.judge || "—" },
                        { label: "Practice Area", value: caseData.practice_area },
                        { label: "Current Status", value: caseData.status },
                        { label: "Current Stage", value: caseData.stage },
                        { label: "Petitioner", value: caseData.petitioner || "—" },
                        { label: "Respondent", value: caseData.respondent || "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-lg p-3">
                          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">{label}</div>
                          <div className="font-medium text-gray-900 text-sm">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}"""

# Replace the old OVERVIEW section (from {/* OVERVIEW */} to {/* HEARINGS */})
content = re.sub(
    r'\{/\* OVERVIEW \*/\}.*?\{/\* HEARINGS \*/\}',
    overview_new + "\n\n              {/* HEARINGS */}",
    content,
    flags=re.DOTALL
)

with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "w") as f:
    f.write(content)
