@echo off
setlocal

set "BASE_URL=http://localhost:3000/api/v1"

echo ==========================================
echo TEST MESSAGE API
echo Base URL: %BASE_URL%
echo Yeu cau: server dang chay va MongoDB dang bat
echo ==========================================
echo.

echo [0] Neu chua co du lieu test, tao role USER truoc bang Postman:
echo POST %BASE_URL%/roles
echo Body:
echo {
echo   "name": "USER",
echo   "description": "Default user"
echo }
echo.
echo Sau do tao 2 user bang Postman:
echo POST %BASE_URL%/users
echo.
echo User 1:
echo {
echo   "username": "usera",
echo   "password": "Abc@1234",
echo   "email": "usera@gmail.com",
echo   "role": "ROLE_ID"
echo }
echo.
echo User 2:
echo {
echo   "username": "userb",
echo   "password": "Abc@1234",
echo   "email": "userb@gmail.com",
echo   "role": "ROLE_ID"
echo }
echo.
echo Bam phim bat ky sau khi ban da tao xong du lieu test.
pause >nul

set /p username=Nhap username de login: 
set /p password=Nhap password de login: 

echo.
echo [1/5] LOGIN LAY TOKEN
curl -X POST "%BASE_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"%username%\",\"password\":\"%password%\"}"
echo.
echo.
echo Copy token tu ket qua tren, roi bam phim bat ky de tiep tuc.
pause >nul

set /p token=Nhap token da copy: 
set /p receiverId=Nhap user ID nguoi nhan: 
set /p messageText=Nhap noi dung tin nhan text: 

echo.
echo [2/5] GUI TIN NHAN TEXT
curl -X POST "%BASE_URL%/messages" ^
  -H "Authorization: Bearer %token%" ^
  -H "Content-Type: application/json" ^
  -d "{\"to\":\"%receiverId%\",\"type\":\"text\",\"text\":\"%messageText%\"}"
echo.
echo.
echo Xem ket qua gui text xong roi bam phim bat ky de tiep tuc.
pause >nul

set /p filePath=Nhap duong dan file hoac path da upload (vi du uploads/test.png): 

echo.
echo [3/5] GUI TIN NHAN FILE
curl -X POST "%BASE_URL%/messages" ^
  -H "Authorization: Bearer %token%" ^
  -H "Content-Type: application/json" ^
  -d "{\"to\":\"%receiverId%\",\"type\":\"file\",\"text\":\"%filePath%\"}"
echo.
echo.
echo Xem ket qua gui file xong roi bam phim bat ky de tiep tuc.
pause >nul

echo.
echo [4/5] LAY TOAN BO HOI THOAI VOI 1 USER
curl -X GET "%BASE_URL%/messages/%receiverId%" ^
  -H "Authorization: Bearer %token%"
echo.
echo.
echo Xem ket qua hoi thoai xong roi bam phim bat ky de tiep tuc.
pause >nul

echo.
echo [5/5] LAY MESSAGE CUOI CUNG CUA MOI CUOC TRO CHUYEN
curl -X GET "%BASE_URL%/messages" ^
  -H "Authorization: Bearer %token%"
echo.
echo.
echo Da test xong. Bam phim bat ky de thoat.
pause >nul

endlocal
