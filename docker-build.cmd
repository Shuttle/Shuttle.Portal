@echo off
setlocal

:: Prompt for version input
set /p version="Enter the version tag (e.g., 1.0.0): "

:: Check if version is empty
if "%version%"=="" (
    echo ERROR: No version tag provided.
    exit /b 1
)

docker build -t shuttle/portal:latest -t shuttle/portal:%version% .
