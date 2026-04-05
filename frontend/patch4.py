content = open('src/App.tsx', 'r', encoding='utf-8').read()

# Fix handleLogout
old_logout = 'const handleLogout=()=>{setUser(null);setScreen("landing");setSelCompany(null);setModelData(null);};'
new_logout = '''const handleLogout=()=>{
  localStorage.removeItem("valux_token");
  setUser(null);
  setScreen("landing");
  setSelCompany(null);
  setModelData(null);
};'''
if old_logout in content:
    content = content.replace(old_logout, new_logout)
    print('handleLogout: FIXED')
else:
    print('handleLogout: NOT FOUND')

# Fix handleLogin
old_login = 'const handleLogin=(u)=>{setUser(u);setScreen("dashboard");};'
new_login = '''const handleLogin=async(u)=>{
  setUser({...u, name: u.full_name || u.name || u.email});
  try{
    const data=await api.get("/companies");
    setCompanies(data.map(c=>({
      ...c,
      type:c.company_type,
      files:[],
      connectedERPs:{},
      modelGenerated:false,
    })));
  }catch(e){
    console.error("Failed to load companies:",e);
  }
  setScreen("dashboard");
};'''
if old_login in content:
    content = content.replace(old_login, new_login)
    print('handleLogin: FIXED')
else:
    print('handleLogin: NOT FOUND')

# Fix handleModel
old_model = 'const handleModel=(co,fins,data)=>{\n    const updated={...co,modelGenerated:true};\n    setCompanies(p=>p.map(x=>x.id===co.id?updated:x));\n    setSelCompany(updated);setModelFins(fins);setModelData(data);setScreen("model");\n  };'
new_model = '''const handleModel=(co,fins,data)=>{
    const updated={...co,modelGenerated:true};
    setCompanies(p=>p.map(x=>x.id===co.id?updated:x));
    setSelCompany(updated);
    setModelFins(fins);
    setModelData(data);
    setScreen("model");
  };'''
if old_model in content:
    content = content.replace(old_model, new_model)
    print('handleModel: FIXED')
else:
    print('handleModel: NOT FOUND - will fix separately')

open('src/App.tsx', 'w', encoding='utf-8').write(content)
print('Core patches done')
