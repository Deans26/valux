with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[913] = '                    <button onClick={e=>{e.stopPropagation();setEditCompany(c);}} style={{fontSize:11,color:C.saffron,background:"transparent",border:`1px solid ${C.saffron}`,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✏️ Edit</button>\n'

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
print('Fixed 914:', repr(lines2[913]))