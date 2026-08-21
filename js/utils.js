// 工具函数

const Utils = {
  // 生成随机数
  random(min, max) {
    return Math.random() * (max - min) + min;
  },

  // 生成随机整数
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // 防抖
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 节流
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // 深拷贝
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // 格式化时间
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  // 检测移动端
  isMobile() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // 显示变量变化提示
  showVariableChange(variable, change) {
    const popup = document.createElement('div');
    popup.className = `variable-popup ${change > 0 ? 'positive' : 'negative'}`;
    popup.textContent = `${variable}: ${change > 0 ? '+' : ''}${change}`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 2000);
  },

  // 延时函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
