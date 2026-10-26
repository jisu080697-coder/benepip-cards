@echo off
rem 피그마 자동 반영 연결 프로그램 (로그인 때 시작 프로그램에서 실행 · 이미 켜져 있으면 바로 끝남 · 코드가 바뀌어 끝나면 새 코드로 다시 켬 · 기록은 fixed\fig_bridge.log)
chcp 65001 >nul
cd /d "%~dp0.."
set SINCE=1792744977000
:again
"C:\Program Files\nodejs\node.exe" fixed\fig_bridge.mjs >> fixed\fig_bridge.log 2>&1
rem 다른 연결 프로그램이 이미 켜져 있어 끝난 경우(포트 사용 중)는 다시 켜지 않음
netstat -ano | findstr "127.0.0.1:8766" | findstr LISTENING >nul && goto :eof
timeout /t 5 /nobreak >nul
goto again
