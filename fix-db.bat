@echo off
cd /d "c:\Users\JaiZz\OneDrive - MIMO Tech Co.,Ltd\Desktop\Digital Twin Team1\digital-twin-team1"
echo Staging lib/db.ts...
git add lib/db.ts
git add drizzle/0000_flaky_hobgoblin.sql
git add drizzle/meta/0000_snapshot.json
echo Committing fix...
git commit -m "fix: Add attackLogs export to lib/db.ts for Vercel build"
echo Pushing to GitHub...
git push origin feat/zero-trust-security-integration
echo Done!
pause
