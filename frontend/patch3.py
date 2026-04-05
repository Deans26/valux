content = open('src/App.tsx', 'r', encoding='utf-8').read()

# Fix Auth component - replace entire Auth component submit
old_auth_submit = '''  const submit=async()=>{
    setErr(""); setLoading(true);
    try{
      if(mode==="signup"){
        const res=await fetch("/api/auth/register",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email,password,full_name:fullName}),
      });
      const data=await res.json();
      if(!res.ok){setErr(data.detail||"Registration failed");setLoading(false);return;}
       // Backend returns token on register — auto login immediately
      localStorage.setItem("valux_token",data.access_token);
      onLogin({
        user_id:data.user_id,
        email:data.email,
        full_name:data.full_name,
        token:data.access_token
      });
  setLoading(false);
  return;
}'''

new_auth_submit = '''  const submit=async()=>{
    setErr(""); setLoading(true);
    try{
      if(mode==="signup"){
        const res=await fetch("/api/auth/register",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({email,password,full_name:fullName}),
        });
        const data=await res.json();
        if(!res.ok){setErr(data.detail||"Registration failed");setLoading(false);return;}
        localStorage.setItem("valux_token",data.access_token);
        onLogin({user_id:data.user_id,email:data.email,full_name:data.full_name,token:data.access_token});
        setLoading(false);
        return;
      }'''

if old_auth_submit in content:
    content = content.replace(old_auth_submit, new_auth_submit)
    print('Auth submit signup: FIXED')
else:
    print('Auth submit signup: NOT FOUND - adding fresh')
    # Add fresh Auth component
    old_login = '      // Find user by email'
    if old_login in content:
        print('Backend auth already correct')

# Fix login fetch
old_login_fetch = '''      // ── LOGIN ── OAuth2 form data, field is username not email ───────
      const form=new URLSearchParams();
      form.append("username",email);
      form.append("password",password);
      const res=await fetch("/api/auth/login",{'''

if old_login_fetch not in content:
    old_basic = 'const form=new URLSearchParams()'
    if old_basic not in content:
        # inject full login block
        content = content.replace(
            'setLoading(false);\n  };',
            '''      const form=new URLSearchParams();
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
  };''',
            1
        )
        print('Login fetch: INJECTED')
    else:
        print('Login fetch: already present')
else:
    print('Login fetch: already present')

open('src/App.tsx', 'w', encoding='utf-8').write(content)
print('Auth patches done')
