import os, glob, re

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip files that don't have <style>
    if '</style>' not in content:
        return

    # Update Google Fonts link to include Inter
    content = re.sub(
        r'<link [^>]*fonts.googleapis.com/css[^>]*>',
        r'<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">',
        content
    )

    # Update root variables with vibrant HSL palette
    new_root_vars = ":root{--bg:hsl(240, 10%, 4%);--card:hsl(240, 10%, 8%);--el:hsl(240, 10%, 12%);--bd:hsl(240, 10%, 16%);--bd2:hsl(240, 10%, 25%);--tx:hsl(0, 0%, 98%);--tx2:hsl(240, 5%, 65%);--tx3:hsl(240, 5%, 45%);--ac:hsl(265, 89%, 66%);--ac2:hsl(265, 100%, 75%);--acg:hsla(265, 89%, 66%, 0.15);--gn:hsl(142, 71%, 45%);--gng:hsla(142, 71%, 45%, 0.1);--am:hsl(43, 96%, 58%);--amg:hsla(43, 96%, 58%, 0.1);--rd:hsl(0, 84%, 60%);--cy:hsl(188, 86%, 53%);--or:hsl(25, 95%, 53%)}"
    
    content = re.sub(r':root\s*\{[^\}]+\}', new_root_vars, content)

    # Inject Premium CSS Overrides
    premium_css = """
/* Premium Refactor Overrides */
body { font-family: 'Inter', sans-serif !important; background: var(--bg) !important; color: var(--tx) !important; }
.nav { background: hsla(240, 10%, 4%, 0.7) !important; backdrop-filter: blur(20px) !important; -webkit-backdrop-filter: blur(20px) !important; border-bottom: 1px solid hsla(0,0%,100%,0.05) !important; }
.mod, .today, .qstat, .feed-card, .pomo, .fin, .quote { 
    background: hsla(240, 10%, 8%, 0.6) !important; 
    backdrop-filter: blur(12px) !important; 
    -webkit-backdrop-filter: blur(12px) !important; 
    border: 1px solid hsla(0,0%,100%,0.07) !important; 
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important; 
}
.mod:hover, .feed-card:hover { 
    transform: translateY(-6px) !important; 
    border-color: var(--ac) !important; 
    box-shadow: 0 16px 40px hsla(265, 89%, 66%, 0.25), 0 0 15px hsla(265, 89%, 66%, 0.1) inset !important; 
}
.task-btn, .pomo-start, .fin-btn-i { transition: transform 0.3s ease, filter 0.3s ease !important; }
.task-btn:hover, .pomo-start:hover, .fin-btn-i:hover { transform: scale(1.04) !important; filter: brightness(1.2) !important; }
.header h1 { font-family: 'Inter', sans-serif !important; font-weight: 700 !important; letter-spacing: -1.5px !important; }
.task-check { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important; }
.task-check:hover { transform: scale(1.15) !important; box-shadow: 0 0 10px hsla(142, 71%, 45%, 0.3) !important; }
"""
    
    # Prepend the extra CSS right before </style>
    if "/* Premium Refactor Overrides */" not in content:
        content = content.replace('</style>', premium_css + '\n</style>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    for file in glob.glob('*.html'):
        update_file(file)
        print(f"Refactored {file}")
