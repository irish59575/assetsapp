@echo off
pm2 resurrect
timeout /t 5 /nobreak >nul
start chrome --app=http://localhost:3000
