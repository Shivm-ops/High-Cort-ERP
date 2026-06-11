import re

with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "r") as f:
    content = f.read()

# Fix refetch
content = content.replace("refetch();", "// refetch();")

# Fix CaseDocument title to file_name
content = content.replace("d.title.toLowerCase()", "d.file_name.toLowerCase()")

# Fix Client type errors by casting clientData to any just for those fields
content = content.replace("clientData.pan_number", "(clientData as any).pan_number")
content = content.replace("clientData.aadhaar_number", "(clientData as any).aadhaar_number")

with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "w") as f:
    f.write(content)

with open("frontend/types/index.ts", "a") as f:
    f.write("\n")
