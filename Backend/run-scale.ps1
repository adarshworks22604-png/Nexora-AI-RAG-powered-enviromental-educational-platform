param(
    [Parameter(Mandatory = $true)][string]$AdminPassword,
    [string]$AdminEmail = "admin@nexora.com",
    [int[]]$Scales = @(1, 2, 4, 8, 16),
    [int]$PauseSeconds = 20
)

# Run from the backend folder (next to full-test.js) with the server already running.
$rows = @()

foreach ($s in $Scales) {
    $users = (12 * $s) + (4 * $s) + 1
    $json = "result-x$s.json"
    $txt = "load-x$s.txt"
    if (Test-Path $json) { Remove-Item $json }

    Write-Host ""
    Write-Host "=== SCALE $s  ($users users) ===" -ForegroundColor Cyan

    k6 run -e MODE=load -e CHAT_VUS=0 -e SCALE=$s `
        -e ADMIN_EMAIL=$AdminEmail -e ADMIN_PASSWORD=$AdminPassword `
        --summary-export=$json full-test.js *> $txt

    if (Test-Path $json) {
        $m = (Get-Content $json -Raw | ConvertFrom-Json).metrics
        $failed = [double]$m.http_req_failed.value
        $p95 = [math]::Round($m.'http_req_duration{flow:api}'.'p(95)', 1)
        $avg = [math]::Round($m.'http_req_duration{flow:api}'.avg, 1)
        $stable = ($failed -lt 0.01) -and ($p95 -lt 1000)

        $rows += [pscustomobject]@{
            Users      = $users
            Requests   = $m.http_reqs.count
            ReqPerSec  = [math]::Round($m.http_reqs.rate, 1)
            FailedPct  = [math]::Round($failed * 100, 2)
            ApiAvgMs   = $avg
            ApiP95Ms   = $p95
            ChecksFail = $m.checks.fails
            Stable     = $(if ($stable) { "YES" } else { "NO" })
        }
    }
    else {
        Write-Host "No result file for scale $s - see $txt" -ForegroundColor Red
        $rows += [pscustomobject]@{
            Users = $users; Requests = "-"; ReqPerSec = "-"; FailedPct = "-"
            ApiAvgMs = "-"; ApiP95Ms = "-"; ChecksFail = "-"; Stable = "RUN FAILED"
        }
    }

    if ($s -ne $Scales[-1]) {
        Write-Host "Cooling down for $PauseSeconds s..."
        Start-Sleep -Seconds $PauseSeconds
    }
}

Write-Host ""
Write-Host "=== RESULTS ===" -ForegroundColor Green
$rows | Format-Table -AutoSize
$rows | Export-Csv -Path "scale-results.csv" -NoTypeInformation
Write-Host "Saved to scale-results.csv"
Write-Host "Stable = failed requests < 1% and API p95 < 1000 ms"