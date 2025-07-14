// app.ts
App<IAppOption>({
  globalData: {
    userInfo: null
  },
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    // 检查登录状态
    this.checkLoginStatus();

    // 获取系统信息
    wx.getSystemInfo({
      success: e => {
        this.globalData.systemInfo = e;
        this.globalData.statusBarHeight = e.statusBarHeight;
        
        // 胶囊按钮位置信息
        const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
        this.globalData.menuButtonInfo = menuButtonInfo;
        
        // 导航栏高度 = 状态栏高度 + 胶囊高度 + 上下边距
        this.globalData.navBarHeight = e.statusBarHeight + menuButtonInfo.height + (menuButtonInfo.top - e.statusBarHeight) * 2;
      }
    });
  },

  // 检查登录状态
  checkLoginStatus() {
    // 获取本地存储的用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  }
});

// 扩展全局数据类型
interface IAppOption {
  globalData: {
    userInfo: WechatMiniprogram.UserInfo | null;
    systemInfo?: WechatMiniprogram.GetSystemInfoSuccessCallbackResult;
    statusBarHeight?: number;
    menuButtonInfo?: ReturnType<typeof wx.getMenuButtonBoundingClientRect>;
    navBarHeight?: number;
  };
  checkLoginStatus: () => void;
}