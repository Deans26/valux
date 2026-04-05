with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Print context
for i in range(941, 963):
    print(f'{i+1}: {repr(lines[i])}')