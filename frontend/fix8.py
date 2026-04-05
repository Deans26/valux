with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('Line 914:', repr(lines[913]))
print('Line 1052:', repr(lines[1051]))

# Fix line 1052 - api.post template literal
lines[1051] = '        await api.post(`/companies/${company.id}/financials`,{\n'

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
print('Fixed 1052:', repr(lines2[1051]))