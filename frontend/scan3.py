with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

broken = []
for i, line in enumerate(lines, 1):
    l = line.rstrip()
    # Check for template literals missing backticks
    if ('fetch(/' in l or
        'api.post(/' in l or
        'api.get(/' in l or
        'borderTop:1px' in l or
        'borderBottom:1px' in l or
        'border:1px solid ,' in l or
        'boxShadow:0 1px' in l or
        'background:rgba' in l or
        '${C.' in l and '`' not in l):
        broken.append((i, l[:100]))

for num, line in broken:
    print(f'Line {num}: {line}')
print(f'Total: {len(broken)}')