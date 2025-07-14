// 图标工具类
// 由于我们无法直接在此环境中生成PNG图片，这个工具类提供了一种方式来动态创建图标

/**
 * 将字符串转换为Base64编码
 * @param str 要编码的字符串
 * @returns Base64编码的字符串
 */
function strToBase64(str: string): string {
  try {
    // 使用小程序环境的API
    return wx.arrayBufferToBase64(new Uint8Array(str.split('').map(char => char.charCodeAt(0))));
  } catch (e) {
    console.error('Base64编码失败', e);
    // 失败时返回空字符串
    return '';
  }
}

/**
 * 获取Tab图标的Base64编码
 * @param type 图标类型
 * @param isSelected 是否选中状态
 * @returns Base64编码的图标
 */
export function getTabIcon(type: 'home' | 'user', isSelected: boolean): string {
  const color = isSelected ? '#0052d9' : '#999999';
  
  // 首页图标
  if (type === 'home') {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>`;
    return `data:image/svg+xml;base64,${strToBase64(svgContent)}`;
  }
  
  // 用户图标
  if (type === 'user') {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>`;
    return `data:image/svg+xml;base64,${strToBase64(svgContent)}`;
  }
  
  return '';
}

/**
 * 获取微信图标的Base64编码
 * @returns Base64编码的微信图标
 */
export function getWechatIcon(): string {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
    <path d="M8.691,2.188C3.891,2.188,0,5.476,0,9.53c0,2.212,1.17,4.203,3.002,5.55L2.256,18.4l3.506-1.8c1.246,0.348,2.579,0.53,3.963,0.53c0.151,0,0.302-0.005,0.451-0.012c-0.294-0.851-0.459-1.748-0.459-2.679c0-4.055,3.891-7.342,8.691-7.342c0.421,0,0.835,0.033,1.241,0.096C18.722,3.608,14.09,2.188,8.691,2.188L8.691,2.188z M5.726,7.537c-0.633,0-1.146-0.513-1.146-1.146c0-0.634,0.513-1.146,1.146-1.146c0.633,0,1.146,0.513,1.146,1.146C6.872,7.024,6.359,7.537,5.726,7.537L5.726,7.537z M11.655,7.537c-0.633,0-1.146-0.513-1.146-1.146c0-0.634,0.513-1.146,1.146-1.146c0.633,0,1.146,0.513,1.146,1.146C12.801,7.024,12.288,7.537,11.655,7.537L11.655,7.537z M24,14.756c0-3.516-3.436-6.377-7.311-6.377c-4.097,0-7.312,2.861-7.312,6.377c0,3.517,3.214,6.378,7.312,6.378c0.858,0,1.693-0.123,2.465-0.349l2.247,1.278l-0.617-2.088C22.55,18.771,24,16.89,24,14.756L24,14.756z M15.01,13.61c-0.429,0-0.775-0.347-0.775-0.775c0-0.429,0.347-0.775,0.775-0.775c0.429,0,0.775,0.347,0.775,0.775C15.785,13.264,15.438,13.61,15.01,13.61L15.01,13.61z M19.37,13.61c-0.429,0-0.775-0.347-0.775-0.775c0-0.429,0.347-0.775,0.775-0.775c0.429,0,0.775,0.347,0.775,0.775C20.145,13.264,19.798,13.61,19.37,13.61L19.37,13.61z"/>
  </svg>`;
  return `data:image/svg+xml;base64,${strToBase64(svgContent)}`;
} 