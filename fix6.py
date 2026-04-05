with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 815 is index 814
lines[814] = "      const res=await fetch(`/api/companies/${company.id}`,{\n"

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
print('Result:', repr(lines2[814]))