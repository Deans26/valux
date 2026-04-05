with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const res=await fetch(/api/companies/,{',
    'const res=await fetch(/api/companies/,{'
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Verify
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
print('Line 815:', repr(lines[814]))
