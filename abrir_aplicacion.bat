@echo off
title AnonPosts - Abrir Aplicación
color 0B

echo ========================================
echo    ABRIENDO ANONPOSTS EN NAVEGADOR
echo ========================================
echo.

REM Verificar si el servidor está corriendo
netstat -ano | findstr :3000 >nul 2>&1

if errorlevel 1 (
    echo ADVERTENCIA: El servidor no está corriendo
    echo Por favor ejecuta primero "iniciar_servidor.bat"
    echo.
    echo ¿Quieres iniciar el servidor ahora? (S/N)
    set /p respuesta=
    if /i "%respuesta%"=="S" (
        echo Iniciando servidor...
        start "" "%~dp0iniciar_servidor.bat"
        timeout /t 5 >nul
    ) else (
        echo Saliendo...
        pause
        exit /b 1
    )
)

echo Abriendo http://localhost:3000 en el navegador...
echo.

REM Abrir en el navegador predeterminado
start "" "http://localhost:3000"

echo ========================================
echo    APLICACIÓN ABIERTA EXITOSAMENTE
echo ========================================
echo.
echo La aplicación debería abrirse en tu navegador
echo Si no se abre automáticamente, ve a: http://localhost:3000
echo.
pause

