// pages/result/result.ts
import { pollTaskResult, TaskStatus, TaskResult } from '../../utils/imageGenerationService';

Page({
  data: {
    taskId: '',
    prompt: '',
    negativePrompt: '',
    imageUrl: '',
    actualPrompt: '', // 智能改写后的提示词
    isLoading: true,
    error: '',        // 错误信息
    seed: 0,          // 随机种子，用于重新生成
    isPolling: false  // 是否正在轮询
  },
  
  // 确保URL使用HTTPS协议
  ensureHttps(url: string): string {
    if (!url) return url;
    return url.replace(/^http:\/\//i, 'https://');
  },

  onLoad(options: Record<string, string>) {
    // 从URL参数获取任务ID和提示词
    if (options.taskId) {
      this.setData({
        taskId: options.taskId
      });
    }

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

    // 查询图片生成结果
    this.queryTaskResult();
  },

  // 查询任务结果
  async queryTaskResult() {
    const { taskId } = this.data;
    
    if (!taskId) {
      this.setData({
        isLoading: false,
        error: '任务ID不能为空'
      });
      return;
    }

    this.setData({
      isLoading: true,
      error: '',
      isPolling: true
    });

    try {
      // 轮询任务结果
      const result = await pollTaskResult(taskId, (status) => {
        // 进度回调，更新状态提示
        let loadingText = '';
        switch(status) {
          case TaskStatus.PENDING:
            loadingText = '任务排队中...';
            break;
          case TaskStatus.RUNNING:
            loadingText = '正在生成您的作品...';
            break;
          default:
            loadingText = '正在处理...';
        }
        
        // 更新加载提示（可以在WXML中使用）
        this.setData({
          loadingText
        });
      });

      this.setData({
        isPolling: false
      });
      
      if (!result.success || !result.data) {
        throw new Error(result.message || '获取结果失败');
      }

      const taskResult = result.data;
      
      // 任务成功完成
      if (taskResult.task_status === TaskStatus.SUCCEEDED && 
          taskResult.results && 
          taskResult.results.length > 0) {
            
        const imageResult = taskResult.results[0];
        
        // 提取种子信息，用于重新生成
        const seed = Math.floor(Math.random() * 2147483647); // 默认随机数
        
        this.setData({
          imageUrl: imageResult.url,
          actualPrompt: imageResult.actual_prompt || '',
          isLoading: false,
          seed
        });
      } 
      // 任务失败
      else if (taskResult.task_status === TaskStatus.FAILED) {
        this.setData({
          isLoading: false,
          error: '图片生成失败，请重试'
        });
      } 
      // 其他未成功状态
      else {
        this.setData({
          isLoading: false,
          error: '任务未成功完成，请重试'
        });
      }
    } catch (error: any) {
      console.error('查询任务结果失败', error);
      this.setData({
        isLoading: false,
        isPolling: false,
        error: error.message || '获取结果失败，请重试'
      });
    }
  },

  // 重新生成图片
  async regenerateImage() {
    if (this.data.isPolling) {
      wx.showToast({
        title: '图片生成中，请稍候',
        icon: 'none'
      });
      return;
    }

    // 获取当前页面栈
    const pages = getCurrentPages();
    // 构建URL参数
    const urlParams = `?prompt=${encodeURIComponent(this.data.prompt)}&negativePrompt=${encodeURIComponent(this.data.negativePrompt || '')}`;
    
    // 检查页面栈中是否有create页面
    let hasCreatePage = false;
    for (let i = 0; i < pages.length - 1; i++) {
      if (pages[i].route === 'pages/create/create') {
        hasCreatePage = true;
        break;
      }
    }

    if (hasCreatePage) {
      // 如果页面栈中有create页面，直接返回，参数通过页面事件通道传递
      const eventChannel = this.getOpenerEventChannel();
      // 触发事件，传递数据给前一个页面
      eventChannel.emit('updatePrompt', {
        prompt: this.data.prompt,
        negativePrompt: this.data.negativePrompt || ''
      });
      
      wx.navigateBack();
    } else {
      // 如果页面栈中没有create页面，重定向到create页面
      wx.redirectTo({
        url: `/pages/create/create${urlParams}`
      });
    }
  },

  // 保存图片到相册
  saveToAlbum() {
    if (!this.data.imageUrl) {
      wx.showToast({
        title: '无图片可保存',
        icon: 'none'
      });
      return;
    }

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

  // 预览图片
  previewImage() {
    if (!this.data.imageUrl) {
      return;
    }
    
    // 确保预览图片使用HTTPS
    const httpsUrl = this.ensureHttps(this.data.imageUrl);
    
    wx.previewImage({
      urls: [httpsUrl],
      current: httpsUrl
    });
  },

  // 发布作品
  publishArtwork() {
    if (!this.data.imageUrl) {
      wx.showToast({
        title: '无图片可发布',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '发布中...'
    });

    // 目前简单实现跳转到首页
    // 实际项目中应调用云函数保存作品数据
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
  }
}); 