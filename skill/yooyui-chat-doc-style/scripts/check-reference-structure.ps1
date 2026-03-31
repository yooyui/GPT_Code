$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$baseTemplate = Join-Path $root 'templates\base-doc-page.html'
$baseCss = Join-Path $root 'templates\docs-theme.base.css'

$missing = New-Object System.Collections.Generic.List[string]

if (-not (Test-Path -LiteralPath $baseTemplate)) {
  throw "Missing template: $baseTemplate"
}

if (-not (Test-Path -LiteralPath $baseCss)) {
  throw "Missing CSS: $baseCss"
}

$html = Get-Content -Raw -LiteralPath $baseTemplate
$css = Get-Content -Raw -LiteralPath $baseCss

$htmlChecks = @(
  @{ Name = 'brand anchor'; Pattern = 'class="brand"' }
  @{ Name = 'nav-link active'; Pattern = 'class="nav-link active"' }
  @{ Name = 'hero orbit spans'; Pattern = '(?s)<div[^>]*class="[^"]*\bhero-orbits\b[^"]*"[^>]*>.*?<span.*?<span.*?<span' }
  @{ Name = 'hero chips'; Pattern = 'class="hero-chip"' }
  @{ Name = 'status badge free'; Pattern = 'class="status-badge free"' }
  @{ Name = 'status badge log'; Pattern = 'class="status-badge log"' }
  @{ Name = 'status badge warn'; Pattern = 'class="status-badge warn"' }
  @{ Name = 'status badge note'; Pattern = 'class="status-badge note"' }
  @{ Name = 'summary block'; Pattern = 'class="summary"' }
  @{ Name = 'footer class'; Pattern = 'class="footer"' }
)

$cssChecks = @(
  @{ Name = 'brand selector'; Pattern = '(?m)^\.brand \{' }
  @{ Name = 'nav-link selector'; Pattern = '(?m)^\.nav-link,' }
  @{ Name = 'summary selector'; Pattern = '(?m)^\.summary \{' }
  @{ Name = 'status badge free selector'; Pattern = '\.status-badge\.free' }
  @{ Name = 'status badge log selector'; Pattern = '\.status-badge\.log' }
  @{ Name = 'status badge warn selector'; Pattern = '\.status-badge\.warn' }
  @{ Name = 'status badge note selector'; Pattern = '\.status-badge\.note' }
)

foreach ($check in $htmlChecks) {
  if ($html -notmatch $check.Pattern) {
    $missing.Add("HTML: $($check.Name)")
  }
}

foreach ($check in $cssChecks) {
  if ($css -notmatch $check.Pattern) {
    $missing.Add("CSS: $($check.Name)")
  }
}

if ($missing.Count -gt 0) {
  $missing | ForEach-Object { Write-Output $_ }
  exit 1
}

Write-Output 'REFERENCE_STRUCTURE_OK'
