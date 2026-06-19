# LoBooK → Loffice Viewer 에셋 복사
$BookRoot = Split-Path $PSScriptRoot -Parent
$Dest = Join-Path $BookRoot "app\src\main\assets\viewers\hwp"

New-Item -ItemType Directory -Force -Path $Dest | Out-Null

$wasm = Join-Path $BookRoot "public\rhwp_bg.wasm"
$js = Join-Path $BookRoot "node_modules\@rhwp\core\rhwp.js"

if (Test-Path $wasm) { Copy-Item $wasm (Join-Path $Dest "rhwp_bg.wasm") -Force; Write-Host "rhwp_bg.wasm OK" }
else { Write-Warning "rhwp_bg.wasm not found — run npm install in LoBooK root" }

if (Test-Path $js) { Copy-Item $js (Join-Path $Dest "rhwp.js") -Force; Write-Host "rhwp.js OK" }
else { Write-Warning "rhwp.js not found — npm install @rhwp/core" }

Write-Host "Done."
