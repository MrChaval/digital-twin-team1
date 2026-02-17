Set-Location "c:\Users\JaiZz\OneDrive - MIMO Tech Co.,Ltd\Desktop\Digital Twin Team1\digital-twin-team1"

Write-Host "Staging database files..." -ForegroundColor Cyan
git add lib/db.ts
git add drizzle/0000_flaky_hobgoblin.sql
git add drizzle/meta/0000_snapshot.json

Write-Host "`nChecking status..." -ForegroundColor Cyan
$status = git status --short
Write-Host $status

Write-Host "`nCommitting changes..." -ForegroundColor Cyan
git commit -m "fix: Ensure attackLogs export in lib/db.ts for Vercel build"

Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
git push origin feat/zero-trust-security-integration

Write-Host "`nDone! ✓" -ForegroundColor Green
