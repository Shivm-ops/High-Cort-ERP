with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "r") as f:
    content = f.read()

import re

# We need to find the closing div of the action buttons.
# It looks like this:
#               {activeTab === "orders" && (
#                 <button ...>
#                   <Plus className="w-4 h-4" /> Record Order
#                 </button>
#               )}
#             </div>
#
#             <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden min-h-[400px]">

content = content.replace(
    '''              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden min-h-[400px]">''',
    '''              )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden min-h-[400px]">'''
)

with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "w") as f:
    f.write(content)
