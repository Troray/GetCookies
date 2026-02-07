# Weibo Cookie Helper

一个 Chrome/Edge/Firefox 浏览器扩展，用于在微博页面一键获取Cookie。

## ✨ 功能特点

- 🍪 **一键获取** - 在任意微博页面点击悬浮按钮即可获取 Cookie
- 📋 **一键复制** - 支持复制完整的 Cookie 字符串到剪贴板
- 🎨 **美观界面** - 现代化 UI 设计，支持深色模式
- 🖱️ **可拖拽按钮** - 悬浮按钮可自由拖动到任意位置
- 🌐 **跨浏览器支持** - 同时支持 Chrome、Edge 和 Firefox
- 🔐 **登录检测** - 未登录时自动提示

## 📦 安装方法

### Chrome / Edge

1. 从`Releases`下载最新的 `chrome.zip`
2. 解压到任意文件夹
3. 打开浏览器，访问 `chrome://extensions/`（Edge 为 `edge://extensions/`）
4. 开启右上角的 **开发者模式**
5. 点击 **加载已解压的扩展程序**，选择解压后的文件夹

### Firefox

##### 方式一
1. 从`Releases`下载最新的 `firefox.zip`
2. 打开 Firefox，访问 `about:debugging#/runtime/this-firefox`
3. 点击 **临时载入附加组件**
4. 选择 zip 文件中的 `manifest.json`

##### 方式二.   直接点击 [Firefox.xpi](https://github.com/Troray/GetCookies/releases/latest/download/firefox.xpi) 进行安装

## 🚀 使用方法

### 方式一：悬浮按钮（推荐）

1. 访问任意微博页面（如 `weibo.com`、`s.weibo.com` 等）
2. 页面左上角会出现一个 🍪 悬浮按钮
3. 点击按钮，Cookie 将显示在弹出面板中
4. 点击 **复制全部** 即可复制到剪贴板

### 方式二：扩展图标

1. 点击浏览器工具栏中的扩展图标
2. 在弹出窗口中点击 **获取 Cookie**
3. 点击 **复制** 按钮

## 📝 Cookie 格式

获取的 Cookie 按以下顺序排列：

```
SCF=...; SUB=...; SUBP=...; ALF=...; SSOLoginState=...; [其他Cookie]
```

**核心 Cookie 说明：**

| Cookie | 用途 | 必需 |
|--------|------|------|
| `SCF` | 会话标识 | ✅ |
| `SUB` | 登录凭证（以 `_2A` 开头） | ✅ |
| `SUBP` | SUB 补充信息 | ✅ |
| `ALF` | 自动登录标识 | ✅ |
| `SSOLoginState` | 单点登录时间戳 | ❌ |

这是标准的 Cookie 字符串格式，可直接用于：
- 爬虫程序配置
- API 请求的 Cookie Header
- 其他需要微博登录态的工具

## 🔧 开发构建

### 环境要求

**Windows:**
- PowerShell 5.0+ 或 PowerShell Core 7.0+

**Linux/macOS:**
- Bash
- zip 命令（`sudo apt install zip`）

### 构建命令

**Windows (PowerShell):**

```powershell
# 构建所有版本（Chrome + Firefox）
.\build.ps1

# 仅构建 Chrome/Edge 版本
.\build.ps1 -Target chrome

# 仅构建 Firefox 版本
.\build.ps1 -Target firefox
```

**Linux/macOS (Bash):**

```bash
# 添加执行权限（首次）
chmod +x build.sh

# 构建所有版本
./build.sh

# 仅构建 Chrome/Edge 版本
./build.sh chrome

# 仅构建 Firefox 版本
./build.sh firefox
```

构建产物将输出到 `dist/` 目录。

## 📁 项目结构

```
weibo-cookie-helper/
├── manifest.json           # Chrome/Edge 配置 (Manifest V3)
├── manifest.firefox.json   # Firefox 配置 (Manifest V2)
├── background.js           # Service Worker / 后台脚本
├── popup.html              # 弹出窗口 HTML
├── build.ps1               # Windows 构建脚本
├── build.sh                # Linux/macOS 构建脚本
├── js/
│   ├── content.js          # 内容脚本（悬浮按钮）
│   └── popup.js            # 弹出窗口逻辑
├── css/
│   └── content.css         # 悬浮按钮样式
├── images/                 # 图标资源
│   ├── logo16.png
│   ├── logo32.png
│   ├── logo48.png
│   └── logo128.png
├── _locales/               # 多语言支持
│   ├── en/messages.json
│   └── zh_CN/messages.json
└── dist/                   # 构建输出目录
    ├── chrome/
    ├── firefox/
    └── *.zip
```

## 🔒 权限说明

| 权限 | 用途 |
|------|------|
| `cookies` | 读取 m.weibo.cn 的 Cookie |
| `clipboardWrite` | 支持一键复制功能 |
| `*://*.weibo.com/*` | 在微博页面注入悬浮按钮 |
| `*://*.weibo.cn/*` | 读取移动端微博的 Cookie |

## ❓ 常见问题

**Q: 点击悬浮按钮提示"未检测到登录状态"？**

A: 请先在浏览器中访问 [m.weibo.cn](https://m.weibo.cn/) 并登录微博账号，然后刷新页面再试。

**Q: 获取到的 Cookie 可以用多久？**

A: Cookie 有效期取决于微博服务器设置，通常为 1-30 天不等。如果发现 Cookie 失效，请重新获取。

**Q: 为什么有时候 Cookie 数量不同？**

A: 除了 5 个核心 Cookie 外，微博还会根据你的操作生成其他 Cookie（如 `WEIBOCN_FROM`、`MLOGIN` 等），这些额外 Cookie 会一并获取。

## 📄 开源协议

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！