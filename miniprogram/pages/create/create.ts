// pages/create/create.ts
import { createImageTask } from '../../utils/imageGenerationService';

Page({
  data: {
    prompt: '',
    negativePrompt: '',
    isGenerating: false,
    styleTags: ['写实', '动漫', '电影感', '梦幻', '赛博朋克', '水彩画']
  },

  onLoad(options: Record<string, string>) {
    // 接收传递过来的提示词参数
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

    // 监听事件通道，接收从result页面传回的提示词数据
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('updatePrompt', (data: {prompt: string, negativePrompt: string}) => {
      if (data.prompt) {
        this.setData({
          prompt: data.prompt,
          negativePrompt: data.negativePrompt || '',
          isGenerating: false  // 重置按钮状态
        });
      }
    });
  },
  
  // 页面显示时重置状态
  onShow() {
    // 重置生成状态，确保按钮可用
    this.setData({
      isGenerating: false
    });
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
  async generateImage() {
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

    try {
      // 调用云函数创建图像生成任务
      const createResult = await createImageTask({
        prompt: this.data.prompt,
        negativePrompt: this.data.negativePrompt,
        size: '1024*1024', // 默认1024*1024尺寸
        n: 1,              // 生成1张图片
        promptExtend: true // 开启提示词智能改写
      });
      
      if (!createResult.success || !createResult.data) {
        throw new Error(createResult.message || '创建任务失败');
      }
      
      // 创建成功，获取任务ID
      const taskId = createResult.data.task_id;
      
      // 生成成功后跳转到结果页，传递任务ID和提示词
      wx.navigateTo({
        url: `/pages/result/result?taskId=${taskId}&prompt=${encodeURIComponent(this.data.prompt)}&negativePrompt=${encodeURIComponent(this.data.negativePrompt || '')}`
      });
    } catch (error: any) {
      console.error('生成图片失败', error);
      wx.showToast({
        title: error.message || '生成失败，请重试',
        icon: 'none',
        duration: 2000
      });
      
      this.setData({
        isGenerating: false
      });
    }
  }
}); 