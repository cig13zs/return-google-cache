$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path -LiteralPath $chrome)) {
    throw "Chrome was not found at $chrome"
}

function Capture-Page {
    param(
        [Parameter(Mandatory = $true)][string]$InputPath,
        [Parameter(Mandatory = $true)][string]$OutputPath
    )

    $inputAbsolute = (Resolve-Path -LiteralPath $InputPath).Path
    $outputAbsolute = [IO.Path]::GetFullPath($OutputPath)
    $uri = [Uri]::new($inputAbsolute).AbsoluteUri
    & $chrome `
        '--headless=new' `
        '--disable-gpu' `
        '--hide-scrollbars' `
        '--force-device-scale-factor=1' `
        '--window-size=1280,800' `
        "--screenshot=$outputAbsolute" `
        $uri | Out-Null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $outputAbsolute)) {
        throw "Chrome did not capture $InputPath"
    }
}

Capture-Page `
    -InputPath (Join-Path $root 'extension\popup.html') `
    -OutputPath (Join-Path $root 'store-assets\screenshot-settings-1280x800.png')
Capture-Page `
    -InputPath (Join-Path $root 'store-assets\source\results-preview.html') `
    -OutputPath (Join-Path $root 'store-assets\screenshot-results-1280x800.png')

Write-Output 'ok, 1280x800 store screenshots captured'
