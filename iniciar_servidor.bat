@echo off
title AnonPosts - Servidor
color 0A

echo ========================================
echo    ANONPOSTS - SERVIDOR AUTOMATICO
echo ========================================
echo.
echo Iniciando servidor...
echo.

REM Cambiar al directorio del proyecto
cd /d "%~dp0"

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no está instalado
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si las dependencias están instaladas
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo ERROR: No se pudieron instalar las dependencias
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   SERVIDOR INICIADO EXITOSAMENTE
echo ========================================
echo.
echo URL: http://localhost:3000
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

REM Iniciar el servidor
npm start

REM Si el servidor se detiene, mostrar mensaje
echo.
echo ========================================
echo      SERVIDOR DETENIDO
echo ========================================
echo.
pause

