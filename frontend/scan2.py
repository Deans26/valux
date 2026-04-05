with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

broken = []
for i, line in enumerate(lines, 1):
    if ('fetch(/api' in line or 
        'api.post(/companies' in line or
        'api.post(/valuation' in line or
        'borderTop:1px' in line or
        'border:1px solid ,' in line or
        'borderBottom:1px' in line or
        'boxShadow:0 ' in line):
        broken.append((i, line.strip()[:100]))

for num, line in broken:
    print(f'Line {num}: {line}')
print(f'Total remaining: {len(broken)}')