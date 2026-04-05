content = open('src/App.tsx', 'r', encoding='utf-8').read()

# Fix proj calculation with null guards
old_proj = '''  const proj=["FY25","FY26","FY27","FY28","FY29","FY30"].map((yr,i)=>{
    const g=Math.pow(1+bench.growth,i);
    const rev=(modelData.revenueY1||100)*g;
    return {year:yr,bear:+(modelData.bearVal*Math.pow(1+bench.growth*0.6,i)).toFixed(2),base:+(modelData.baseVal*g).toFixed(2),bull:+(modelData.bullVal*Math.pow(1+bench.growth*1.3,i)).toFixed(2),revenue:+rev.toFixed(2),ebitda:+(rev*bench.ebitdaMargin).toFixed(2),pat:+(rev*0.09).toFixed(2)};
  });'''

new_proj = '''  const proj=(modelData.projections&&modelData.projections.length>0)
    ? modelData.projections.map((p,i)=>({
        year:p.year||"FY"+(2026+i),
        bear:+((modelData.bearVal||0)*Math.pow(1+0.006,i)).toFixed(2),
        base:+((modelData.baseVal||0)*Math.pow(1+bench.growth,i)).toFixed(2),
        bull:+((modelData.bullVal||0)*Math.pow(1+bench.growth*1.3,i)).toFixed(2),
        revenue:+((p.revenue||0).toFixed(2)),
        ebitda:+((p.ebitda||0).toFixed(2)),
        pat:+((p.pat||0).toFixed(2)),
      }))
    : ["FY26","FY27","FY28","FY29","FY30"].map((yr,i)=>{
        const g=Math.pow(1+bench.growth,i);
        const rev=(modelData.revenueY1||100)*g;
        return {year:yr,bear:+((modelData.bearVal||0)*Math.pow(1+bench.growth*0.6,i)).toFixed(2),base:+((modelData.baseVal||0)*g).toFixed(2),bull:+((modelData.bullVal||0)*Math.pow(1+bench.growth*1.3,i)).toFixed(2),revenue:+rev.toFixed(2),ebitda:+(rev*bench.ebitdaMargin).toFixed(2),pat:+(rev*0.09).toFixed(2)};
      });'''

if old_proj in content:
    content = content.replace(old_proj, new_proj)
    print('proj: FIXED')
else:
    print('proj: NOT FOUND')

# Fix Dashboard to add onEdit prop
old_dash = 'const Dashboard=({user,companies,onAdd,onSelect})=>{'
new_dash = 'const Dashboard=({user,companies,onAdd,onSelect,onEdit})=>{'
if old_dash in content:
    content = content.replace(old_dash, new_dash)
    print('Dashboard prop: FIXED')
else:
    print('Dashboard prop: NOT FOUND')

# Fix Dashboard state - add editCompany
old_dash_state = 'const Dashboard=({user,companies,onAdd,onSelect,onEdit})=>{\n  const [modal,setModal]=useState(false);\n  return ('
new_dash_state = '''const Dashboard=({user,companies,onAdd,onSelect,onEdit})=>{
  const [modal,setModal]=useState(false);
  const [editCompany,setEditCompany]=useState(null);
  return ('''
if old_dash_state in content:
    content = content.replace(old_dash_state, new_dash_state)
    print('Dashboard state: FIXED')
else:
    print('Dashboard state: NOT FOUND')

# Add Edit button to company card
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

# Add EditCompanyModal to Dashboard
old_modal = '      {modal&&<CreateCompanyModal onClose={()=>setModal(false)} onSave={(c)=>{onAdd(c);setModal(false);}}/>}\n      <Chatbot/>'
new_modal = '''      {modal&&<CreateCompanyModal onClose={()=>setModal(false)} onSave={(c)=>{onAdd(c);setModal(false);}}/>}
      {editCompany&&<EditCompanyModal company={editCompany} onClose={()=>setEditCompany(null)} onSave={(c)=>{onEdit(c);setEditCompany(null);}}/>}
      <Chatbot/>'''
if old_modal in content:
    content = content.replace(old_modal, new_modal)
    print('EditCompanyModal render: FIXED')
else:
    print('EditCompanyModal render: NOT FOUND')

# Fix App root Dashboard render to add onEdit
old_dash_render = '{screen==="dashboard"&&user&&<Dashboard user={user} companies={companies} onAdd={handleAdd} onSelect={handleSelect}/>}'
new_dash_render = '{screen==="dashboard"&&user&&<Dashboard user={user} companies={companies} onAdd={handleAdd} onSelect={handleSelect} onEdit={handleUpdate}/>}'
if old_dash_render in content:
    content = content.replace(old_dash_render, new_dash_render)
    print('Dashboard onEdit: FIXED')
else:
    print('Dashboard onEdit: NOT FOUND')

open('src/App.tsx', 'w', encoding='utf-8').write(content)
print('All patches done')
