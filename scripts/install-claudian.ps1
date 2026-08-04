# Install the Claudian Obsidian plugin (YishenTu/claudian) into a vault.
#
# Usage:
#   .\scripts\install-claudian.ps1 -Vault "C:\path\to\your\vault"
#
# Optional:
#   -Repo           git URL (default: https://github.com/YishenTu/claudian.git)
#   -Ref            git ref to check out (default: main)
#   -FromRelease    download main.js/manifest.json/styles.css from latest
#                   release instead of building from source

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Vault,

    [string]$Repo = "https://github.com/YishenTu/claudian.git",
    [string]$Ref  = "main",
    [switch]$FromRelease
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $Vault -PathType Container)) {
    throw "Vault path does not exist: $Vault"
}

$obsidianDir = Join-Path $Vault ".obsidian"
if (-not (Test-Path -LiteralPath $obsidianDir -PathType Container)) {
    Write-Warning "'$obsidianDir' not found - is this a real Obsidian vault?"
    $ans = Read-Host "Create .obsidian\plugins anyway? [y/N]"
    if ($ans -notmatch '^[yY]$') { throw "Aborted." }
}

$pluginsDir = Join-Path $obsidianDir "plugins"
$target     = Join-Path $pluginsDir "claudian"

New-Item -ItemType Directory -Force -Path $pluginsDir | Out-Null

if (Test-Path -LiteralPath $target) {
    Write-Host "Existing Claudian install found at: $target"
    $ans = Read-Host "Remove and reinstall? [y/N]"
    if ($ans -notmatch '^[yY]$') { throw "Aborted." }
    Remove-Item -LiteralPath $target -Recurse -Force
}

function Check-Cli($name) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($cmd) { Write-Host ("  [ok] {0}  -> {1}" -f $name, $cmd.Source) }
    else      { Write-Host ("  [!!] {0}  -> not found on PATH" -f $name) }
}

Write-Host "Checking prerequisites..."
Check-Cli "claude"
Check-Cli "codex"
Check-Cli "node"
Check-Cli "npm"
Check-Cli "git"
Write-Host ""

if (-not $FromRelease) {
    Write-Host "Cloning $Repo ($Ref) into $target..."
    git clone --depth 1 --branch $Ref $Repo $target
    Push-Location $target
    try {
        Write-Host "Installing npm dependencies..."
        npm install
        Write-Host "Building plugin..."
        npm run build
    } finally {
        Pop-Location
    }
} else {
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    $api = "https://api.github.com/repos/YishenTu/claudian/releases/latest"
    Write-Host "Fetching latest release metadata..."
    $release = Invoke-RestMethod -Uri $api -Headers @{ "User-Agent" = "install-claudian.ps1" }
    foreach ($name in @("main.js", "manifest.json", "styles.css")) {
        $asset = $release.assets | Where-Object { $_.name -eq $name } | Select-Object -First 1
        if (-not $asset) { throw "Could not find $name in latest release" }
        Write-Host "  -> $name"
        Invoke-WebRequest -Uri $asset.browser_download_url -OutFile (Join-Path $target $name) -UseBasicParsing
    }
}

Write-Host ""
Write-Host "Claudian installed at: $target"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Open the vault in Obsidian: $Vault"
Write-Host "  2. Settings -> Community plugins -> enable 'Claudian'"
Write-Host "  3. In Claudian settings, confirm the Claude CLI path"
$claudePath = (Get-Command claude -ErrorAction SilentlyContinue).Source
if ($claudePath) { Write-Host "       Windows: $claudePath" }
else             { Write-Host "       Windows: run 'where.exe claude' to find it" }
Write-Host "  4. Trust the vault when Obsidian prompts you"
