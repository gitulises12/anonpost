@echo off
title AnonPosts - Detener Servidor
color 0C

echo ========================================
echo    DETENIENDO SERVIDOR ANONPOSTS
echo ========================================
echo.

REM Detener todos los procesos de Node.js
taskkill /f /im node.exe >nul 2>&1

if errorlevel 1 (
    echo No hay servidores Node.js ejecutándose
) else (
    echo Servidor detenido exitosamente
)

echo.
echo ========================================
echo      PROCESO COMPLETADO
echo ========================================
echo.
pause

