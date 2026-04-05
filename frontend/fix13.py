with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove lines 945-963 (indices 944-962) - misplaced login code in Chatbot
del lines[944:963]

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

# Verify
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
for i in range(941, 948):
    print(f'{i+1}: {lines2[i].rstrip()}')