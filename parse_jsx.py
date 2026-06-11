def find_mismatch(file_path):
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    stack = []
    for i, line in enumerate(lines):
        # Very simple tag matching, might get confused by strings or comments,
        # but let's try to only count <div and </div
        # Also let's ignore comments
        if "//" in line and "<div" not in line.split("//")[0]:
            pass
            
        opens = line.count('<div ') + line.count('<div>') + line.count('<div\n')
        closes = line.count('</div')
        
        for _ in range(opens):
            stack.append(i + 1)
        for _ in range(closes):
            if stack:
                stack.pop()
            else:
                print(f"Extra closing tag at line {i + 1}")
    
    if stack:
        print(f"Unclosed tags opened at lines: {stack}")
    else:
        print("All tags matched (roughly)")

find_mismatch("frontend/app/(dashboard)/cases/[id]/page.tsx")
