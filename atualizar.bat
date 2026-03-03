@echo off
echo.
echo  ========================================
echo   FITMGWEAR - Atualizando repositorio...
echo  ========================================
echo.

cd /d "C:\Users\fecar\OneDrive\Area de Trabalho\Felipe\Arquivos\Projetos\fitmgwear"

echo [1/3] Adicionando TODOS os arquivos...
git add .

echo [2/3] Commitando...
set /p msg="Digite a mensagem do commit (ou Enter para mensagem padrao): "
if "%msg%"=="" set msg=feat: atualizacao do sistema

git commit -m "%msg%"

echo [3/3] Enviando para o GitHub...
git push

echo.
echo  ========================================
echo   Concluido! Repositorio atualizado.
echo  ========================================
echo.
pause
