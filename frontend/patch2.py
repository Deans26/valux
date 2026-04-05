content = open('src/App.tsx', 'r', encoding='utf-8').read()

# Fix CreateCompanyModal submit
old = '    onSave({name:name.trim(),cin:cin.trim(),doi,industry,stage,type,state,id:Date.now().toString(),files:[],modelGenerated:false,connectedERPs:{}});'
new = '''    try{
      const data=await api.post("/companies",{
        name:name.trim(),cin:cin.trim(),doi,
        industry,stage,
        company_type:type,
        state
      });
      onSave({
        id:data.id,
        name:name.trim(),cin:cin.trim(),doi,
        industry,stage,type,state,
        files:[],modelGenerated:false,connectedERPs:{}
      });
    }catch(e){
      setErr(e?.detail||"Failed to create company. Is the backend running?");
    }'''
if old in content:
    content = content.replace(old, new)
    print('CreateCompanyModal submit: FIXED')
else:
    print('CreateCompanyModal submit: NOT FOUND')

# Fix CreateCompanyModal to async
content = content.replace(
    '  const submit=()=>{\n    if(!name.trim()||!cin.trim()',
    '  const submit=async()=>{\n    if(!name.trim()||!cin.trim()'
)
print('submit async: FIXED')

open('src/App.tsx', 'w', encoding='utf-8').write(content)
