$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$examplesDir = Join-Path $root 'examples'

$expected = @(
  @{ File = 'landing-sample.html'; Body = 'page-landing'; Sections = @('hero', 'cards', 'notice') }
  @{ File = 'about-sample.html'; Body = 'page-about'; Sections = @('hero', 'marquee-banner', 'detail-grid', 'cards', 'quote-box', 'notice') }
  @{ File = 'announcement-sample.html'; Body = 'page-announcement'; Sections = @('hero', 'marquee-banner', 'timeline-board', 'cards', 'notice') }
  @{ File = 'privacy-sample.html'; Body = 'page-privacy'; Sections = @('hero', 'marquee-banner', 'timeline-board', 'cards', 'quote-box', 'notice') }
  @{ File = 'agreement-sample.html'; Body = 'page-agreement'; Sections = @('hero', 'marquee-banner', 'detail-grid', 'cards', 'quote-box', 'notice') }
)

$missing = New-Object System.Collections.Generic.List[string]

foreach ($item in $expected) {
  $path = Join-Path $examplesDir $item.File
  if (-not (Test-Path -LiteralPath $path)) {
    $missing.Add("Missing example: $($item.File)")
    continue
  }

  $html = Get-Content -Raw -LiteralPath $path

  if ($html -notmatch ('<body class="' + [regex]::Escape($item.Body) + '"')) {
    $missing.Add("Wrong body class in $($item.File): expected $($item.Body)")
  }

  foreach ($section in $item.Sections) {
    if ($html -notmatch ('<section class="' + [regex]::Escape($section) + '"')) {
      $missing.Add("Missing section '$section' in $($item.File)")
    }
  }
}

if ($missing.Count -gt 0) {
  $missing | ForEach-Object { Write-Output $_ }
  exit 1
}

Write-Output 'FAMILY_COVERAGE_OK'
