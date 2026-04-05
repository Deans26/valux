with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[1051] = '        await api.post(`/companies/${company.id}/financials`,{\n'
lines[1061] = '      const result=await api.post(`/valuation/${company.id}/generate`,{});\n'

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
print('Line 1052:', repr(lines2[1051]))
print('Line 1062:', repr(lines2[1061]))