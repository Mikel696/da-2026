# da-2026 — Scripts de Validación para Claude Code y Antigravity
# Ejecutar desde: E:\Aplicaciones\ANALISIS DE DATOS\Pagina Web\HTML\da-2026\

# === ALIAS RÁPIDOS DE VALIDACIÓN ===
# Puedes ejecutar este script una vez por sesión para cargar los alias:
#   . .\validate.ps1

function da-status {
    Write-Host "`n📊 DA-2026 — Estado del Repositorio" -ForegroundColor Cyan
    git -C "$PSScriptRoot" status
}

function da-diff {
    Write-Host "`n🔍 DA-2026 — Cambios detectados:" -ForegroundColor Yellow
    git -C "$PSScriptRoot" diff --stat
}

function da-save {
    param([string]$msg = "update: cambios desde Claude Code")
    Write-Host "`n💾 DA-2026 — Guardando cambios: '$msg'" -ForegroundColor Green
    git -C "$PSScriptRoot" add frontend/
    git -C "$PSScriptRoot" commit -m "$msg"
    git -C "$PSScriptRoot" push
    Write-Host "✅ Push completado. GitHub Actions desplegará en 1-2 min." -ForegroundColor Green
}

function da-validate {
    Write-Host "`n🧪 DA-2026 — Validación de Archivos Clave" -ForegroundColor Magenta
    $base = "$PSScriptRoot\frontend"
    $files = @(
        "$base\index.html",
        "$base\css\main.css",
        "$base\js\core.js",
        "$base\js\dashboard.js",
        "$base\english.html",
        "$base\pages\ingles.html"
    )
    foreach ($f in $files) {
        if (Test-Path $f) {
            $size = (Get-Item $f).Length
            Write-Host "  ✅ $(Split-Path $f -Leaf) — $([math]::Round($size/1KB, 1)) KB" -ForegroundColor Green
        } else {
            Write-Host "  ❌ FALTA: $f" -ForegroundColor Red
        }
    }
}

function da-open {
    Write-Host "`n🌐 Abriendo proyecto en navegador..." -ForegroundColor Cyan
    Start-Process "E:\Aplicaciones\ANALISIS DE DATOS\Pagina Web\HTML\da-2026\frontend\index.html"
}

function da-help {
    Write-Host @"
`n🤖 DA-2026 — Comandos Disponibles (Hybrid Workflow)
══════════════════════════════════════════════════════
  da-status    → git status del repositorio
  da-diff      → Ver cambios sin commitear
  da-save      → Add + Commit + Push (acepta mensaje: da-save "fix: descripción")  
  da-validate  → Verificar que archivos clave existen y tienen tamaño correcto
  da-open      → Abrir index.html en el navegador local

📝 Protocolo Híbrido:
  1. Antigravity (Gemini) → Browser Subagent, validación visual
  2. Claude Code → Refactorización masiva de HTML/CSS/JS
  3. SIEMPRE guardar antes de cambiar de agente (Ctrl+S)
  4. Usar da-save después de cada sesión de Claude Code
"@ -ForegroundColor White
}

Write-Host "✅ DA-2026 aliases cargados. Ejecuta 'da-help' para ver los comandos." -ForegroundColor Cyan
