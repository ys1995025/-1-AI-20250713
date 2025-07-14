// pages/home/home.ts
Page({
  data: {
    artworks: [] as Array<{
      id: string;
      imageUrl: string;
      prompt: string;
    }>,
    isLoading: false,
    page: 1,
    hasMore: true
  },
  
  // 确保URL使用HTTPS协议
  ensureHttps(url: string): string {
    if (!url) return url;
    return url.replace(/^http:\/\//i, 'https://');
  },

  onLoad() {
    this.loadArtworks();
  },

  onPullDownRefresh() {
    this.setData({
      artworks: [],
      page: 1,
      hasMore: true
    });
    this.loadArtworks().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadArtworks();
    }
  },

  loadArtworks() {
    if (this.data.isLoading || !this.data.hasMore) {
      return Promise.resolve();
    }

    this.setData({ isLoading: true });

    // 模拟API请求，实际项目中应替换为真实API调用
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // 模拟数据
        const mockData = [
          {
            id: `artwork-${this.data.page}-1`,
            imageUrl: 'https://picsum.photos/300/400?random=' + Math.random(),
            prompt: '一只在森林中奔跑的魔法鹿，梦幻风格'
          },
          {
            id: `artwork-${this.data.page}-2`,
            imageUrl: 'https://picsum.photos/300/400?random=' + Math.random(),
            prompt: '星空下的古老城堡，电影感'
          },
          {
            id: `artwork-${this.data.page}-3`,
            imageUrl: 'https://picsum.photos/300/400?random=' + Math.random(),
            prompt: '未来都市街景，赛博朋克风格'
          },
          {
            id: `artwork-${this.data.page}-4`,
            imageUrl: 'https://picsum.photos/300/400?random=' + Math.random(),
            prompt: '水彩画风格的春天樱花'
          }
        ];
        
        // 确保所有图片链接使用HTTPS
        mockData.forEach(artwork => {
          artwork.imageUrl = this.ensureHttps(artwork.imageUrl);
        });

        const hasMore = this.data.page < 5; // 模拟只有5页数据
        
        this.setData({
          artworks: [...this.data.artworks, ...mockData],
          isLoading: false,
          page: this.data.page + 1,
          hasMore
        });
        
        resolve();
      }, 1000);
    });
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