@echo off
setlocal
cd /d "%~dp0"
echo Preparation et lancement de la demo Spicy.
echo Ouvrez ensuite le lien ACCES DIRECT SANS MOT DE PASSE affiche dans ce terminal.
call npm.cmd run demo:ready
if errorlevel 1 (
 echo.
 echo Le lancement a echoue. Consultez le message ci-dessus.
 echo Si les dependances sont absentes, lancez npm.cmd ci dans ce dossier.
 pause
)
