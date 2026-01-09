@echo off
chcp 65001 > nul
echo ==========================================
echo       GitHub 项目上传助手
echo ==========================================
echo.

:: 检查 Git 是否安装
git --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Git，请先安装 Git。
    pause
    exit /b
)

:: 检查 GitHub CLI 是否安装
gh --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 GitHub CLI，请先安装 gh。
    pause
    exit /b
)

echo [1/4] 初始化/检查 Git 仓库...
if exist .git (
    echo Git 仓库已存在，跳过初始化。
) else (
    git init
    echo Git 仓库初始化完成。
)

echo.
echo [2/4] 添加文件并提交...
git add .
git commit -m "Initial commit"
:: 忽略 commit 错误（例如没有文件变动时）
if %errorlevel% neq 0 echo (如果是"nothing to commit"请忽略)

echo.
echo [3/4] 检查 GitHub 登录状态...
gh auth status > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [注意] 您尚未登录 GitHub CLI。
    echo 请在接下来的提示中选择:
    echo 1. GitHub.com
    echo 2. HTTPS
    echo 3. Yes (Y)
    echo 4. Login with a web browser
    echo.
    echo 正在启动登录流程...
    gh auth login
    if %errorlevel% neq 0 (
        echo [错误] 登录失败或取消。请重新运行脚本重试。
        pause
        exit /b
    )
) else (
    echo 已登录 GitHub。
)

echo.
echo [4/4] 创建并推送远程仓库...
:: 尝试创建仓库，如果已存在则尝试直接推送
call gh repo create test4-pitch-tool --public --source=. --remote=origin --push

if %errorlevel% neq 0 (
    echo.
    echo [提示] 自动创建/推送可能失败。
    echo 尝试手动关联远程仓库并推送...
    git remote add origin https://github.com/%USERNAME%/test4-pitch-tool.git
    git branch -M main
    git push -u origin main
) else (
    echo.
    echo [成功] 项目已成功挂载到 GitHub！
)

echo.
echo ==========================================
echo           所有操作已完成
echo ==========================================
pause

