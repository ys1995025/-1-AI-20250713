// app.ts
App<IAppOption>({
  globalData: {
    userInfo: null,
    openid: null,
    isCloudReady: false
  },
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-0gtytwrad05c494a',
        traceUser: true,
      });
      this.globalData.isCloudReady = true;
    }

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
  async checkLoginStatus() {
    try {
      // 获取本地存储的用户信息和openid
      const userInfo = wx.getStorageSync('userInfo');
      const openid = wx.getStorageSync('openid');

      if (userInfo && openid) {
        this.globalData.userInfo = userInfo;
        this.globalData.openid = openid;
      } else if (this.globalData.isCloudReady) {
        // 如果云开发已初始化但没有本地缓存，尝试获取用户信息
        const loginRes: any = await wx.cloud.callFunction({
          name: 'login'
        });
        
        if (loginRes.result && loginRes.result.openid) {
          // 保存openid
          this.globalData.openid = loginRes.result.openid;
          wx.setStorageSync('openid', loginRes.result.openid);
          
          // 尝试获取用户信息
          const userInfoRes: any = await wx.cloud.callFunction({
            name: 'getUserInfo'
          });
          
          if (userInfoRes.result && userInfoRes.result.success) {
            const cloudUserInfo = userInfoRes.result.data;
            this.globalData.userInfo = cloudUserInfo;
            wx.setStorageSync('userInfo', cloudUserInfo);
          }
        }
      }
    } catch (error) {
      console.error('检查登录状态失败', error);
    }
  }
});

// 扩展全局数据类型
interface IAppOption {
  globalData: {
    userInfo: WechatMiniprogram.UserInfo | null;
    openid: string | null;
    isCloudReady: boolean;
    systemInfo?: WechatMiniprogram.GetSystemInfoSuccessCallbackResult;
    statusBarHeight?: number;
    menuButtonInfo?: ReturnType<typeof wx.getMenuButtonBoundingClientRect>;
    navBarHeight?: number;
  };
  checkLoginStatus: () => Promise<void>;
}