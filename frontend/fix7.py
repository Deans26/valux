with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('Line 912:', repr(lines[911]))
lines[911] = '                  <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>\n'

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
print('Fixed:', repr(lines2[911]))