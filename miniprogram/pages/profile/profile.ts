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
    }>,
    showEditModal: false,
    editUserInfo: {
      nickName: ''
    }
  },

  // 确保URL使用HTTPS协议
  ensureHttps(url: string): string {
    if (!url) return url;
    return url.replace(/^http:\/\//i, 'https://');
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
      // 确保头像URL使用HTTPS
      if (userInfo.avatarUrl) {
        userInfo.avatarUrl = this.ensureHttps(userInfo.avatarUrl);
      }
      
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

      // 确保所有图片链接使用HTTPS
      mockArtworks.forEach(artwork => {
        artwork.imageUrl = this.ensureHttps(artwork.imageUrl);
      });

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

  // 选择头像
  async chooseAvatar() {
    try {
      const app = getApp<IAppOption>();
      const openid = app.globalData.openid;
      
      if (!openid) {
        throw new Error('请先登录');
      }
      
      // 选择图片
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      });
      
      if (!res || !res.tempFiles || res.tempFiles.length === 0) {
        throw new Error('未选择图片');
      }
      
      const tempFilePath = res.tempFiles[0].tempFilePath;
      const tempFile = res.tempFiles[0];
      
      // 先在界面上显示临时头像，提升用户体验
      this.setData({
        'userInfo.avatarUrl': tempFilePath
      });
      
      wx.showLoading({
        title: '上传中...',
        mask: true
      });
      
      // 获取图片信息
      let imageInfo;
      try {
        const imgInfo = await wx.getImageInfo({
          src: tempFilePath
        });
        
        imageInfo = {
          width: imgInfo.width,
          height: imgInfo.height,
          format: imgInfo.type,
          orientation: imgInfo.orientation,
          extension: tempFilePath.match(/\.([^.]+)$/)?.[1] || 'png',
          size: tempFile.size || 0,
          originalName: `avatar_${Date.now()}`
        };
      } catch (imgError) {
        console.warn('获取图片信息失败', imgError);
        // 获取图片信息失败不影响上传流程
      }
      
      // 上传图片到云存储
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: `user_avatars/${openid}.${tempFilePath.match(/\.([^.]+)$/)?.[1] || 'png'}`,
        filePath: tempFilePath
      });
      
      if (!uploadRes.fileID) {
        throw new Error('上传失败');
      }
      
      // 获取图片临时访问链接
      const tempUrlRes = await wx.cloud.getTempFileURL({
        fileList: [uploadRes.fileID]
      });
      
      if (!tempUrlRes.fileList || tempUrlRes.fileList.length === 0 || !tempUrlRes.fileList[0].tempFileURL) {
        throw new Error('获取图片链接失败');
      }
      
      // 确保使用HTTPS协议
      let avatarUrl = tempUrlRes.fileList[0].tempFileURL;
      avatarUrl = this.ensureHttps(avatarUrl);
      
      // 调用云函数更新用户头像
      const updateRes: any = await wx.cloud.callFunction({
        name: 'updateUserAvatar',
        data: {
          avatarUrl,
          fileID: uploadRes.fileID,
          imageInfo
        }
      });
      
      wx.hideLoading();
      
      if (updateRes.result && updateRes.result.success) {
        // 更新全局数据和本地存储
        const userInfo = app.globalData.userInfo || {} as WechatMiniprogram.UserInfo;
        userInfo.avatarUrl = avatarUrl;
        
        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);
        
        // 更新页面状态 (此时使用云存储的永久链接)
        this.setData({
          'userInfo.avatarUrl': avatarUrl
        });
        
        wx.showToast({
          title: '头像更新成功',
          icon: 'success',
          duration: 2000
        });
      } else {
        throw new Error('头像更新失败');
      }
    } catch (error: any) {
      console.error('头像更新失败', error);
      wx.hideLoading();
      
      // 如果失败，恢复原头像
      const app = getApp<IAppOption>();
      if (app.globalData.userInfo && app.globalData.userInfo.avatarUrl) {
        this.setData({
          'userInfo.avatarUrl': app.globalData.userInfo.avatarUrl
        });
      }
      
      wx.showToast({
        title: error.message || '头像更新失败',
        icon: 'none',
        duration: 2000
      });
    }
  },
  
  // 打开编辑资料弹窗
  editProfile() {
    this.setData({
      showEditModal: true,
      editUserInfo: {
        nickName: this.data.userInfo.nickName
      }
    });
  },
  
  // 关闭弹窗
  closeModal() {
    this.setData({
      showEditModal: false
    });
  },
  
  // 处理昵称输入
  onNicknameInput(e: WechatMiniprogram.Input) {
    this.setData({
      'editUserInfo.nickName': e.detail.value
    });
  },
  
  // 保存个人资料
  async saveProfile() {
    try {
      const app = getApp<IAppOption>();
      const openid = app.globalData.openid;
      
      if (!openid) {
        throw new Error('请先登录');
      }
      
      const { nickName } = this.data.editUserInfo;
      
      if (!nickName.trim()) {
        throw new Error('昵称不能为空');
      }
      
      wx.showLoading({
        title: '保存中...',
        mask: true
      });
      
      // 调用云函数保存用户信息
      const saveRes: any = await wx.cloud.callFunction({
        name: 'saveUserInfo',
        data: {
          userInfo: {
            nickName
          }
        }
      });
      
      wx.hideLoading();
      
      if (saveRes.result && saveRes.result.success) {
        // 更新全局数据和本地存储
        const userInfo = app.globalData.userInfo || {} as WechatMiniprogram.UserInfo;
        userInfo.nickName = nickName;
        
        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);
        
        // 更新页面状态
        this.setData({
          'userInfo.nickName': nickName,
          showEditModal: false
        });
        
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 2000
        });
      } else {
        throw new Error('保存失败');
      }
    } catch (error: any) {
      console.error('保存资料失败', error);
      wx.hideLoading();
      
      wx.showToast({
        title: error.message || '保存失败',
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
    // 确保预览图片使用HTTPS
    const httpsUrl = this.ensureHttps(url);
    
    wx.previewImage({
      current: httpsUrl,
      urls: [httpsUrl],
      showmenu: true
    });
  }
}); 