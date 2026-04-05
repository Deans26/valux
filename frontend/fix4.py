with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

fixed = content.replace(
    'const res=await fetch(/api/companies/,{',
    'const res=await fetch(/api/companies/,{'
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(fixed)

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if 'fetch' in line and 'companies' in line:
            print(f'Line {i}: {line.rstrip()}')
