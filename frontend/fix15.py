with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('Line 847:', repr(lines[846]))
lines[846] = '        headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("valux_token")}`},\n'

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
print('Fixed:', repr(lines2[846]))