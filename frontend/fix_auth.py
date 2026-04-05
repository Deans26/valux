with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and replace the old submit function (lines 713-716, indices 712-715)
# Old: const submit=()=>{ ... onLogin({name:name||email...}); };
# Replace with full async version

old_submit = '  const submit=()=>{\n    if(!email.trim()||!password.trim()){setErr("Email and password are required.");return;}\n    if(mode==="signup"&&!name.trim()){setErr("Full name is required.");return;}\n    onLogin({name:name||email.split("@")[0],email});\n  };\n'

new_submit = '''  const [loading,setLoading]=useState(false);
  const [fullName,setFullName]=useState("");
  const submit=async()=>{
    setErr(""); setLoading(true);
    try{
      if(mode==="signup"){
        const res=await fetch("/api/auth/register",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({email,password,full_name:name||fullName}),
        });
        const data=await res.json();
        if(!res.ok){setErr(data.detail||"Registration failed");setLoading(false);return;}
        localStorage.setItem("valux_token",data.access_token);
        onLogin({user_id:data.user_id,email:data.email,full_name:data.full_name,token:data.access_token});
        setLoading(false);
        return;
      }
      const form=new URLSearchParams();
      form.append("username",email);
      form.append("password",password);
      const res=await fetch("/api/auth/login",{
        method:"POST",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:form,
      });
      const data=await res.json();
      if(!res.ok){setErr(data.detail||"Login failed");setLoading(false);return;}
      localStorage.setItem("valux_token",data.access_token);
      const meRes=await fetch("/api/auth/me",{headers:{Authorization:"Bearer "+data.access_token}});
      const me=await meRes.json();
      onLogin({...me,token:data.access_token});
    }catch(e){
      setErr("Network error — is the backend running?");
    }
    setLoading(false);
  };
'''

content = ''.join(lines)
if old_submit in content:
    content = content.replace(old_submit, new_submit)
    print('Auth submit: FIXED')
else:
    print('Auth submit: NOT FOUND')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)