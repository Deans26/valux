with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

modal_start = None
for i, line in enumerate(lines):
    if 'const EditCompanyModal' in line:
        modal_start = i
        break

print(f'EditCompanyModal at line {modal_start+1}')
for i in range(modal_start, modal_start+30):
    print(f'{i+1}: {lines[i].rstrip()}')