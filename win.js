// 配置参数：定义要替换的字符和目标
const REPLACE_CONFIG = {
    targetString: '%26',      // 需要替换的原始字符串（已编码形式）
    replaceTo: 'and',         // 替换后的字符串
    attribute: 'id',          // 需要监控的属性
    hashUpdate: true          // 是否自动修正URL哈希
  };
  
  (function() {
    // 1. 定义ID替换函数
    const replaceEncodedIds = (element) => {
      const oldId = element.getAttribute(REPLACE_CONFIG.attribute);
      if (!oldId || !oldId.includes(REPLACE_CONFIG.targetString)) return;
  
      const newId = oldId.replaceAll(REPLACE_CONFIG.targetString, REPLACE_CONFIG.replaceTo);
      
      // 冲突检测
      if (!document.getElementById(newId)) {
        element.setAttribute(REPLACE_CONFIG.attribute, newId);
        console.log(`ID更新: ${oldId} → ${newId}`);
        
        // 如果当前元素的ID是URL哈希目标，触发滚动修正
        if (REPLACE_CONFIG.hashUpdate && `#${newId}` === window.location.hash) {
          requestAnimationFrame(() => element.scrollIntoView());
        }
      }
    };
  
    // 2. 创建MutationObserver监听DOM变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        // 处理新增节点
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // 仅处理元素节点
            if (node.hasAttribute(REPLACE_CONFIG.attribute)) {
              replaceEncodedIds(node);
            }
            // 检查子元素
            node.querySelectorAll(`[${REPLACE_CONFIG.attribute}*="${REPLACE_CONFIG.targetString}"]`).forEach(replaceEncodedIds);
          }
        });
  
        // 处理属性变更
        if (mutation.type === 'attributes' && mutation.attributeName === REPLACE_CONFIG.attribute) {
          replaceEncodedIds(mutation.target);
        }
      });
    });
  
    // 3. 启动全局监听
    observer.observe(document.documentElement, {
      subtree: true,                   // 监控整个DOM树
      childList: true,                  // 监控子元素变化
      attributeFilter: [REPLACE_CONFIG.attribute] // 仅监听指定属性
    });
  
    // 4. 立即扫描现有内容
    document.querySelectorAll(`[${REPLACE_CONFIG.attribute}*="${REPLACE_CONFIG.targetString}"]`).forEach(replaceEncodedIds);
  
    // 5. 路由变化监听（支持SPA）
    let lastURL = location.href;
    setInterval(() => {
      if (lastURL !== location.href) {
        lastURL = location.href;
        // 重新扫描所有元素
        document.querySelectorAll(`[${REPLACE_CONFIG.attribute}*="${REPLACE_CONFIG.targetString}"]`).forEach(replaceEncodedIds);
        // 强制哈希修正
        handleHashUpdate();
      }
    }, 200);
  
    // 6. 哈希修正逻辑
    const handleHashUpdate = () => {
      const rawHash = window.location.hash;
      if (!rawHash) return;
  
      const decodedHash = decodeURIComponent(rawHash);
      const targetId = decodedHash.replaceAll(REPLACE_CONFIG.targetString, REPLACE_CONFIG.replaceTo);
      
      if (decodedHash !== targetId) {
        const targetElement = document.getElementById(targetId.replace('#', ''));
        if (targetElement) {
          history.replaceState(null, '', `#${targetId}`);
          targetElement.scrollIntoView({ behavior: 'auto' });
        }
      }
    };
  })();

/**
 * 非正式协议链接处理器
 * 自动检查并处理HTML中的邮箱/电话等非正式链接协议的a标签
 */
