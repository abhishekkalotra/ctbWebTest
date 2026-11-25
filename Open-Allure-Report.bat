@echo off
setlocal
pushd "%~dp0"
node --version >nul 2>&1
if errorlevel 1 (
  echo Node.js is required. Install Node.js 22.2 or newer, then try again.
  pause
  popd
  exit /b 1
)
node "%~dp0scripts\serve-report.mjs" --open
if errorlevel 1 (
  echo.
  echo The report could not be opened. See the error above.
  pause
  popd
  exit /b 1
)
popd
endlocal
