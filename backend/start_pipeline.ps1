# start_pipeline.ps1
# Script to start the entire Crypto Genome pipeline (producers + consumer)
# Run from inside backend/ directory

Write-Host "=================================================="
Write-Host " Crypto Genome — Multi-Source Pipeline Starting..."
Write-Host "=================================================="

# Check if Kafka and Postgres are running
# Note: Assuming Docker containers are up. We just start Python scripts here.

$python = "..\venv\Scripts\python.exe"
if (-Not (Test-Path $python)) {
    Write-Host "Error: Virtual environment python not found at $python" -ForegroundColor Red
    exit 1
}

$ingestionDir = Join-Path $PSScriptRoot "Pipelining\Ingestion"

Write-Host "Starting Consumer..." -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath $python `
    -ArgumentList "Pipelining/Ingestion/kafka_consumer.py" `
    -WorkingDirectory $PSScriptRoot

Start-Sleep -Seconds 2

Write-Host "Starting Binance Producer..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath $python `
    -ArgumentList "kafka_producer_binance.py" `
    -WorkingDirectory $ingestionDir

Write-Host "Starting KuCoin Producer..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath $python `
    -ArgumentList "kafka_producer_kucoin.py" `
    -WorkingDirectory $ingestionDir

Write-Host "Starting Gate.io Producer..." -ForegroundColor Magenta
Start-Process -NoNewWindow -FilePath $python `
    -ArgumentList "kafka_producer_gate.py" `
    -WorkingDirectory $ingestionDir

Write-Host "Starting Bitfinex Producer (Fallback)..." -ForegroundColor DarkCyan
Start-Process -NoNewWindow -FilePath $python `
    -ArgumentList "kafka_producer_bitfinex.py" `
    -WorkingDirectory $ingestionDir

Write-Host "=================================================="
Write-Host " Pipeline started in background."
Write-Host " Note: If any issues, check console output."
Write-Host "=================================================="