(function() {
    'use strict';
    
    // 配置选项
    const CONFIG = {
        // 非正式协议列表
        informalProtocols: ['mailto:', 'tel:', 'sms:', 'facetime:', 'skype:', 'whatsapp:', 'weixin:'],
        
        // 检测超时时间（毫秒）
        detectionTimeout: 1500,
        
        // 是否启用控制台日志
        enableLogging: true,
        
        // 是否显示弹窗提示
        showAlert: true,
        
        // 是否启用协议检测（如果为false，将直接打开链接而不检测）
        enableDetection: true,
        
        commonProtocols: ['mailto:', 'tel:', 'sms:'],        
        // 自定义提示消息
        alertMessages: {
            mailto: '无法打开邮件客户端，请检查是否安装了邮件应用程序。',
            tel: '无法拨打电话，请检查设备是否支持电话功能。',
            sms: '无法发送短信，请检查设备是否支持短信功能。',
            default: '无法打开链接，请检查您的设备是否安装了相应的应用程序。'
        }
    };
    
    // 工具函数：日志输出
    function log(message, ...args) {
        if (CONFIG.enableLogging) {
            console.log(`[非正式协议处理器] ${message}`, ...args);
        }
    }
    
    // 工具函数：显示用户友好的弹窗
    function showAlert(message, protocol = 'default') {
        if (!CONFIG.showAlert) return;
        
        const alertMessage = CONFIG.alertMessages[protocol] || CONFIG.alertMessages.default;
        
        // 使用更现代的方式显示提示
        if (window.confirm) {
            window.alert(alertMessage);
        } else {
            // 备用方案：创建自定义弹窗
            createCustomAlert(alertMessage);
        }
    }
    
    // 创建自定义弹窗（备用方案）
    function createCustomAlert(message) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 400px;
            margin: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;
        
        dialog.innerHTML = `
            <p style="margin: 0 0 15px 0; color: #333;">${message}</p>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                确定
            </button>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // 点击遮罩关闭弹窗
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }
    
    // 检测协议支持情况
    function detectProtocolSupport(protocol, originalHref) {
        return new Promise((resolve) => {
            // 对于某些协议，我们采用更宽松的检测策略
            const lenientProtocols = ['mailto:', 'tel:', 'sms:'];
            const isLenient = lenientProtocols.includes(protocol);
            
            if (isLenient) {
                // 对于邮件、电话、短信等常见协议，我们假设它们被支持
                // 只有在明确失败时才显示错误
                log(`使用宽松检测策略处理协议: ${protocol}`);
                
                // 创建一个隐藏的测试元素
                const testElement = document.createElement('a');
                testElement.href = originalHref;
                testElement.style.display = 'none';
                document.body.appendChild(testElement);
                
                // 记录开始时间
                const startTime = Date.now();
                let hasError = false;
                
                // 尝试打开链接
                try {
                    // 使用setTimeout来异步执行，避免阻塞
                    setTimeout(() => {
                        try {
                            testElement.click();
                            
                            // 对于宽松协议，我们给一个很短的检测时间
                            // 如果没有立即出错，就认为成功
                            setTimeout(() => {
                                document.body.removeChild(testElement);
                                if (!hasError) {
                                    log(`协议 ${protocol} 检测成功`);
                                    resolve(true);
                                } else {
                                    log(`协议 ${protocol} 检测失败`);
                                    resolve(false);
                                }
                            }, 100);
                            
                        } catch (e) {
                            hasError = true;
                            log('协议检测出错:', e);
                            document.body.removeChild(testElement);
                            resolve(false);
                        }
                    }, 0);
                    
                } catch (e) {
                    hasError = true;
                    log('协议检测出错:', e);
                    document.body.removeChild(testElement);
                    resolve(false);
                }
                
            } else {
                // 对于其他协议，使用原来的检测方法
                log(`使用严格检测策略处理协议: ${protocol}`);
                
                const testElement = document.createElement('a');
                testElement.href = protocol + 'test';
                
                let hasNavigated = false;
                let hasError = false;
                
                // 监听页面可见性变化
                const visibilityHandler = () => {
                    if (document.visibilityState === 'hidden') {
                        hasNavigated = true;
                    }
                };
                
                document.addEventListener('visibilitychange', visibilityHandler);
                
                // 尝试打开链接
                try {
                    testElement.click();
                } catch (e) {
                    hasError = true;
                    log('协议检测出错:', e);
                    document.removeEventListener('visibilitychange', visibilityHandler);
                    resolve(false);
                    return;
                }
                
                // 设置检测超时
                setTimeout(() => {
                    document.removeEventListener('visibilitychange', visibilityHandler);
                    
                    // 检查是否发生了导航
                    if (hasNavigated || document.visibilityState === 'hidden') {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }, CONFIG.detectionTimeout);
            }
        });
    }
    
    // 处理非正式链接点击事件
    async function handleInformalLinkClick(event, href, link) {
        event.preventDefault();
        
        const protocol = href.split(':')[0] + ':';
        log(`处理非正式协议链接: ${href}`);
        
        // 添加视觉反馈
        link.style.opacity = '0.7';
        link.style.cursor = 'wait';
        
        // 检查是否为常见协议或是否禁用检测
        const isCommonProtocol = CONFIG.commonProtocols.includes(protocol);
        const shouldSkipDetection = !CONFIG.enableDetection || isCommonProtocol;
        
        if (shouldSkipDetection) {
            log(`直接打开链接 (协议: ${protocol}, 检测禁用: ${!CONFIG.enableDetection}, 常见协议: ${isCommonProtocol})`);
            
            try {
                // 直接尝试打开链接
                window.location.href = href;
                
                // 给一个很短的延迟，然后恢复样式
                setTimeout(() => {
                    link.style.opacity = '';
                    link.style.cursor = '';
                }, 300);
                
            } catch (error) {
                log('打开链接时出错:', error);
                showAlert(null, protocol.replace(':', ''));
                
                // 恢复链接样式
                link.style.opacity = '';
                link.style.cursor = '';
            }
        } else {
            // 对于其他协议，使用检测机制
            log(`使用检测机制处理协议: ${protocol}`);
            try {
                const isSupported = await detectProtocolSupport(protocol, href);
                
                if (isSupported) {
                    log(`协议 ${protocol} 支持，尝试打开`);
                    window.location.href = href;
                } else {
                    log(`协议 ${protocol} 不支持，显示提示`);
                    showAlert(null, protocol.replace(':', ''));
                }
            } catch (error) {
                log('处理链接时出错:', error);
                showAlert(null, protocol.replace(':', ''));
            } finally {
                // 恢复链接样式
                setTimeout(() => {
                    link.style.opacity = '';
                    link.style.cursor = '';
                }, 500);
            }
        }
    }
    
    // 查找并处理所有非正式协议链接
    function processInformalLinks() {
        const allLinks = document.querySelectorAll('a[href]');
        let processedCount = 0;
        
        log(`开始处理 ${allLinks.length} 个链接`);
        
        allLinks.forEach((link, index) => {
            const href = link.getAttribute('href');
            
            if (!href) return;
            
            // 检查是否为非正式协议链接
            const isInformal = CONFIG.informalProtocols.some(protocol => 
                href.toLowerCase().startsWith(protocol)
            );
            
            if (isInformal) {
                log(`发现非正式协议链接 [${index}]: ${href}`);
                
                // 移除target="_blank"属性
                if (link.hasAttribute('target') && link.getAttribute('target') === '_blank') {
                    link.removeAttribute('target');
                    log(`已移除 target="_blank" 属性`);
                }
                
                // 添加点击事件处理（移除之前的事件监听器）
                const newHandler = function(e) {
                    handleInformalLinkClick(e, href, link);
                };
                
                // 存储事件处理器引用以便后续移除
                link._informalLinkHandler = newHandler;
                link.addEventListener('click', newHandler);
                
                processedCount++;
            }
        });
        
        log(`处理完成，共处理了 ${processedCount} 个非正式协议链接`);
    }
    
    // 处理动态添加的链接（使用MutationObserver）
    function observeDynamicLinks() {
        const observer = new MutationObserver((mutations) => {
            let shouldReprocess = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 检查新添加的节点是否包含链接
                            if (node.tagName === 'A' && node.hasAttribute('href')) {
                                shouldReprocess = true;
                            } else if (node.querySelectorAll) {
                                const links = node.querySelectorAll('a[href]');
                                if (links.length > 0) {
                                    shouldReprocess = true;
                                }
                            }
                        }
                    });
                }
            });
            
            if (shouldReprocess) {
                log('检测到新的链接，重新处理');
                processInformalLinks();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        log('已启用动态链接监听');
    }
    
    // 清理函数（移除事件监听器）
    function cleanup() {
        const allLinks = document.querySelectorAll('a[href]');
        allLinks.forEach(link => {
            if (link._informalLinkHandler) {
                link.removeEventListener('click', link._informalLinkHandler);
                delete link._informalLinkHandler;
            }
        });
        log('已清理所有事件监听器');
    }
    
    // 初始化函数
    function init() {
        log('初始化非正式协议链接处理器');
        
        try {
            processInformalLinks();
            observeDynamicLinks();
            log('初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
        }
    }
    
    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 暴露API给外部使用
    window.InformalLinkProcessor = {
        process: processInformalLinks,
        cleanup: cleanup,
        config: CONFIG,
        log: log
    };
    
})();