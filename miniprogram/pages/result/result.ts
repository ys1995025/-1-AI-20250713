// pages/result/result.ts
Page({
  data: {
    prompt: '',
    negativePrompt: '',
    imageUrl: '',
    isLoading: true
  },
  
  // 确保URL使用HTTPS协议
  ensureHttps(url: string): string {
    if (!url) return url;
    return url.replace(/^http:\/\//i, 'https://');
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
      const imageUrl = this.ensureHttps(`https://picsum.photos/800/800?random=${randomSeed}`);
      
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

    // 确保下载URL使用HTTPS
    const downloadUrl = this.ensureHttps(this.data.imageUrl);

    wx.downloadFile({
      url: downloadUrl,
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
    // 确保预览图片使用HTTPS
    const httpsUrl = this.ensureHttps(this.data.imageUrl);
    
    wx.previewImage({
      urls: [httpsUrl],
      current: httpsUrl
    });
  }
}); 