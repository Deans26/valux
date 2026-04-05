with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Insert missing closing lines for send function after line 944 (index 943)
lines.insert(944, '    setLoading(false);\n')
lines.insert(945, '  };\n')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
for i in range(940, 950):
    print(f'{i+1}: {lines2[i].rstrip()}')