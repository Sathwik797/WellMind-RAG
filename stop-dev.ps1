# Stop all eRTMAC-NWIS local services (ports 5000, 8000, 8001, 5173)
$ports = @(5000, 8000, 8001, 5173)
foreach ($port in $ports) {
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($processes) {
        foreach ($pidToKill in $processes) {
            try {
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                Write-Host "Stopped process on port $port (PID: $pidToKill)" -ForegroundColor Green
            } catch {
                Write-Host "Could not stop PID $pidToKill on port $port" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "Port $port is free." -ForegroundColor Gray
    }
}
Write-Host "All eRTMAC-NWIS services stopped." -ForegroundColor Cyan
