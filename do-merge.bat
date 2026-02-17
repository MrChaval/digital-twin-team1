@echo off
cd /d "c:\Users\JaiZz\OneDrive - MIMO Tech Co.,Ltd\Desktop\Digital Twin Team1\digital-twin-team1"
set GIT_EDITOR=cmd.exe /c exit
git commit -m "merge: Integrate main branch (attack logs) with Zero Trust features (audit logs)"
git push origin feat/zero-trust-security-integration
pause
