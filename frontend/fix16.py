with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Build the line using chr() to avoid any shell interpolation
bt = chr(96)  # backtick
line = f'        headers:{{"Content-Type":"application/json",Authorization:{bt}Bearer ${"{localStorage.getItem("}' + '"valux_token"' + f'{")}{bt}"}},{chr(10)}'
lines[846] = line

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
print('Fixed:', repr(lines2[846]))