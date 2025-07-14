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
    // 从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        isLoggedIn: true,
        userInfo
      });
      this.loadMyArtworks();
    }
  },

  login() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        
        // 保存用户信息到本地存储
        wx.setStorageSync('userInfo', userInfo);
        
        this.setData({
          isLoggedIn: true,
          userInfo
        });
        
        this.loadMyArtworks();
      },
      fail: (err) => {
        console.error('登录失败', err);
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      }
    });
  },

  loadMyArtworks() {
    // 模拟加载用户作品
    setTimeout(() => {
      // 模拟数据
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
    }, 500);
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