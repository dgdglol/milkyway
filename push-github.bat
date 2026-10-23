@echo off
title Day du an len GitHub (dgdglol/milkyway)
echo ========================================================
echo     DANG DAY DU AN LEN GITHUB (dgdglol/milkyway)
echo ========================================================
echo.
echo Dang thuc hien lenh: git push -u origin main
echo Neu trinh duyet bat len hop thoai dang nhap GitHub, vui long chon Authorize/Dang nhap de hoan tat nhe.
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   [THANH CONG] Da day toan bo du an len GitHub!
    echo   Xem tai: https://github.com/dgdglol/milkyway
    echo ========================================================
) else (
    echo ========================================================
    echo   [CHU Y] Push chua hoan tat. Neu chua co quyen hoac token,
    echo   hay dang nhap tai khoan GitHub dgdglol roi thu lai nhe!
    echo ========================================================
)
echo.
pause
