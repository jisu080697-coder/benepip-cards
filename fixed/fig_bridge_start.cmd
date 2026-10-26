@echo off
rem 피그마 자동 반영 연결 프로그램 (작업 스케줄러가 로그인 때·15분마다 실행 · 이미 켜져 있으면 바로 끝남 · 기록은 fixed\fig_bridge.log)
chcp 65001 >nul
cd /d "%~dp0.."
set SINCE=1792744977000
"C:\Program Files\nodejs\node.exe" fixed\fig_bridge.mjs >> fixed\fig_bridge.log 2>&1
