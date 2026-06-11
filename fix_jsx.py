with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "r") as f:
    content = f.read()

# The inserted block starts with {/* NOTICES TAB */} and ends right before <Modal open={showEdit}
# The problem is it was inserted outside the divs.

import re

# Find the block we inserted
match = re.search(r'\{/\* NOTICES TAB \*/\}.*?(?=<Modal open=\{showEdit\})', content, re.DOTALL)
if match:
    inserted_block = match.group(0)
    
    # Remove it from the wrong place
    content = content.replace(inserted_block, "")
    
    # Where is the correct place?
    # Right after the ARGUMENTS TAB block
    # It ends with:
    #                 </div>
    #               )}
    #             </div>
    #           </div>
    
    # Let's find: {/* ── ARGUMENTS TAB ── */} or whatever the arguments tab is called
    arg_match = re.search(r'\{/\* ── ARGUMENTS TAB ── \*/\}.*?                  \)\n                \)\n              \)', content, re.DOTALL)
    
    if arg_match:
        pass # but that regex is brittle.
    
    # Instead, let's just find the end of the tabs wrapper:
    #               )}
    # 
    #             </div>
    #           </div>
    #         </div>
    #       </div>
    #       <Modal open={showEdit}
    
    # We can match:
    correct_injection_point = re.search(r'              \)\}\n\n            </div>\n          </div>\n        </div>\n      </div>\n', content)
    
    if correct_injection_point:
        # replace it with the block + the divs
        content = content.replace(
            correct_injection_point.group(0),
            f"              }}\n\n{inserted_block}            </div>\n          </div>\n        </div>\n      </div>\n"
        )
    else:
        print("Could not find correct injection point")

with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "w") as f:
    f.write(content)
