# Weibo Cookie Helper 构建脚本
# 用于生成 Chrome/Edge 和 Firefox 两个版本的扩展包

param(
    [string]$Target = "all"  # all, chrome, firefox
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DistDir = Join-Path $RootDir "dist"

# 需要打包的文件
$Files = @(
    "background.js",
    "popup.html",
    "js",
    "css",
    "images",
    "_locales"
)

function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Build-Chrome {
    Write-Info "正在构建 Chrome/Edge 版本..."
    
    $chromeDir = Join-Path $DistDir "chrome"
    
    # 清理并创建目录
    if (Test-Path $chromeDir) {
        Remove-Item $chromeDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $chromeDir -Force | Out-Null
    
    # 复制 manifest.json (MV3)
    Copy-Item (Join-Path $RootDir "manifest.json") $chromeDir
    
    # 复制其他文件
    foreach ($file in $Files) {
        $source = Join-Path $RootDir $file
        $dest = Join-Path $chromeDir $file
        if (Test-Path $source) {
            if ((Get-Item $source).PSIsContainer) {
                Copy-Item $source $dest -Recurse
            } else {
                Copy-Item $source $dest
            }
        }
    }
    
    # 创建 zip 包
    $version = (Get-Content (Join-Path $RootDir "manifest.json") | ConvertFrom-Json).version
    $zipPath = Join-Path $DistDir "chrome-v$version.zip"
    
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
    
    Compress-Archive -Path "$chromeDir\*" -DestinationPath $zipPath -Force
    
    Write-Success "Chrome/Edge 版本已构建: $zipPath"
}

function Build-Firefox {
    Write-Info "正在构建 Firefox 版本..."
    
    $firefoxDir = Join-Path $DistDir "firefox"
    
    # 清理并创建目录
    if (Test-Path $firefoxDir) {
        Remove-Item $firefoxDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $firefoxDir -Force | Out-Null
    
    # 复制 manifest.firefox.json 为 manifest.json
    Copy-Item (Join-Path $RootDir "manifest.firefox.json") (Join-Path $firefoxDir "manifest.json")
    
    # 复制其他文件
    foreach ($file in $Files) {
        $source = Join-Path $RootDir $file
        $dest = Join-Path $firefoxDir $file
        if (Test-Path $source) {
            if ((Get-Item $source).PSIsContainer) {
                Copy-Item $source $dest -Recurse
            } else {
                Copy-Item $source $dest
            }
        }
    }
    
    # 创建 zip 包 (Firefox 使用 .xpi 格式，但 .zip 也可以)
    $version = (Get-Content (Join-Path $RootDir "manifest.firefox.json") | ConvertFrom-Json).version
    $zipPath = Join-Path $DistDir "firefox-v$version.zip"
    
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
    
    Compress-Archive -Path "$firefoxDir\*" -DestinationPath $zipPath -Force
    
    Write-Success "Firefox 版本已构建: $zipPath"
}

# 主逻辑
Write-Host ""
Write-Host "======================================" -ForegroundColor Yellow
Write-Host "  Weibo Cookie Helper - 构建脚本" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow
Write-Host ""

# 创建 dist 目录
if (-not (Test-Path $DistDir)) {
    New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
}

switch ($Target.ToLower()) {
    "chrome" {
        Build-Chrome
    }
    "firefox" {
        Build-Firefox
    }
    "all" {
        Build-Chrome
        Build-Firefox
    }
    default {
        Write-Host "未知目标: $Target" -ForegroundColor Red
        Write-Host "可用选项: all, chrome, firefox"
        exit 1
    }
}

Write-Host ""
Write-Host "构建完成！" -ForegroundColor Green
Write-Host "输出目录: $DistDir" -ForegroundColor Gray
Write-Host ""
