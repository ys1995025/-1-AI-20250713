// pages/home/home.ts
import { getPublicArtworks } from '../../utils/artworkService';

interface ArtworkItem {
  _id: string;
  imageUrl: string;
  prompt: string;
  userName: string;
  userAvatar: string;
  createTime: Date;
}

Page({
  data: {
    artworks: [] as ArtworkItem[],
    isLoading: false,
    page: 1,
    hasMore: true,
    isEmpty: false,
    isFirstLoad: true  // 标记是否是首次加载
  },
  
  // 确保URL使用HTTPS协议
  ensureHttps(url: string): string {
    if (!url) return url;
    return url.replace(/^http:\/\//i, 'https://');
  },

  onLoad() {
    // 页面首次加载时获取数据
    this.loadArtworks();
  },

  onShow() {
    // 每次进入页面时刷新数据，但跳过第一次（因为onLoad已经加载过）
    if (!this.data.isFirstLoad) {
      console.log('首页显示，刷新数据');
      this.refreshArtworks();
    } else {
      // 首次加载后标记为非首次
      this.setData({
        isFirstLoad: false
      });
    }
  },

  // 刷新作品数据
  refreshArtworks() {
    // 重置数据状态
    this.setData({
      artworks: [],
      page: 1,
      hasMore: true,
      isEmpty: false
    });
    
    // 重新加载数据
    this.loadArtworks();
  },

  onPullDownRefresh() {
    this.refreshArtworks();
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadArtworks();
    }
  },

  async loadArtworks() {
    if (this.data.isLoading || !this.data.hasMore) {
      return Promise.resolve();
    }

    this.setData({ isLoading: true });

    try {
      // 调用云函数获取作品列表
      const result = await getPublicArtworks({
        page: this.data.page
      });

      if (result.success && result.data) {
        // 确保所有图片链接使用HTTPS
        const artworks = result.data.map((artwork: any) => {
          if (artwork.imageUrl) {
            artwork.imageUrl = this.ensureHttps(artwork.imageUrl);
          }
          if (artwork.userAvatar) {
            artwork.userAvatar = this.ensureHttps(artwork.userAvatar);
          }
          return artwork;
        });

        // 判断是否为空数据
        const isEmpty = this.data.page === 1 && artworks.length === 0;
        
        this.setData({
          artworks: [...this.data.artworks, ...artworks],
          isLoading: false,
          page: this.data.page + 1,
          hasMore: result.hasMore || false,
          isEmpty
        });
      } else {
        this.setData({ 
          isLoading: false,
          hasMore: false
        });
        
        if (this.data.page === 1) {
          this.setData({ isEmpty: true });
        }
        
        wx.showToast({
          title: result.message || '加载失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载作品失败', error);
      this.setData({ 
        isLoading: false,
        hasMore: false 
      });
      
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }

    return Promise.resolve();
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