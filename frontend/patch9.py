content = open('src/App.tsx', 'r', encoding='utf-8').read()

edit_modal = '''
const EditCompanyModal=({company,onClose,onSave})=>{
  const [name,setName]=useState(company.name||"");
  const [cin,setCin]=useState(company.cin||"");
  const [doi,setDoi]=useState(company.doi||"");
  const [industry,setIndustry]=useState(company.industry||"");
  const [stage,setStage]=useState(company.stage||"");
  const [type,setType]=useState(company.type||company.company_type||"");
  const [state,setState]=useState(company.state||"");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const submit=async()=>{
    if(!name.trim()||!industry||!stage){setErr("Name, industry and stage are required.");return;}
    setLoading(true);setErr("");
    try{
      const res=await fetch(/api/companies/,{
        method:"PUT",
        headers:{"Content-Type":"application/json",Authorization:Bearer },
        body:JSON.stringify({name,doi,industry,stage,company_type:type,state,...(!company.cin_verified&&cin?{cin}:{})})
      });
      const updated=await res.json();
      if(!res.ok){setErr(updated.detail||"Update failed");setLoading(false);return;}
      onSave({...company,...updated,type:updated.company_type});
      onClose();
    }catch(e){
      setErr(e?.detail||"Update failed");
    }
    setLoading(false);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:"#FFFFFF",border:"1px solid #E2E6EA",borderRadius:12,padding:"1.5rem",boxShadow:"0 4px 16px rgba(0,0,0,0.10)",width:"100%",maxWidth:560,margin:"1rem",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
          <h3 style={{margin:0,fontSize:18,fontWeight:700}}>Edit — {company.name}</h3>
          <BtnQ onClick={onClose}>✕</BtnQ>
        </div>
        <div style={{background:"#EFF6FF",border:"1px solid rgba(37,99,235,0.27)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#2563EB",marginBottom:14}}>
          ℹ️ CIN cannot be changed after verification.
        </div>
        <Input label="Registered Company Name *" value={name} onChange={setName} placeholder="Company name"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {company.cin_verified
            ? <div style={{marginBottom:14}}><label style={{fontSize:11,fontWeight:600,color:"#6B7280",marginBottom:5,display:"block",textTransform:"uppercase",letterSpacing:"0.04em"}}>CIN (Verified — Locked)</label><div style={{background:"#F0F2F5",border:"1px solid #E2E6EA",borderRadius:8,padding:"10px 14px",fontSize:14,color:"#6B7280",display:"flex",alignItems:"center",gap:8}}>🔒 {company.cin}</div></div>
            : <Input label="CIN (Editable)" value={cin} onChange={setCin} placeholder="L22210MH1995PLC084781"/>
          }
          <Input label="Date of Incorporation" value={doi} onChange={setDoi} type="date"/>
        </div>
        <Select label="Industry * (NIC)" value={industry} onChange={setIndustry}>
          <option value="">Select industry</option>
          {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
        </Select>
        <Select label="Company Stage *" value={stage} onChange={setStage}>
          <option value="">Select stage</option>
          {STAGES.map(s=><option key={s.value} value={s.value}>{s.label} — {s.desc}</option>)}
        </Select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Select label="Company Type" value={type} onChange={setType}>
            <option value="">Select type</option>
            <option>Private Limited</option>
            <option>Public Limited (NSE)</option>
            <option>Public Limited (BSE)</option>
            <option>LLP</option>
            <option>OPC</option>
          </Select>
          <Select label="State" value={state} onChange={setState}>
            <option value="">Select state</option>
            {["Maharashtra","Delhi","Karnataka","Tamil Nadu","Telangana","Gujarat","West Bengal","Rajasthan","Uttar Pradesh","Haryana","Kerala"].map(s=><option key={s}>{s}</option>)}
          </Select>
        </div>
        {err&&<div style={{color:"#DC2626",fontSize:13,background:"#FEF2F2",padding:"8px 12px",borderRadius:6,marginBottom:12}}>{err}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <BtnQ onClick={onClose}>Cancel</BtnQ>
          <Btn onClick={submit} disabled={loading}>{loading?"Saving...":"Save Changes"}</Btn>
        </div>
      </div>
    </div>
  );
};
'''

# Insert before Dashboard
marker = 'const Dashboard=({'
if marker in content:
    content = content.replace(marker, edit_modal + marker, 1)
    print('EditCompanyModal: ADDED')
else:
    print('Dashboard marker: NOT FOUND')

open('src/App.tsx', 'w', encoding='utf-8').write(content)
