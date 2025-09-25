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

 // 自动执行函数
        (function() {
            'use strict';
            
            // 非正式协议列表
            const informalProtocols = ['mailto:', 'tel:', 'sms:', 'facetime:', 'skype:'];
            
            // 状态跟踪器
            const statusContainer = document.getElementById('statusContainer');
            
            // 添加状态信息
            function addStatus(message, isSuccess = true) {
                const statusItem = document.createElement('div');
                statusItem.className = 'status-item';
                statusItem.innerHTML = `<span class="${isSuccess ? 'status-success' : 'status-error'}">${message}</span>`;
                statusContainer.appendChild(statusItem);
            }
            
            // 查找并处理所有非正式协议链接
            function processInformalLinks() {
                const allLinks = document.querySelectorAll('a[href]');
                let processedCount = 0;
                
                allLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    
                    // 检查是否为非正式协议链接
                    const isInformal = informalProtocols.some(protocol => href.startsWith(protocol));
                    
                    if (isInformal) {
                        // 移除target="_blank"属性
                        if (link.hasAttribute('target') && link.getAttribute('target') === '_blank') {
                            link.removeAttribute('target');
                        }
                        
                        // 添加点击事件处理
                        link.addEventListener('click', function(e) {
                            handleInformalLinkClick(e, href, link);
                        });
                        
                        processedCount++;
                    }
                });
                
            }
            
            // 处理非正式链接点击事件
            function handleInformalLinkClick(event, href, link) {
                event.preventDefault();
                
                // 记录点击时间
                const clickTime = Date.now();
                
                // 尝试打开链接
                const newWindow = window.open(href, '_self');
                
                // 设置检测超时
                setTimeout(() => {
                    // 检查窗口状态
                    if (newWindow && !newWindow.closed) {
                        // 窗口仍然打开，可能是无法处理协议
                        showFallback(href, getDisplayTextFromHref(href));
                    } else {
                        // 检查页面是否仍然可见（针对某些移动设备行为）
                        if (document.visibilityState === 'visible') {
                            // 页面仍然可见，可能协议处理失败
                            showFallback(href, getDisplayTextFromHref(href));
                        }
                    }
                }, 1000);
            }
            
            // 从href中提取显示文本
            function getDisplayTextFromHref(href) {
                if (href.startsWith('mailto:')) {
                    return href.replace('mailto:', '');
                } else if (href.startsWith('tel:')) {
                    return href.replace('tel:', '');
                } else if (href.startsWith('sms:')) {
                    return href.replace('sms:', '');
                }
                return href;
            }
            
            // 显示备选方案
            function showFallback(protocol, info) {
                const fallbackSection = document.getElementById('fallbackSection');
                const fallbackMessage = document.getElementById('fallbackMessage');
                const fallbackInfo = document.getElementById('fallbackInfo');
                const copyInfoBtn = document.getElementById('copyInfoBtn');
                
                // 设置消息和联系信息
                if (protocol.startsWith('mailto:')) {
                    fallbackMessage.textContent = '看起来您的设备无法直接打开邮件客户端。您可以通过以下方式联系我们：';
                } else if (protocol.startsWith('tel:')) {
                    fallbackMessage.textContent = '看起来您的设备无法直接拨打电话。您可以通过以下方式联系我们：';
                } else if (protocol.startsWith('sms:')) {
                    fallbackMessage.textContent = '看起来您的设备无法直接发送短信。您可以通过以下方式联系我们：';
                } else {
                    fallbackMessage.textContent = '看起来您的设备无法直接打开相关应用。您可以通过以下方式联系我们：';
                }
                
                fallbackInfo.textContent = info;
                
                // 更新复制按钮事件
                copyInfoBtn.onclick = function() {
                    copyToClipboard(info);
                };
                
                // 显示备选方案
                fallbackSection.classList.add('show');
                
            }
            
            // 复制到剪贴板
            function copyToClipboard(text) {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(() => {
                        showSuccessMessage();
                    }).catch(() => {
                        fallbackCopyText(text);
                    });
                } else {
                    fallbackCopyText(text);
                }
            }
            
            // 兼容旧浏览器的复制方法
            function fallbackCopyText(text) {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = 0;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                        showSuccessMessage();
                    }
                } catch (err) {
                    console.error('复制失败:', err);
                }
                
                document.body.removeChild(textArea);
            }
            
            // 显示成功消息
            function showSuccessMessage() {
                const successMessage = document.getElementById('successMessage');
                successMessage.style.display = 'block';
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 3000);
            }
            
            // 初始化函数
            function init() {
                processInformalLinks();
            }
            
            // 页面加载完成后执行
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                init();
            }
        })();