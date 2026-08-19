# Prompt for version input
$version = Read-Host "Enter the version tag (e.g., 1.0.0)"

# Check if version is empty
if ([string]::IsNullOrWhiteSpace($version)) {
    Write-Host "ERROR: No version tag provided." -ForegroundColor Red
    exit 1
}

# Detect pre-release (contains '-')
$pushLatest = $true
if ($version -match '-') {
    Write-Host "Pre-release version detected ($version). Skipping 'latest' tag." -ForegroundColor Yellow
    $pushLatest = $false
}

Write-Host "Pushing Docker image shuttle/portal:$version..." -ForegroundColor Cyan
docker push "shuttle/portal:$version"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to push Docker image shuttle/portal:$version." -ForegroundColor Red
    exit 1
}

if ($pushLatest) {
    Write-Host "Pushing Docker image shuttle/portal:latest..." -ForegroundColor Cyan
    docker tag "shuttle/portal:$version" "shuttle/portal:latest"
    docker push "shuttle/portal:latest"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to push Docker image shuttle/portal:latest." -ForegroundColor Red
        exit 1
    }
}

Write-Host "All Docker images pushed successfully!" -ForegroundColor Green
