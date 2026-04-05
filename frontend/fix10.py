with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[1061] = '      const result=await api.post(`/valuation/${company.id}/generate`,{});\n'

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Fixed:', repr(open('src/App.tsx', 'r', encoding='utf-8').readlines()[1061]))