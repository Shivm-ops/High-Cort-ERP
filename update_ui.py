import re

with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "r") as f:
    content = f.read()

# 1. Update TabType to include notices and sections
content = re.sub(
    r'type TabType = "overview".*?;"',
    'type TabType = "overview" | "hearings" | "documents" | "evidence" | "drafts" | "filings" | "orders" | "notes" | "invoices" | "team" | "timeline" | "appeals" | "case_laws" | "arguments" | "notices" | "sections";',
    content,
    count=1
)

# 2. Add notices count and groups logic instead of flat TABS array
tabs_logic = """
  const notices = caseData.drafts?.filter(d => d.category === "Notice") || [];
  
  const TAB_GROUPS = [
    {
      group: "CASE MANAGEMENT",
      items: [
        { key: "overview", label: "Overview" },
        { key: "hearings", label: "Hearings", count: caseData.hearings?.length || 0 },
        { key: "timeline", label: "Timeline" },
        { key: "appeals", label: "Appeals" },
      ]
    },
    {
      group: "DOCUMENTS",
      items: [
        { key: "documents", label: "Documents", count: documents.length },
        { key: "evidence", label: "Evidence", count: evidence.length },
        { key: "drafts", label: "Drafts", count: caseData.drafts?.length || 0 },
        { key: "notices", label: "Notices", count: notices.length },
      ]
    },
    {
      group: "LEGAL WORK",
      items: [
        { key: "case_laws", label: "Case Laws", count: caseData.case_laws?.length || 0 },
        { key: "arguments", label: "Arguments", count: caseData.arguments?.length || 0 },
        { key: "sections", label: "Sections", count: caseData.sections_involved?.length || 0 },
      ]
    },
    {
      group: "FILING",
      items: [
        { key: "filings", label: "E-Filing" },
        { key: "orders", label: "Orders", count: orders.length },
        { key: "invoices", label: "Invoices", count: caseData.invoices?.length || 0 },
      ]
    }
  ];
"""

content = re.sub(
    r'const TABS: \{ key: TabType; label: string; count\?: number \}\[\] = \[.*?\];',
    tabs_logic.strip(),
    content,
    flags=re.DOTALL
)

# 3. Replace the TABS rendering logic
tabs_render_old = r'\{/\* Tab bar — two rows if needed \*/\}.*?\{/\* Action button per tab \*/\}'
tabs_render_new = """{/* Tab bar grouped */}
            <div className="space-y-4 print:hidden">
              {TAB_GROUPS.map((group) => (
                <div key={group.group}>
                  <div className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">{group.group}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((tab) => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key as TabType)}
                        className={cn("px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
                          activeTab === tab.key ? "bg-sidebar text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}>
                        {tab.label}
                        {tab.count !== undefined && (
                          <span className={cn("ml-1.5 text-[10px] rounded-full px-1.5 py-0.5",
                            activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500")}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-sidebar transition-colors shadow-sm">
                  <Printer className="w-3.5 h-3.5" /> Print Tab
                </button>
                {/* Action button per tab */}"""

content = re.sub(tabs_render_old, tabs_render_new, content, flags=re.DOTALL)

with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "w") as f:
    f.write(content)
