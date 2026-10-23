@echo off
rem 피그마 자동 반영 연결 프로그램 (컴퓨터 켜질 때 시작 프로그램에서 자동 실행 · 기록은 fixed\fig_bridge.log)
chcp 65001 >nul
cd /d "%~dp0.."
set SINCE=1792744977000
"C:\Program Files\nodejs\node.exe" fixed\fig_bridge.mjs >> fixed\fig_bridge.log 2>&1
