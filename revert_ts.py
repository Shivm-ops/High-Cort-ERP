import re

with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "r") as f:
    content = f.read()

# Revert CaseDocument file_name to title
content = content.replace("d.file_name.toLowerCase()", "d.title.toLowerCase()")

# But what about CaseDraft? `d.file_name` does not exist on `CaseDraft`.
# Wait, I changed `d.title` to `d.file_name` everywhere. CaseDraft HAS title.
# It seems my replace was too broad.
content = content.replace("d.file_name", "d.title")

with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "w") as f:
    f.write(content)

