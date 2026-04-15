@echo off
chcp 65001 >nul
echo.
echo  ========================================
echo   JUSSARA COOKIES - Atualizando...
echo  ========================================
echo.

set "PASTA=C:\Users\fecar\OneDrive"
set "HOOK=https://api.vercel.com/v1/integrations/deploy/prj_nLqgEwgMvPlXhzlQfnIYX7bRb5J1/q34QX3UvD9"

REM ── Copia App.jsx da Area de Trabalho para src\ ──
if exist "%PASTA%\Área de Trabalho\App.jsx" (
  echo Copiando App.jsx para src\...
  copy /Y "%PASTA%\Área de Trabalho\App.jsx" "%PASTA%\Área de Trabalho\Felipe\Arquivos\Projetos\jussara-cookies\src\App.jsx"
  echo App.jsx copiado!
  echo.
)

cd /d "%PASTA%\Área de Trabalho\Felipe\Arquivos\Projetos\jussara-cookies"

echo Corrigindo repositorio remoto...
git remote set-url origin https://github.com/Fecarmonho/jussara_laureano_app.git

echo Garantindo branch main...
git checkout -B main

echo [1/3] Adicionando TODOS os arquivos...
git add .

echo [2/3] Commitando...
set /p msg="Digite a mensagem do commit (ou Enter para mensagem padrao): "
if "%msg%"=="" set msg=feat: atualizacao do sistema

git commit -m "%msg%"

echo [3/3] Enviando para o GitHub...
git push origin main --force

echo Disparando deploy na Vercel...
curl -s -X POST "%HOOK%" >nul
echo Deploy disparado!

echo.
echo  ========================================
echo   Concluido! Vercel atualiza em 1 minuto.
echo   https://jussara-laureano-app.vercel.app
echo  ========================================
echo.
pause
