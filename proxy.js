      // == 前置配置 ==
        const INTERCEPT_URL = '/api/chunk/autocomplete';
        const FUSE_OPTIONS = {
            keys: [
                { name: 'metadata.0.chunk_html', weight: 0.6 },
                { name: 'metadata.0.metadata.title', weight: 0.3 },
                { name: 'metadata.0.metadata.breadcrumbs', weight: 0.1 }
            ],
            threshold: 0.4,
            includeScore: true,
            ignoreLocation: true,
            minMatchCharLength: 1
        };
        const HIGHLIGHT_WINDOW = 15; // 高亮上下文窗口大小

        // == 工具函数 ==
        const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const highlightText = (text, query, windowSize) => {
            const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
            const highlights = [];
            let match;

            while ((match = regex.exec(text)) !== null) {
                const start = Math.max(0, match.index - windowSize);
                const end = match.index + match[0].length + windowSize;
                const snippet = text.slice(start, end)
                    .replace(regex, '<mark>$1</mark>');
                highlights.push(snippet);
                if (highlights.length >= 3) break; // 最多3个高亮
            }
            return highlights;
        };
        const txt = `
        ---
description: "Autopilot aims to break down the barriers between creativity and technical programming, providing equal, simple, and implementable ways for all ideas. Based on AutoCoder self-developed PLE model, we can turn software ideas into truly usable software products through natural language interaction."
title: "👋 Welcome"
---
<img
   className="block dark:hidden"
   src="/微信图片_20250327003833.png"
   alt="Hero Light"
 />
 <img
   className="hidden dark:block"
   src="/微信图片_20250327003833.png"
   alt="Hero Dark"
 />
## **Product Capabilities**

The platform provides all the tools you need to create amazing websites, front-end applications as well as full-stack web applications from one browser tab - in installation required. Lovable includes AI coding tools, real-time collaboration (beta test), and project sharing to give you a head start on your app creation journey.

## **Quick Start** 

<CardGroup cols="2">
  <Card title="Getting Started" href="https://docs.koudingvip.com/introduction">
    Get your docs set up locally for easy development
  </Card>
  <Card title="Tutorial" href="https://docs.koudingvip.com/introduction">
    Preview your changes before you push to make sure they're perfect
  </Card>
</CardGroup>`;

        // == 核心拦截器 ==
        (function () {
            // 加载 Fuse.js
            const fuseScript = document.createElement('script');
            fuseScript.src = 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2';
            document.head.appendChild(fuseScript);

            // ===== XMLHttpRequest 拦截 =====
            const originalXHROpen = XMLHttpRequest.prototype.open;
            const originalXHRSend = XMLHttpRequest.prototype.send;
            const xhrInterceptor = function () {
                const xhr = this;
                let originalOnReadyStateChange;

                xhr.addEventListener('readystatechange', function () {
                    if (xhr.readyState === 4 && xhr.responseURL.includes(INTERCEPT_URL)) {
                        try {
                            const originData = JSON.parse(xhr.responseText);
                            const query = JSON.parse(xhr._body).query || '';

                            const fuse = new Fuse(originData.score_chunks, FUSE_OPTIONS);
                            const results = fuse.search(query);

                            const processedData = {
                                ...originData,
                                score_chunks: results.map(result => ({
                                    ...result.item,
                                    score: result.score,
                                    highlights: highlightText(
                                        txt,
                                        query,
                                        HIGHLIGHT_WINDOW
                                    )
                                }))
                            };

                            Object.defineProperty(xhr, 'responseText', {
                                value: JSON.stringify(processedData)
                            });
                        } catch (e) {
                            console.warn('XHR处理失败:', e);
                        }
                    }
                });

                return function (method, url) {
                    if (url.includes(INTERCEPT_URL)) {
                        this._method = method;
                        this._url = url;
                        originalOnReadyStateChange = this.onreadystatechange;
                    }
                    originalXHROpen.apply(this, arguments);
                };
            }();

            XMLHttpRequest.prototype.open = xhrInterceptor;
            XMLHttpRequest.prototype.send = function (body) {
                this._body = body;
                return originalXHRSend.apply(this, arguments);
            };

            // ===== Fetch 拦截 =====
            const originalFetch = window.fetch;
            window.fetch = async function (url, init) {
                if (typeof url === 'string' && url.includes(INTERCEPT_URL)) {
                    try {
                        const response = await originalFetch(url, init);
                        const clone = response.clone();
                        const body = init?.body ? JSON.parse(init.body) : {};
                        const query = body.query || '';

                        const originData = await clone.json();
                        const fuse = new Fuse(originData.score_chunks, FUSE_OPTIONS);
                        const results = fuse.search(query);

                        const processedData = {
                            ...originData,
                            score_chunks: results.map(result => ({
                                ...result.item,
                                score: result.score,
                                highlights: highlightText(
                                    result.item.metadata[0].chunk_html,
                                    query,
                                    HIGHLIGHT_WINDOWS
                                )
                            }))
                        };

                        return new Response(JSON.stringify(processedData), {
                            status: 200,
                            headers: response.headers
                        });
                    } catch (e) {
                        console.warn('Fetch处理失败:', e);
                        return originalFetch(url, init);
                    }
                }
                return originalFetch(url, init);
            };

            // == 性能优化 ==
            const cache = new Map();
            const getCacheKey = (url, body) => `${url}_${JSON.stringify(body)}`;

            // 为XHR添加缓存
            XMLHttpRequest.prototype.send = function (body) {
                const cacheKey = getCacheKey(this._url, body);

                if (cache.has(cacheKey)) {
                    setTimeout(() => {
                        this.dispatchEvent(new Event('load'));
                        this.readyState = 4;
                        this.status = 200;
                        this.responseText = JSON.stringify(cache.get(cacheKey));
                        if (this.onload) this.onload();
                    }, 50);
                    return;
                }

                this._body = body;
                originalXHRSend.call(this, body);

                this.addEventListener('load', () => {
                    if (this.responseURL.includes(INTERCEPT_URL)) {
                        cache.set(cacheKey, JSON.parse(this.responseText));
                        setTimeout(() => cache.delete(cacheKey), 10000); // 10秒缓存
                    }
                });
            };

            // 为Fetch添加缓存
            window.fetch = (function () {
                const fetchWithCache = async (url, init) => {
                    const cacheKey = getCacheKey(url, init?.body);

                    if (cache.has(cacheKey)) {
                        await new Promise(r => setTimeout(r, Math.random() * 100)); // 随机延迟
                        return new Response(JSON.stringify(cache.get(cacheKey)), {
                            headers: new Headers({ 'Content-Type': 'application/json' })
                        });
                    }

                    const response = await originalFetch(url, init);
                    const clone = response.clone();

                    if (url.includes(INTERCEPT_URL)) {
                        const data = await clone.json();
                        cache.set(cacheKey, data);
                        setTimeout(() => cache.delete(cacheKey), 10000);
                    }

                    return response;
                };
                return fetchWithCache;
            })();
        })();