import re

with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "r") as f:
    content = f.read()

# We can just use a simple regex to find all <div and </div and track their line numbers.
lines = content.split('\n')
stack = []

# To make it robust, we remove comments and strings
for i, line in enumerate(lines):
    # Very crude removal of string literals and comments
    line = re.sub(r'//.*', '', line)
    line = re.sub(r'\{/\*.*?\*/\}', '', line)
    
    # count <div
    for match in re.finditer(r'<div[\s>]', line):
        stack.append(i + 1)
        
    for match in re.finditer(r'</div\s*>', line):
        if stack:
            stack.pop()
        else:
            print(f"EXTRA CLOSING DIV AT LINE {i + 1}")

print(f"Unclosed divs opened at lines: {stack}")
