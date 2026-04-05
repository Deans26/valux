with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_submit = [
    '  const submit=async()=>{\n',
    '    if(!name.trim()||!industry||!stage){setErr("Name, industry and stage are required.");return;}\n',
    '    setLoading(true);setErr("");\n',
    '    try{\n',
    '      const res=await fetch(`/api/companies/${company.id}`,{\n',
    '        method:"PUT",\n',
    '        headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("valux_token")}`},\n',
    '        body:JSON.stringify({name,doi,industry,stage,company_type:type,state})\n',
    '      });\n',
    '      const updated=await res.json();\n',
    '      if(!res.ok){setErr(updated.detail||"Update failed");setLoading(false);return;}\n',
    '      onSave({...company,...updated,type:updated.company_type});\n',
    '      onClose();\n',
    '    }catch(e){\n',
    '      setErr(e?.detail||"Update failed");\n',
    '    }\n',
    '    setLoading(false);\n',
    '  };\n',
]

# Replace lines 843-860 (indices 842-859)
lines = lines[:842] + new_submit + lines[860:]

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
print('New submit:')
for i in range(842, 860):
    print(f'{i+1}: {lines2[i].rstrip()}')