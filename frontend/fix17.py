with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Write the exact line needed
new_line = '        headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("valux_token")}`},\n'
# Verify backticks are present
print('Backticks present:', new_line.count('`'))
lines[846] = new_line

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
print('Result:', repr(lines2[846]))