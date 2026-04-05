lines = open('src/App.tsx', 'r', encoding='utf-8').readlines()
lines[814] = '      const res=await fetch(/api/companies/,{\n'
open('src/App.tsx', 'w', encoding='utf-8').writelines(lines)
print('Fixed')
