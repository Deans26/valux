lines = open('src/App.tsx', 'r', encoding='utf-8').readlines()
lines[831] = '                  <div style={{marginTop:12,paddingTop:12,borderTop:1px solid ,display:"flex",alignItems:"center",justifyContent:"space-between"}}>\n                    <span style={{fontSize:12,color:C.textMuted}}>{c.files?.length||0} files uploaded</span>\n                    <button onClick={e=>{e.stopPropagation();setEditCompany(c);}} style={{fontSize:11,color:C.saffron,background:"transparent",border:1px solid ,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✏️ Edit</button>\n                  </div>\n'
open('src/App.tsx', 'w', encoding='utf-8').writelines(lines)
print('Edit button: FIXED')
