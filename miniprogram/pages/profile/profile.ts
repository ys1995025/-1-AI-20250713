// pages/profile/profile.ts
Page({
  data: {
    isLoggedIn: false,
    userInfo: {
      avatarUrl: '',
      nickName: ''
    },
    artworkCount: 0,
    myArtworks: [] as Array<{
      id: string;
      imageUrl: string;
      prompt: string;
    }>
  },

  onLoad() {
    // 检查是否已登录
    this.checkLoginStatus();
  },

  onShow() {
    if (this.data.isLoggedIn) {
      this.loadMyArtworks();
    }
  },

  checkLoginStatus() {
    const app = getApp<IAppOption>();
    const userInfo = app.globalData.userInfo;
    
    if (userInfo) {
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo
      });
      this.loadMyArtworks();
    }
  },

  async login() {
    try {
      // 1. 获取用户信息
      const userProfileRes = await wx.getUserProfile({
        desc: '用于完善用户资料'
      });

      if (!userProfileRes.userInfo) {
        throw new Error('获取用户信息失败');
      }
      
      const userInfo = userProfileRes.userInfo;

      wx.showLoading({
        title: '登录中...',
        mask: true
      });

      // 2. 调用云函数登录，获取openid
      const loginRes: any = await wx.cloud.callFunction({
        name: 'login'
      });

      if (!loginRes.result || !loginRes.result.openid) {
        wx.hideLoading();
        throw new Error('登录失败，无法获取用户标识');
      }

      const openid = loginRes.result.openid;

      // 3. 保存用户信息
      const saveUserRes: any = await wx.cloud.callFunction({
        name: 'saveUserInfo',
        data: {
          userInfo: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            gender: userInfo.gender,
            country: userInfo.country,
            province: userInfo.province,
            city: userInfo.city,
            language: userInfo.language
          }
        }
      });

      wx.hideLoading();

      if (saveUserRes.result && saveUserRes.result.success) {
        // 更新全局数据和本地存储
        const app = getApp<IAppOption>();
        app.globalData.userInfo = userInfo;
        app.globalData.openid = openid;
        wx.setStorageSync('userInfo', userInfo);
        wx.setStorageSync('openid', openid);

        // 更新页面状态
        this.setData({
          isLoggedIn: true,
          userInfo
        });

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 2000
        });

        // 加载用户作品
        this.loadMyArtworks();
      } else {
        throw new Error('保存用户信息失败');
      }
    } catch (error: any) {
      console.error('登录失败', error);
      wx.hideLoading();
      
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  async loadMyArtworks() {
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });

      // 查询用户作品数据
      const app = getApp<IAppOption>();
      const openid = app.globalData.openid;

      if (!openid) {
        throw new Error('无法获取用户标识');
      }

      // 实际项目中，这里应该调用云函数获取用户作品
      // 这里先使用模拟数据
      const mockArtworks = [
        {
          id: 'my-artwork-1',
          imageUrl: 'https://picsum.photos/300/400?random=' + Math.random(),
          prompt: '我的第一幅AI画作'
        },
        {
          id: 'my-artwork-2',
          imageUrl: 'https://picsum.photos/300/400?random=' + Math.random(),
          prompt: '星空下的城市'
        }
      ];

      this.setData({
        myArtworks: mockArtworks,
        artworkCount: mockArtworks.length
      });

      wx.hideLoading();
    } catch (error) {
      console.error('加载作品失败', error);
      wx.hideLoading();
      
      wx.showToast({
        title: '加载作品失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  navigateToCreate() {
    wx.navigateTo({
      url: '/pages/create/create'
    });
  },

  previewImage(e: WechatMiniprogram.TouchEvent) {
    const { url, prompt } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: [url],
      showmenu: true
    });
  }
}); 