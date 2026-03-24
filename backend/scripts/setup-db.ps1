param(
  [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$backendDir = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $backendDir
$dbHostPort = 5433

Write-Host "==> Démarrage PostgreSQL via docker compose..."
$previousNativePref = $null
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
  $previousNativePref = $PSNativeCommandUseErrorActionPreference
  $PSNativeCommandUseErrorActionPreference = $false
}
$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$composeOutput = & docker compose -f "$repoRoot\docker-compose.yml" up -d postgres 2>&1
$composeExitCode = $LASTEXITCODE
$composeText = ($composeOutput | Out-String)
$ErrorActionPreference = $previousErrorActionPreference
if ($null -ne $previousNativePref) {
  $PSNativeCommandUseErrorActionPreference = $previousNativePref
}
if ($composeOutput) {
  $composeOutput | Out-Host
}
$composeTextNormalized = ($composeText -replace "\s+", " ").ToLowerInvariant()
$isPortAllocated = $composeTextNormalized -match "port .* already .* allocated"
if ($composeExitCode -ne 0 -and -not $isPortAllocated) {
  throw "Impossible de démarrer postgres via docker compose.`n$composeText"
}
if ($composeExitCode -ne 0 -and $isPortAllocated) {
  Write-Host "⚠️ Port $dbHostPort déjà occupé. Utilisation de la base PostgreSQL déjà active."
}

Write-Host "==> Attente de PostgreSQL..."
$isReady = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.Connect("localhost", $dbHostPort)
    if ($client.Connected) {
      $client.Close()
      $isReady = $true
      break
    }
    $client.Close()
  } catch {}
  Start-Sleep -Seconds 2
}

if (-not $isReady) {
  throw "PostgreSQL n'est pas prêt sur localhost:$dbHostPort. Vérifie Docker Desktop et tes containers."
}

if (-not $env:DATABASE_URL) {
  $env:DATABASE_URL = "postgresql://cuisine:cuisine@localhost:$dbHostPort/cuisine_du_monde"
  Write-Host "==> DATABASE_URL non défini: valeur locale par défaut appliquée."
} else {
  Write-Host "==> DATABASE_URL déjà défini: conservation de la valeur existante."
}

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)][string]$Title,
    [Parameter(Mandatory = $true)][string]$Command
  )

  Write-Host "==> $Title"
  Invoke-Expression $Command | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Étape échouée: $Title (exit code $LASTEXITCODE)"
  }
}

Write-Host "==> Génération Prisma Client..."
Push-Location $backendDir
try {
  Invoke-Step -Title "Génération Prisma Client" -Command "npx prisma generate"
  Invoke-Step -Title "Application des migrations Prisma" -Command "npx prisma migrate deploy"

  if (-not $SkipSeed) {
    Invoke-Step -Title "Seed initial" -Command "npx prisma db seed"
  } else {
    Write-Host "==> Seed ignoré (--SkipSeed)."
  }
} finally {
  Pop-Location
}

Write-Host "✅ Base de données prête."
