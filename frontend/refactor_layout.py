import os

filepath = r"e:\Aplicaciones\ANALISIS DE DATOS\Pagina Web\HTML\da-2026\frontend\index.html"

with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Inject CSS for .today-wrapper
css_injection = """
/* Premium Refactor Overrides */
.today-wrapper { display: grid; grid-template-columns: 1fr 280px; gap: 16px; align-items: stretch; }
@media (max-width: 900px) { .today-wrapper { grid-template-columns: 1fr; } }
"""
html = html.replace("/* Premium Refactor Overrides */", css_injection)

# 2. Extract .pomo from .sidebar and wrap .today
# Read lines
lines = html.split('\n')
today_idx = -1
sidebar_idx = -1
pomo_idx = -1

for i, line in enumerate(lines):
    if '<div class="today">' in line:
        today_idx = i
    if '<div class="sidebar">' in line:
        sidebar_idx = i
    if '<div class="pomo">' in line:
        pomo_idx = i

if today_idx != -1 and sidebar_idx != -1 and pomo_idx != -1:
    # 1. Take the pomo element HTML (which is precisely on lines[pomo_idx])
    pomo_line = lines[pomo_idx]
    
    # We want to replace `<div class="pomo">` with `<div class="pomo" style="height:100%; display:flex; flex-direction:column; justify-content:center;">`
    # this will allow the pomo element to match .today height and be vertically centered
    # Actually just add height:100% and flex.
    pomo_line = pomo_line.replace('<div class="pomo">', '<div class="pomo" style="height: 100%; display: flex; flex-direction: column; justify-content: center;">')
    
    # Remove pomo from its old place
    lines.pop(pomo_idx)
    
    # 2. Add .today-wrapper around .today and insert pomo_line right after .today
    # Since lines shifted if pomo_idx > today_idx (which it is), today_idx is still correct.
    # The .today HTML is entirely on lines[today_idx] (as inspected).
    
    # Wrap lines[today_idx] inside .today-wrapper and append pomo_line
    new_today_row = f'<div class="today-wrapper">\n{lines[today_idx]}\n{pomo_line}\n</div>'
    lines[today_idx] = new_today_row

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print("DOM Successfully Refactored!")
else:
    print("Error: Could not find structural markers.")
