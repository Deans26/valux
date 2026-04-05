lines = open('src/App.tsx', 'r', encoding='utf-8').readlines()
print('Line 815:', repr(lines[814]))
lines[814] = '      const res=await fetch(/api/companies/,{\n'
open('src/App.tsx', 'w', encoding='utf-8').writelines(lines)
# Verify
lines2 = open('src/App.tsx', 'r', encoding='utf-8').readlines()
print('After fix:', repr(lines2[814]))
