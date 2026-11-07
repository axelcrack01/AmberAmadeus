# Ejecutar desde PowerShell una vez descomprimido este paquete.
# Requiere Git y permisos de escritura en GitHub.
$ErrorActionPreference = "Stop"
$repo = "https://github.com/axelcrack01/AmberAmadeus.git"
$source = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git no está instalado. Instálalo desde https://git-scm.com/download/win"
}
$temp = Join-Path $env:TEMP ("AmberAmadeus-Publicacion-" + [guid]::NewGuid().ToString("N"))
Write-Host "Clonando repositorio..." -ForegroundColor Cyan
git clone --branch main $repo $temp
if ($LASTEXITCODE -ne 0) { throw "No se pudo clonar el repositorio." }
$files = Get-ChildItem -LiteralPath $source -Recurse -File -Force |
    Where-Object { $_.FullName -notmatch '[\\/]\.git[\\/]' }
foreach ($file in $files) {
    $relative = $file.FullName.Substring($source.Length).TrimStart('\','/')
    $target = Join-Path $temp $relative
    $dir = Split-Path -Parent $target
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Copy-Item -LiteralPath $file.FullName -Destination $target -Force
}
Write-Host "Verificando cambios..." -ForegroundColor Cyan
git -C $temp add -A
git -C $temp diff --cached --stat
git -C $temp diff --cached --quiet
if ($LASTEXITCODE -eq 0) { Write-Host "Sin cambios pendientes."; exit 0 }
git -C $temp commit -m "feat: publicar Amber Amadeus T3 completo con Inventario, Kardex y QA"
if ($LASTEXITCODE -ne 0) { throw "No se pudo crear el commit. Comprueba git config user.name/user.email." }
Write-Host "Subiendo a GitHub..." -ForegroundColor Cyan
git -C $temp push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "No se pudo subir. Comprueba la autenticación con GitHub (gh auth login o Git Credential Manager)." -ForegroundColor Yellow
    Write-Host "Copia local disponible en: $temp"
    exit 1
}
Write-Host "Publicado: https://github.com/axelcrack01/AmberAmadeus" -ForegroundColor Green
