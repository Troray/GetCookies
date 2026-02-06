/**
 * Weibo Cookie Helper - Background Service Worker
 * 获取 m.weibo.cn 的 Cookie 并返回给 content script
 */

// 兼容 Chrome 和 Firefox 的 API
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// 监听来自 content script 或 popup 的消息
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCookies') {
    getCookiesAsync()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message, cookies: '', count: 0 }));
    return true; // 表示异步响应
  }

  if (request.action === 'checkWeiboDomain') {
    // 检查当前是否在微博域名
    const isWeibo = isWeiboDomain(sender.tab?.url || '');
    sendResponse({ isWeibo });
    return false;
  }
});

/**
 * 异步获取 m.weibo.cn 的所有 Cookie
 */
async function getCookiesAsync() {
  try {
    // 核心 Cookie 优先排序（这些必须在前面）
    const PRIORITY_COOKIES = ['SCF', 'SUB', 'SUBP', 'ALF', 'SSOLoginState'];

    // 获取 .weibo.cn 域的所有 Cookie
    const cookies = await browserAPI.cookies.getAll({ domain: '.weibo.cn' });

    // 如果没有找到，尝试获取 m.weibo.cn
    let allCookies = cookies;
    if (cookies.length === 0) {
      const mCookies = await browserAPI.cookies.getAll({ url: 'https://m.weibo.cn/' });
      allCookies = mCookies;
    }

    // 构建 Cookie Map
    const cookieMap = new Map();
    allCookies.forEach(c => {
      // 优先保留 .weibo.cn 域的 cookie
      if (!cookieMap.has(c.name) || c.domain === '.weibo.cn') {
        cookieMap.set(c.name, c);
      }
    });

    // 排序：核心 Cookie 在前，其他 Cookie 在后
    const sortedCookies = [];

    // 1. 先添加核心 Cookie（按指定顺序）
    for (const name of PRIORITY_COOKIES) {
      if (cookieMap.has(name)) {
        sortedCookies.push(cookieMap.get(name));
        cookieMap.delete(name); // 从 Map 中移除，避免重复
      }
    }

    // 2. 添加剩余的所有 Cookie
    for (const cookie of cookieMap.values()) {
      sortedCookies.push(cookie);
    }

    // 格式化为标准 Cookie 字符串
    const cookieString = sortedCookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    // 返回详细信息
    return {
      cookies: cookieString,
      count: sortedCookies.length,
      details: sortedCookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        httpOnly: c.httpOnly,
        secure: c.secure
      }))
    };
  } catch (error) {
    console.error('获取 Cookie 失败:', error);
    return { error: error.message, cookies: '', count: 0 };
  }
}

/**
 * 检查是否为微博域名
 */
function isWeiboDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.endsWith('weibo.com') || hostname.endsWith('weibo.cn');
  } catch {
    return false;
  }
}

// 记录扩展加载
console.log('Weibo Cookie Helper 已加载');