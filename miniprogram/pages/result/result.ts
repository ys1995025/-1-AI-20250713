// pages/result/result.ts
Page({
  data: {
    prompt: '',
    negativePrompt: '',
    imageUrl: '',
    isLoading: true
  },

  onLoad(options: Record<string, string>) {
    // 从URL参数获取提示词
    if (options.prompt) {
      this.setData({
        prompt: decodeURIComponent(options.prompt)
      });
    }

    if (options.negativePrompt) {
      this.setData({
        negativePrompt: decodeURIComponent(options.negativePrompt)
      });
    }

    // 模拟生成图片
    this.generateImage();
  },

  // 重新生成图片
  regenerateImage() {
    this.setData({
      isLoading: true
    });
    this.generateImage();
  },

  // 生成图片（模拟）
  generateImage() {
    // 模拟API调用生成图片
    setTimeout(() => {
      // 随机生成一个图片URL
      const randomSeed = Math.floor(Math.random() * 1000);
      const imageUrl = `https://picsum.photos/800/800?random=${randomSeed}`;
      
      this.setData({
        imageUrl,
        isLoading: false
      });
    }, 2000);
  },

  // 保存图片到相册
  saveToAlbum() {
    wx.showLoading({
      title: '保存中...'
    });

    wx.downloadFile({
      url: this.data.imageUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({
                title: '保存成功',
                icon: 'success'
              });
            },
            fail: (err) => {
              console.error('保存失败', err);
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              });
            }
          });
        } else {
          wx.showToast({
            title: '下载失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 发布作品
  publishArtwork() {
    wx.showLoading({
      title: '发布中...'
    });

    // 模拟发布请求
    setTimeout(() => {
      wx.hideLoading();
      
      wx.showToast({
        title: '发布成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          // 延迟跳转，让用户看到成功提示
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/home/home'
            });
          }, 1500);
        }
      });
    }, 1000);
  },

  // 预览图片
  previewImage() {
    wx.previewImage({
      urls: [this.data.imageUrl],
      current: this.data.imageUrl
    });
  }
}); 