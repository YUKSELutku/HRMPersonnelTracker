# Path: run.ps1
$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HRM Personnel Tracker - Build & Run"    -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Frontend Build ────────────────────────────────────
Write-Host "[0/4] Cache temizleniyor..."
Remove-Item -Recurse -Force MauiApp\bin, MauiApp\obj -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force next-frontend\.next, next-frontend\out -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force MauiApp\wwwroot -ErrorAction SilentlyContinue

Write-Host "[1/4] Frontend npm install..." -ForegroundColor Yellow
Push-Location "$Root\next-frontend"

if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install basarisiz!" }
} else {
    Write-Host "      node_modules mevcut, atlaniyor." -ForegroundColor Gray
}

Write-Host "[2/4] Frontend build (static export)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build basarisiz!" }

$outDir = "$Root\next-frontend\out"
if (-not (Test-Path "$outDir\index.html")) {
    Write-Host "      UYARI: out\index.html yok, out klasoru kontrol ediliyor..." -ForegroundColor Yellow
    Get-ChildItem $outDir -Recurse -Name "index.html" | Select-Object -First 5
    throw "Build basarisiz: out\index.html bulunamadi!"
}
Write-Host "      Build basarili." -ForegroundColor Green
Pop-Location

# ── 2. Copy Static Files ─────────────────────────────────
Write-Host "[3/4] Static dosyalar MAUI'ye kopyalaniyor..." -ForegroundColor Yellow
$wwwroot = "$Root\MauiApp\wwwroot"

if (Test-Path $wwwroot) {
    Remove-Item -Recurse -Force $wwwroot
}
Copy-Item -Recurse $outDir $wwwroot
Write-Host "      Kopyalandi." -ForegroundColor Green

# ── 3. Run MAUI App ──────────────────────────────────────
Write-Host "[4/4] MAUI uygulamasi baslatiliyor..." -ForegroundColor Yellow
Push-Location "$Root\MauiApp"
dotnet run -f net9.0-windows10.0.19041.0
Pop-Location