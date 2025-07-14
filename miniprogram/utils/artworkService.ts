// artworkService.ts - 作品管理相关服务

// 发布作品参数接口
interface PublishArtworkParams {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  actualPrompt?: string;
}

// 发布作品返回结果接口
interface PublishResult {
  success: boolean;
  message?: string;
  artworkId?: string;
  data?: any;
}

// 作品列表查询参数
interface GetArtworksParams {
  page?: number;
  userId?: string;
}

// 作品列表返回结果接口
interface ArtworksResult {
  success: boolean;
  message?: string;
  data?: any[];
  total?: number;
  currentPage?: number;
  totalPages?: number;
  hasMore?: boolean;
}

// 发布作品
export async function publishArtwork(params: PublishArtworkParams): Promise<PublishResult> {
  try {
    // 调用云函数发布作品
    const result = await wx.cloud.callFunction({
      name: 'publishArtwork',
      data: params
    });

    return result.result as PublishResult;
  } catch (error: any) {
    console.error('发布作品失败', error);
    return {
      success: false,
      message: error.message || '发布作品失败，请重试'
    };
  }
}

// 使用新的保存作品云函数
export async function saveArtwork(params: PublishArtworkParams): Promise<PublishResult> {
  try {
    // 调用云函数保存作品
    const result = await wx.cloud.callFunction({
      name: 'saveArtwork',
      data: params
    });

    return result.result as PublishResult;
  } catch (error: any) {
    console.error('保存作品失败', error);
    return {
      success: false,
      message: error.message || '保存作品失败，请重试'
    };
  }
}

// 获取用户作品列表
export async function getUserArtworks(params: GetArtworksParams = {}): Promise<ArtworksResult> {
  try {
    // 调用云函数获取作品列表
    const result = await wx.cloud.callFunction({
      name: 'getUserArtworks',
      data: params
    });

    return result.result as ArtworksResult;
  } catch (error: any) {
    console.error('获取作品列表失败', error);
    return {
      success: false,
      message: error.message || '获取作品列表失败，请重试'
    };
  }
}

// 获取公共作品列表
export async function getPublicArtworks(params: GetArtworksParams = {}): Promise<ArtworksResult> {
  try {
    // 调用云函数获取作品列表
    const result = await wx.cloud.callFunction({
      name: 'getPublicArtworks',
      data: params
    });

    return result.result as ArtworksResult;
  } catch (error: any) {
    console.error('获取公共作品列表失败', error);
    return {
      success: false,
      message: error.message || '获取作品列表失败，请重试'
    };
  }
} 