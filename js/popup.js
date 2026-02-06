/**
 * Weibo Cookie Helper - Popup Script
 * 处理弹出窗口的交互逻辑
 */

// 兼容 Chrome 和 Firefox 的 API
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// DOM 元素
const cookieBox = document.getElementById('cookie-box');
const getBtn = document.getElementById('get-btn');
const copyBtn = document.getElementById('copy-btn');
const btnText = document.getElementById('btn-text');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const toast = document.getElementById('toast');

// 当前 Cookie 数据
let currentCookies = '';

/**
 * 获取 Cookie
 */
async function getCookies() {
    // 设置加载状态
    getBtn.disabled = true;
    btnText.innerHTML = '<span class="loading"></span>';
    statusText.textContent = '正在获取...';
    statusDot.classList.remove('active');

    try {
        const response = await browserAPI.runtime.sendMessage({ action: 'getCookies' });

        if (response.error) {
            showError('获取失败: ' + response.error);
            return;
        }

        if (response.count === 0) {
            cookieBox.textContent = '未找到 Cookie。请确保已登录 m.weibo.cn';
            cookieBox.className = 'cookie-box empty';
            statusText.textContent = '未找到 Cookie';
            copyBtn.disabled = true;
            return;
        }

        // 显示 Cookie
        currentCookies = response.cookies;
        cookieBox.textContent = response.cookies;
        cookieBox.className = 'cookie-box';

        // 更新状态
        statusDot.classList.add('active');
        statusText.textContent = `已获取 ${response.count} 个 Cookie`;
        copyBtn.disabled = false;

    } catch (error) {
        showError('通信错误: ' + error.message);
    } finally {
        getBtn.disabled = false;
        btnText.textContent = '🔍 获取 Cookie';
    }
}

/**
 * 复制到剪贴板
 */
async function copyToClipboard() {
    if (!currentCookies) {
        showToast('没有可复制的内容', 'error');
        return;
    }

    try {
        await navigator.clipboard.writeText(currentCookies);
        showToast('已复制到剪贴板！');

        // 按钮反馈
        copyBtn.textContent = '✓ 已复制';
        setTimeout(() => {
            copyBtn.textContent = '📋 复制';
        }, 2000);

    } catch (error) {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = currentCookies;
        textarea.style.cssText = 'position:fixed;left:-9999px;';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            showToast('已复制到剪贴板！');
        } catch (e) {
            showToast('复制失败，请手动选择复制', 'error');
        }

        document.body.removeChild(textarea);
    }
}

/**
 * 显示错误
 */
function showError(message) {
    cookieBox.textContent = message;
    cookieBox.className = 'cookie-box error';
    statusText.textContent = '获取失败';
    statusDot.classList.remove('active');
    copyBtn.disabled = true;
}

/**
 * 显示 Toast 提示
 */
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#e63946' : '#1a1a2e';
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// 绑定事件
getBtn.addEventListener('click', getCookies);
copyBtn.addEventListener('click', copyToClipboard);

// 悬浮按钮开关
const toggleFloatBtn = document.getElementById('toggle-float-btn');

/**
 * 加载悬浮按钮设置
 */
async function loadFloatBtnSetting() {
    try {
        const result = await browserAPI.storage.local.get('showFloatBtn');
        // 默认为 true（启用）
        const showFloatBtn = result.showFloatBtn !== false;
        toggleFloatBtn.checked = showFloatBtn;
    } catch (error) {
        console.error('加载设置失败:', error);
        toggleFloatBtn.checked = true;
    }
}

/**
 * 保存悬浮按钮设置
 */
async function saveFloatBtnSetting(enabled) {
    try {
        await browserAPI.storage.local.set({ showFloatBtn: enabled });
        // 通知所有标签页更新
        const tabs = await browserAPI.tabs.query({ url: ['*://*.weibo.com/*', '*://*.weibo.cn/*'] });
        for (const tab of tabs) {
            browserAPI.tabs.sendMessage(tab.id, {
                action: 'toggleFloatBtn',
                enabled: enabled
            }).catch(() => { }); // 忽略无法通信的标签页
        }
        showToast(enabled ? '悬浮按钮已启用' : '悬浮按钮已禁用');
    } catch (error) {
        console.error('保存设置失败:', error);
        showToast('保存设置失败', 'error');
    }
}

// 监听开关变化
toggleFloatBtn.addEventListener('change', (e) => {
    saveFloatBtnSetting(e.target.checked);
});

// 页面加载时
document.addEventListener('DOMContentLoaded', () => {
    // 加载悬浮按钮设置
    loadFloatBtnSetting();
    // 延迟一点点再获取 Cookie，让 UI 先渲染
    setTimeout(getCookies, 100);
});

