with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all lines with potential broken template literals
lines = content.split('\n')
broken = []
for i, line in enumerate(lines, 1):
    if ('borderTop:1px' in line or 
        'border:1px' in line or
        'fetch(/api' in line or
        'fetch(/api' in line or
        'api.post(/companies' in line or
        'background:rgba' in line and '`' not in line and 'rgba(' not in line):
        broken.append((i, line.strip()[:80]))

for num, line in broken:
    print(f'Line {num}: {line}')
print(f'Total broken: {len(broken)}')