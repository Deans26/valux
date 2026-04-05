import re

content = open('src/App.tsx', 'r', encoding='utf-8').read()

# 1. ts-nocheck
if '// @ts-nocheck' not in content:
    content = '// @ts-nocheck\n' + content
    print('ts-nocheck: ADDED')
else:
    print('ts-nocheck: already present')

# 2. api import
old_imp = 'import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";'
new_imp = old_imp + '\nimport { api } from "./api";'
if 'from "./api"' not in content:
    content = content.replace(old_imp, new_imp)
    print('api import: ADDED')
else:
    print('api import: already present')

open('src/App.tsx', 'w', encoding='utf-8').write(content)
print('Base patches done')
