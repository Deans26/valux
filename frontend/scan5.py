with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

broken = []
for i, line in enumerate(lines, 1):
    l = line.rstrip()
    if ('borderTop:1px' in l or
        'borderBottom:1px' in l or
        'borderLeft:1px' in l or
        'borderRight:1px' in l or
        'border:1px solid ,' in l or
        'boxShadow:0 ' in l and '`' not in l and '"' not in l.split('boxShadow:')[1][:5] if 'boxShadow:' in l else False or
        'fetch(/api' in l or
        'api.post(/' in l or
        'api.get(/' in l or
        'background:rgba' in l and '`' not in l and '"rgba' not in l):
        broken.append((i, l[:120]))

for num, line in broken:
    print(f'Line {num}: {line}')
print(f'Total broken: {len(broken)}')