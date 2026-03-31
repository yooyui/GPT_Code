$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$cssPath = Join-Path $root 'templates\docs-theme.base.css'
$htmlFiles = @(
  (Join-Path $root 'templates\base-doc-page.html')
) + (Get-ChildItem -LiteralPath (Join-Path $root 'examples') -Filter *.html | Select-Object -ExpandProperty FullName)

if (-not (Test-Path -LiteralPath $cssPath)) {
  throw "Missing CSS file: $cssPath"
}

$css = Get-Content -Raw -LiteralPath $cssPath

$cssChecks = @(
  @{ Name = 'heroEnter keyframes'; Pattern = '@keyframes heroEnter' }
  @{ Name = 'glowPulse keyframes'; Pattern = '@keyframes glowPulse' }
  @{ Name = 'spinRing keyframes'; Pattern = '@keyframes spinRing' }
  @{ Name = 'floatText keyframes'; Pattern = '@keyframes floatText' }
  @{ Name = 'panelAppear keyframes'; Pattern = '@keyframes panelAppear' }
  @{ Name = 'panelFloat keyframes'; Pattern = '@keyframes panelFloat' }
  @{ Name = 'badgeBounce keyframes'; Pattern = '@keyframes badgeBounce' }
  @{ Name = 'underlineFlow keyframes'; Pattern = '@keyframes underlineFlow' }
  @{ Name = 'iconBob keyframes'; Pattern = '@keyframes iconBob' }
  @{ Name = 'bubbleFloat keyframes'; Pattern = '@keyframes bubbleFloat' }
  @{ Name = 'hero uses heroEnter'; Pattern = '(?s)\.hero\s*\{.*?animation\s*:\s*heroEnter' }
  @{ Name = 'hero glow pulses'; Pattern = '(?s)\.hero-glow\s*\{.*?animation\s*:\s*glowPulse' }
  @{ Name = 'hero orbits spin'; Pattern = '(?s)\.hero-orbits\s+span\s*\{.*?animation\s*:\s*spinRing' }
  @{ Name = 'lead reveals'; Pattern = '(?s)\.hero-copy \.lead\s*\{.*?animation\s*:\s*revealUp' }
  @{ Name = 'hero title reveals'; Pattern = '(?s)\.hero-copy h1\s*\{.*?animation\s*:\s*revealUp' }
  @{ Name = 'hero paragraph floats'; Pattern = '(?s)\.hero-copy p\s*\{.*?floatText' }
  @{ Name = 'hero meta reveals'; Pattern = '(?s)\.hero-meta\s*\{.*?animation\s*:\s*revealUp' }
  @{ Name = 'hero panel floats'; Pattern = '(?s)\.hero-panel\s*\{.*?panelFloat' }
  @{ Name = 'status items reveal'; Pattern = '(?s)\.status-item\s*\{.*?animation\s*:\s*revealSoft' }
  @{ Name = 'status badges bounce'; Pattern = '(?s)\.status-badge\s*\{.*?animation\s*:\s*badgeBounce' }
  @{ Name = 'section heading underline flows'; Pattern = '(?s)\.section-head h2::after\s*\{.*?animation\s*:\s*underlineFlow' }
  @{ Name = 'icons bob'; Pattern = '(?s)\.icon\s*\{.*?animation\s*:\s*iconBob' }
  @{ Name = 'notice reveals'; Pattern = '(?s)\.notice\s*\{.*?animation\s*:\s*revealUp' }
  @{ Name = 'bubbles float'; Pattern = '(?s)\.bg-bubbles span\s*\{.*?animation\s*:\s*bubbleFloat' }
)

$missing = New-Object System.Collections.Generic.List[string]

foreach ($check in $cssChecks) {
  if ($css -notmatch $check.Pattern) {
    $missing.Add("CSS: $($check.Name)")
  }
}

foreach ($file in $htmlFiles) {
  if (-not (Test-Path -LiteralPath $file)) {
    $missing.Add("HTML missing: $file")
    continue
  }
  $html = Get-Content -Raw -LiteralPath $file
  if ($html -notmatch '(?s)<div[^>]*class="[^"]*\bbg-bubbles\b[^"]*"[^>]*>.*?<span') {
    $missing.Add("HTML: missing bubble span markup in $file")
  }
  if ($html -notmatch '(?s)<div[^>]*class="[^"]*\bhero-orbits\b[^"]*"[^>]*>.*?<span.*?<span.*?<span') {
    $missing.Add("HTML: missing hero orbit spans in $file")
  }
}

if ($missing.Count -gt 0) {
  $missing | ForEach-Object { Write-Output $_ }
  exit 1
}

Write-Output 'MOTION_CHECK_OK'
