' 연결 프로그램을 창 없이 실행
Set sh = CreateObject("WScript.Shell")
sh.Run """" & Replace(WScript.ScriptFullName, ".vbs", ".cmd") & """", 0, False
