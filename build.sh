#!/bin/bash
# Weibo Cookie Helper 构建脚本 (Linux/macOS)
# 用于生成 Chrome/Edge 和 Firefox 两个版本的扩展包

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"

# 需要打包的文件和目录
FILES=(
    "background.js"
    "popup.html"
    "js"
    "css"
    "images"
    "_locales"
)

# 打印信息
info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 构建 Chrome/Edge 版本
build_chrome() {
    info "正在构建 Chrome/Edge 版本..."
    
    local chrome_dir="$DIST_DIR/chrome"
    
    # 清理并创建目录
    rm -rf "$chrome_dir"
    mkdir -p "$chrome_dir"
    
    # 复制 manifest.json (MV3)
    cp "$SCRIPT_DIR/manifest.json" "$chrome_dir/"
    
    # 复制其他文件
    for file in "${FILES[@]}"; do
        if [ -e "$SCRIPT_DIR/$file" ]; then
            cp -r "$SCRIPT_DIR/$file" "$chrome_dir/"
        fi
    done
    
    # 获取版本号
    local version=$(grep -o '"version": *"[^"]*"' "$SCRIPT_DIR/manifest.json" | cut -d'"' -f4)
    local zip_path="$DIST_DIR/chrome-v${version}.zip"
    
    # 删除旧的 zip 文件
    rm -f "$zip_path"
    
    # 创建 zip 包
    cd "$chrome_dir"
    zip -r "$zip_path" . -x "*.DS_Store" > /dev/null
    cd "$SCRIPT_DIR"
    
    success "Chrome/Edge 版本已构建: $zip_path"
}

# 构建 Firefox 版本
build_firefox() {
    info "正在构建 Firefox 版本..."
    
    local firefox_dir="$DIST_DIR/firefox"
    
    # 清理并创建目录
    rm -rf "$firefox_dir"
    mkdir -p "$firefox_dir"
    
    # 复制 manifest.firefox.json 为 manifest.json
    cp "$SCRIPT_DIR/manifest.firefox.json" "$firefox_dir/manifest.json"
    
    # 复制其他文件
    for file in "${FILES[@]}"; do
        if [ -e "$SCRIPT_DIR/$file" ]; then
            cp -r "$SCRIPT_DIR/$file" "$firefox_dir/"
        fi
    done
    
    # 获取版本号
    local version=$(grep -o '"version": *"[^"]*"' "$SCRIPT_DIR/manifest.firefox.json" | cut -d'"' -f4)
    local zip_path="$DIST_DIR/firefox-v${version}.zip"
    
    # 删除旧的 zip 文件
    rm -f "$zip_path"
    
    # 创建 zip 包
    cd "$firefox_dir"
    zip -r "$zip_path" . -x "*.DS_Store" > /dev/null
    cd "$SCRIPT_DIR"
    
    success "Firefox 版本已构建: $zip_path"
}

# 显示帮助
show_help() {
    echo "用法: $0 [target]"
    echo ""
    echo "目标选项:"
    echo "  all      构建所有版本 (默认)"
    echo "  chrome   仅构建 Chrome/Edge 版本"
    echo "  firefox  仅构建 Firefox 版本"
    echo "  help     显示此帮助信息"
}

# 主逻辑
main() {
    echo ""
    echo -e "${YELLOW}======================================${NC}"
    echo -e "${YELLOW}  Weibo Cookie Helper - 构建脚本${NC}"
    echo -e "${YELLOW}======================================${NC}"
    echo ""
    
    # 创建 dist 目录
    mkdir -p "$DIST_DIR"
    
    # 检查 zip 命令是否存在
    if ! command -v zip &> /dev/null; then
        error "未找到 zip 命令，请先安装: sudo apt install zip"
    fi
    
    local target="${1:-all}"
    
    case "$target" in
        chrome)
            build_chrome
            ;;
        firefox)
            build_firefox
            ;;
        all)
            build_chrome
            build_firefox
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}未知目标: $target${NC}"
            show_help
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}构建完成！${NC}"
    echo -e "输出目录: $DIST_DIR"
    echo ""
}

main "$@"
