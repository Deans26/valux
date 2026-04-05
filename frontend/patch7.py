content = open('src/App.tsx', 'r', encoding='utf-8').read()

old_files = '                  <div style={{marginTop:12,paddingTop:12,borderTop:1px solid ,fontSize:12,color:C.textMuted}}>{c.files?.length||0} files uploaded</div>'
new_files = '''                  <div style={{marginTop:12,paddingTop:12,borderTop:1px solid ,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,color:C.textMuted}}>{c.files?.length||0} files uploaded</span>
                    <button onClick={e=>{e.stopPropagation();setEditCompany(c);}} style={{fontSize:11,color:C.saffron,background:"transparent",border:1px solid ,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✏️ Edit</button>
                  </div>'''

if old_files in content:
    content = content.replace(old_files, new_files)
    print('Edit button: FIXED')
else:
    print('Edit button: NOT FOUND')

open('src/App.tsx', 'w', encoding='utf-8').write(content)
