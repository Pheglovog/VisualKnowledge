@echo off
chcp 65001 >nul 2>&1
echo.
echo ================================
echo   Claude Chat - Interactive
echo   VisualKnowledge
echo ================================
echo.

REM === 请填入你自己的 API 密钥 ===
REM 支持以下环境变量（按优先级）：
REM   ANTHROPIC_AUTH_TOKEN - Claude Code 兼容的认证令牌
REM   ANTHROPIC_API_KEY    - 标准 Anthropic API Key
REM
REM 示例（智谱 AI）:
set ANTHROPIC_AUTH_TOKEN=your_api_key_here
set ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic
set ANTHROPIC_MODEL=GLM-5V-Turbo

REM 示例（官方 Anthropic）:
REM set ANTHROPIC_API_KEY=sk-ant-xxxxx
REM set ANTHROPIC_BASE_URL=https://api.anthropic.com
REM set ANTHROPIC_MODEL=claude-sonnet-4-6

echo   API: %ANTHROPIC_BASE_URL%
echo   Model: %ANTHROPIC_MODEL%
echo   URL: http://localhost:5000
echo.
echo   Press Ctrl+C to stop
echo ================================
echo.

cd /d "%~dp0"
python server.py
pause
