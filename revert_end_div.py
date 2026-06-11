with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '''    </div>
      </div>
    </div>
  );
}

function InfoRow''',
    '''    </div>
  );
}

function InfoRow'''
)

with open("frontend/app/(dashboard)/cases/[id]/page.tsx", "w") as f:
    f.write(content)
