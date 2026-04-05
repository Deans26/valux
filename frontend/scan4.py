with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Check every line for syntax issues
broken = []
for i, line in enumerate(lines, 1):
    l = line.rstrip()
    # Missing backtick in style props
    if ':1px solid ' in l and '`' not in l and l.strip().startswith('<'):
        broken.append((i, l[:120]))
    if ':0 1px' in l and '`' not in l:
        broken.append((i, l[:120]))
    if ':0 4px' in l and '`' not in l:
        broken.append((i, l[:120]))
    if 'rgba(0,0,0' in l and '`' not in l and 'background:rgba' in l:
        broken.append((i, l[:120]))

for num, line in broken:
    print(f'Line {num}: {line}')
print(f'Total: {len(broken)}')