// pages/create/create.ts
Page({
  data: {
    prompt: '',
    negativePrompt: '',
    isGenerating: false,
    styleTags: ['写实', '动漫', '电影感', '梦幻', '赛博朋克', '水彩画']
  },

  onLoad() {
    // 页面加载时的逻辑
  },

  // 处理提示词输入
  onPromptInput(e: WechatMiniprogram.Input) {
    this.setData({
      prompt: e.detail.value
    });
  },

  // 处理负面提示词输入
  onNegativePromptInput(e: WechatMiniprogram.Input) {
    this.setData({
      negativePrompt: e.detail.value
    });
  },

  // 添加风格标签
  addStyleTag(e: WechatMiniprogram.TouchEvent) {
    const tag = e.currentTarget.dataset.tag;
    let currentPrompt = this.data.prompt;
    
    // 如果提示词末尾没有标点或空格，添加一个逗号
    if (currentPrompt && !currentPrompt.match(/[\s,，.。;；!！?？]$/)) {
      currentPrompt += '，';
    } else if (currentPrompt) {
      // 已有标点，确保有空格
      if (!currentPrompt.endsWith(' ')) {
        currentPrompt += ' ';
      }
    }
    
    // 添加标签
    this.setData({
      prompt: currentPrompt + tag
    });
  },

  // 生成图片
  generateImage() {
    if (!this.data.prompt) {
      wx.showToast({
        title: '请输入提示词',
        icon: 'none'
      });
      return;
    }

    this.setData({
      isGenerating: true
    });

    // 保存当前提示词到全局数据
    const promptData = {
      prompt: this.data.prompt,
      negativePrompt: this.data.negativePrompt
    };
    
    // 模拟API调用生成图片
    setTimeout(() => {
      this.setData({
        isGenerating: false
      });
      
      // 生成成功后跳转到结果页
      wx.navigateTo({
        url: `/pages/result/result?prompt=${encodeURIComponent(this.data.prompt)}&negativePrompt=${encodeURIComponent(this.data.negativePrompt)}`
      });
    }, 2000);
  }
}); 