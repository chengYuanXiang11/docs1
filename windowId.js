
  // 定义替换规则：将 "%26" 替换为 "ant"
  const replacePattern = /%26/g;
  const replacement = "ant";

  // 1. 遍历所有元素，处理包含 "%26" 的 ID
  const elementsWithEncodedId = document.querySelectorAll('[id*="%26"]');
  
  elementsWithEncodedId.forEach(element => {
    const oldId = element.id;
    const newId = oldId.replace(replacePattern, replacement);
    
    // 确保新 ID 在文档中是唯一的
    if (!document.getElementById(newId)) {
      element.id = newId;
      console.log(`ID 已更新: ${oldId} → ${newId}`);
    } else {
      console.warn(`ID 冲突: ${newId} 已存在，跳过更新`);
    }
  });

  // 2. 处理 URL 哈希匹配
  const handleHashNavigation = () => {
    const rawHash = window.location.hash;
    if (!rawHash) return;

    // 解码哈希并替换编码字符
    const decodedHash = decodeURIComponent(rawHash);
    const targetHash = decodedHash.replace(replacePattern, replacement);

    // 如果哈希需要修正
    if (decodedHash !== targetHash) {
      const targetElement = document.getElementById(targetHash.replace('#', ''));
      
      if (targetElement) {
        // 用新哈希更新 URL（不增加历史记录）
        window.history.replaceState(null, null, targetHash);
        targetElement.scrollIntoView({ behavior: 'auto' });
      }
    }
  };

  // 初始执行哈希处理
  handleHashNavigation();

  // 3. 监听哈希变化（可选）
  window.addEventListener('hashchange', handleHashNavigation);