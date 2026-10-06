$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$nodeExecutable = (Get-Command node -ErrorAction Stop).Source
if (-not (Test-Path -LiteralPath '.next\BUILD_ID')) {
    & $nodeExecutable 'node_modules\next\dist\bin\next' build --webpack
    if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
}
New-Item -ItemType Directory -Path 'work' -Force | Out-Null
$server = Start-Process -FilePath $nodeExecutable -ArgumentList @('node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3000') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput 'work\server.stdout.log' -RedirectStandardError 'work\server.stderr.log' -PassThru
$server.Id | Set-Content -LiteralPath 'work\server.pid'
Write-Output 'Local server starting at http://127.0.0.1:3000. Logs and PID are in work/.'
