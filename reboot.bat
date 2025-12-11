@echo off
echo [SYSTEM] Initiating Nuclear Restart Protocol...

echo [1/3] Killing ALL Node.exe processes (Ensure no zombies)...
taskkill /F /IM node.exe >nul 2>&1
ifPercent errorlevel% neq 0 (
    echo    - No node processes found (Clean).
) else (
    echo    - Terminated existing node processes.
)

echo [2/3] Cleaning Next.js Cache (.next)...
if exist .next (
    rmdir /s /q .next
    echo    - Cache cleared.
) else (
    echo    - No cache found.
)

echo [3/3] Starting Development Server on Port 3000...
echo    - Please wait for 'Ready' message...
npm run dev
