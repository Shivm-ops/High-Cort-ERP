import re

with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "r") as f:
    content = f.read()

notices_and_sections = """{/* NOTICES TAB */}
              {activeTab === "notices" && (
                !notices.length ? (
                  <EmptyTab icon={FileText} label="No notices tracked" action="Create a notice draft" onAction={() => { setDraftCategory("Notice"); setShowAddDraft(true); }} />
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notices.map((n) => (
                      <div key={n.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5"><FileText className="w-5 h-5 text-amber-500" /></div>
                          <div>
                            <div className="font-semibold text-sm text-gray-900">{n.title}</div>
                            <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{n.content}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                           <span className="text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-200">Reply Pending</span>
                           <button className="text-xs font-semibold px-3 py-1.5 bg-sidebar/5 text-sidebar hover:bg-sidebar/10 rounded-lg">Generate Reply</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* SECTIONS TAB */}
              {activeTab === "sections" && (
                (!caseData.acts_involved?.length && !caseData.sections_involved?.length) ? (
                  <EmptyTab icon={Briefcase} label="No sections added" action="Edit case details" onAction={() => setShowEdit(true)} />
                ) : (
                  <div className="p-5 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Gavel className="w-4 h-4 text-sidebar"/> Acts Involved</h3>
                      <div className="flex flex-col gap-2">
                         {caseData.acts_involved?.map(a => (
                           <div key={a} className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                             <div className="text-sm font-bold text-blue-900">{a}</div>
                           </div>
                         ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Pin className="w-4 h-4 text-sidebar"/> Sections</h3>
                      <div className="flex flex-col gap-2">
                         {caseData.sections_involved?.map(s => (
                           <div key={s} className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                             <div className="text-sm font-bold text-gray-900">Section {s}</div>
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>
                )
              )}"""

# We'll inject these new tabs just before the Modal declarations at the end of the file
# Looking for </Modal>... or the final `</div>\n      </div>\n    </div>`
content = re.sub(
    r'(?=\s*<Modal open=\{showEdit\})',
    f"\n\n              {notices_and_sections}\n\n",
    content
)

with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "w") as f:
    f.write(content)
