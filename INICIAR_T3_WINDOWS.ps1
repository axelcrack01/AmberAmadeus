# Inicio reproducible de Amber Amadeus Cafe T3 en Windows
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File .\INICIAR_T3_WINDOWS.ps1
# Opcional: -SoloPruebas  |  -Reinstalar
param(
    [switch]$SoloPruebas,
    [switch]$Reinstalar
)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $Root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'No se encontro Node.js. Instala Node.js 24 LTS actualizado.'
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'No se encontro npm.cmd. Comprueba la instalacion de Node.js.'
}
if (-not (Test-Path -LiteralPath (Join-Path $Root 'package.json'))) {
    throw 'No se encontro package.json: ejecuta este script desde el repositorio completo.'
}

$Version = (Get-Content -LiteralPath '.\package.json' -Raw | ConvertFrom-Json).version
Write-Host "Proyecto: Amber Amadeus Cafe | version $Version" -ForegroundColor Cyan
Write-Host "Node: $(node --version) | npm: $(npm.cmd --version)"
if ($Version -ne '3.0.0-t3') {
    throw "Version inesperada: $Version. Descarga la rama main actualizada."
}

$Out = Join-Path $Root 'qa\evidencias\sesiones'
New-Item -ItemType Directory -Path $Out -Force | Out-Null
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$Log = Join-Path $Out "ejecucion-T3-$Stamp.txt"
Start-Transcript -Path $Log -Force | Out-Null
try {
    if ($Reinstalar -or -not (Test-Path -LiteralPath '.\node_modules\express\package.json')) {
        Write-Host 'Instalando dependencias con npm ci...' -ForegroundColor Cyan
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Error en npm ci.' }
    }

    Write-Host 'Ejecutando pruebas Node...' -ForegroundColor Cyan
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Las pruebas Node fallaron. No se iniciara la demo.' }

    Write-Host 'Calculando cobertura instrumental...' -ForegroundColor Cyan
    & npm.cmd run test:coverage
    if ($LASTEXITCODE -ne 0) { throw 'La cobertura no se pudo ejecutar.' }

    Write-Host "Registro local: $Log" -ForegroundColor Green
    Write-Host 'Nota: la cobertura no representa todo el sistema, solo los archivos instrumentados.'

    if ($SoloPruebas) {
        Write-Host 'Verificacion terminada. Para abrir la demo, ejecuta el script sin -SoloPruebas.' -ForegroundColor Green
    } else {
        Write-Host 'Abre http://127.0.0.1:3200 en Edge o Chrome.' -ForegroundColor Green
        Write-Host 'Mantiene esta consola abierta; Ctrl+C detiene la demo.'
        & npm.cmd run demo
        if ($LASTEXITCODE -ne 0) { throw 'Error al iniciar la demo.' }
    }
}
finally {
    Stop-Transcript | Out-Null
}
