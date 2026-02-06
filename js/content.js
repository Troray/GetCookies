/**
 * Weibo Cookie Helper - Content Script
 * 在微博页面注入悬浮按钮，点击后获取并显示 m.weibo.cn 的 Cookie
 */

(function () {
    'use strict';

    // 兼容 Chrome 和 Firefox 的 API
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

    // 防止重复注入
    if (document.getElementById('weibo-cookie-btn')) {
        return;
    }

    /**
     * 创建悬浮按钮
     */
    function createFloatingButton() {
        const btn = document.createElement('div');
        btn.id = 'weibo-cookie-btn';
        btn.innerHTML = '🍪';
        btn.title = '获取微博 Cookie';
        document.body.appendChild(btn);

        btn.addEventListener('click', handleButtonClick);

        // 添加拖拽功能
        makeDraggable(btn);
    }

    /**
     * 处理按钮点击
     */
    async function handleButtonClick(e) {
        e.stopPropagation();

        const btn = document.getElementById('weibo-cookie-btn');
        btn.classList.add('loading');
        btn.innerHTML = '⏳';

        try {
            const response = await browserAPI.runtime.sendMessage({ action: 'getCookies' });

            if (response.error) {
                showNotification('获取失败: ' + response.error, 'error');
            } else if (!isLoggedIn(response)) {
                showLoginPrompt();
            } else {
                showCookiePanel(response);
            }
        } catch (error) {
            showNotification('通信错误: ' + error.message, 'error');
        } finally {
            btn.classList.remove('loading');
            btn.innerHTML = '🍪';
        }
    }

    /**
     * 检查是否已登录
     * 必须同时包含 SCF、SUB、SUBP、ALF 四个 Cookie 才视为已登录
     */
    function isLoggedIn(response) {
        if (!response.details || response.details.length === 0) {
            return false;
        }

        // 必须包含的 Cookie 列表
        const REQUIRED_COOKIES = ['SCF', 'SUB', 'SUBP', 'ALF'];

        // 检查是否包含所有必需的 Cookie
        const cookieNames = response.details.map(c => c.name);
        for (const required of REQUIRED_COOKIES) {
            if (!cookieNames.includes(required)) {
                return false;
            }
        }

        // 额外检查 SUB cookie 值是否有效
        const subCookie = response.details.find(c => c.name === 'SUB');
        if (!subCookie || !subCookie.value || !subCookie.value.startsWith('_2A')) {
            return false;
        }

        return true;
    }

    /**
     * 显示 Cookie 面板
     */
    function showCookiePanel(data) {
        // 移除已存在的面板
        const existingPanel = document.getElementById('weibo-cookie-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'weibo-cookie-panel';

        panel.innerHTML = `
      <div class="wc-panel-header">
        <span class="wc-panel-title">🍪 微博 Cookie (${data.count} 个)</span>
        <button class="wc-panel-close" id="wc-close-btn">✕</button>
      </div>
      <div class="wc-panel-body">
        <div class="wc-cookie-box" id="wc-cookie-content">${escapeHtml(data.cookies)}</div>
      </div>
      <div class="wc-panel-footer">
        <button class="wc-btn wc-btn-primary" id="wc-copy-btn">📋 复制全部</button>
        <button class="wc-btn wc-btn-secondary" id="wc-details-btn">📝 查看详情</button>
      </div>
      <div class="wc-panel-details" id="wc-details-section" style="display: none;">
        <table class="wc-table">
          <thead>
            <tr><th>名称</th><th>值</th><th>域</th></tr>
          </thead>
          <tbody>
            ${data.details.map(c => `
              <tr>
                <td class="wc-name">${escapeHtml(c.name)}</td>
                <td class="wc-value" title="${escapeHtml(c.value)}">${escapeHtml(c.value.substring(0, 30))}${c.value.length > 30 ? '...' : ''}</td>
                <td class="wc-domain">${escapeHtml(c.domain)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

        document.body.appendChild(panel);

        // 绑定事件
        document.getElementById('wc-close-btn').addEventListener('click', () => panel.remove());
        document.getElementById('wc-copy-btn').addEventListener('click', () => copyToClipboard(data.cookies));
        document.getElementById('wc-details-btn').addEventListener('click', toggleDetails);

        // 点击面板外部关闭
        setTimeout(() => {
            document.addEventListener('click', closePanelOnOutsideClick);
        }, 100);
    }

    /**
     * 显示登录提示面板
     */
    function showLoginPrompt() {
        // 移除已存在的面板
        const existingPanel = document.getElementById('weibo-cookie-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'weibo-cookie-panel';

        panel.innerHTML = `
      <div class="wc-panel-header wc-panel-header-warning">
        <span class="wc-panel-title">⚠️ 未检测到登录状态</span>
        <button class="wc-panel-close" id="wc-close-btn">✕</button>
      </div>
      <div class="wc-panel-body">
        <div class="wc-login-prompt">
          <div class="wc-login-icon">🔐</div>
          <p class="wc-login-text">请先登录微博以获取 Cookie</p>
          <p class="wc-login-hint">登录后刷新页面，再点击按钮获取</p>
        </div>
      </div>
    `;

        document.body.appendChild(panel);

        // 绑定事件
        document.getElementById('wc-close-btn').addEventListener('click', () => panel.remove());

        // 点击面板外部关闭
        setTimeout(() => {
            document.addEventListener('click', closePanelOnOutsideClick);
        }, 100);
    }

    /**
     * 切换详情显示
     */
    function toggleDetails() {
        const details = document.getElementById('wc-details-section');
        const btn = document.getElementById('wc-details-btn');
        if (details.style.display === 'none') {
            details.style.display = 'block';
            btn.textContent = '📝 隐藏详情';
        } else {
            details.style.display = 'none';
            btn.textContent = '📝 查看详情';
        }
    }

    /**
     * 复制到剪贴板
     */
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showNotification('已复制到剪贴板！', 'success');
        } catch (error) {
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.cssText = 'position:fixed;left:-9999px;';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showNotification('已复制到剪贴板！', 'success');
        }
    }

    /**
     * 显示通知
     */
    function showNotification(message, type = 'info') {
        const existing = document.getElementById('wc-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.id = 'wc-notification';
        notification.className = `wc-notification wc-notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // 动画进入
        setTimeout(() => notification.classList.add('show'), 10);

        // 自动消失
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * 点击外部关闭面板
     */
    function closePanelOnOutsideClick(e) {
        const panel = document.getElementById('weibo-cookie-panel');
        const btn = document.getElementById('weibo-cookie-btn');
        if (panel && !panel.contains(e.target) && e.target !== btn) {
            panel.remove();
            document.removeEventListener('click', closePanelOnOutsideClick);
        }
    }

    /**
     * 使元素可拖拽
     */
    function makeDraggable(element) {
        let isDragging = false;
        let startX, startY;
        let offsetX, offsetY;
        const DRAG_THRESHOLD = 5; // 移动超过5像素才算拖拽

        element.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = element.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            element.style.cursor = 'grabbing';
            element.style.transition = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const newX = e.clientX - offsetX;
            const newY = e.clientY - offsetY;

            // 限制在视口范围内
            const maxX = window.innerWidth - element.offsetWidth;
            const maxY = window.innerHeight - element.offsetHeight;

            element.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
            element.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
        });

        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                const distance = Math.sqrt(
                    Math.pow(e.clientX - startX, 2) +
                    Math.pow(e.clientY - startY, 2)
                );

                isDragging = false;
                element.style.cursor = 'pointer';
                element.style.transition = '';

                // 如果移动距离小于阈值，触发点击
                if (distance < DRAG_THRESHOLD) {
                    handleButtonClick(e);
                }
            }
        });

        // 阻止默认点击事件（改用 mouseup 处理）
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
        }, true);
    }

    /**
     * HTML 转义
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 显示悬浮按钮
     */
    function showFloatingButton() {
        let btn = document.getElementById('weibo-cookie-btn');
        if (!btn) {
            createFloatingButton();
        } else {
            btn.style.display = 'flex';
        }
    }

    /**
     * 隐藏悬浮按钮
     */
    function hideFloatingButton() {
        const btn = document.getElementById('weibo-cookie-btn');
        if (btn) {
            btn.style.display = 'none';
        }
        // 同时关闭面板
        const panel = document.getElementById('weibo-cookie-panel');
        if (panel) {
            panel.remove();
        }
    }

    /**
     * 根据设置初始化悬浮按钮
     */
    async function initFloatingButton() {
        try {
            const result = await browserAPI.storage.local.get('showFloatBtn');
            // 默认为 true（启用）
            const showFloatBtn = result.showFloatBtn !== false;
            if (showFloatBtn) {
                showFloatingButton();
            }
        } catch (error) {
            // 如果获取设置失败，默认显示按钮
            console.error('获取设置失败:', error);
            showFloatingButton();
        }
    }

    // 监听来自 popup 的消息
    browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'toggleFloatBtn') {
            if (message.enabled) {
                showFloatingButton();
            } else {
                hideFloatingButton();
            }
            sendResponse({ success: true });
        }
        return false;
    });

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFloatingButton);
    } else {
        initFloatingButton();
    }

    console.log('Weibo Cookie Helper 内容脚本已加载');
})();

