// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const MAX_LIMIT = 10; // 每页返回的数据量

// 云函数入口函数
exports.main = async (event, context) => {
  const { page = 1 } = event;
  const skip = (page - 1) * MAX_LIMIT;
  
  try {
    // 查询作品数据，按照发布时间倒序排列
    const artworksResult = await db.collection('artworks')
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(MAX_LIMIT)
      .get();
      
    // 获取总数
    const countResult = await db.collection('artworks').count();
    
    // 确保所有图片链接使用HTTPS协议
    const artworks = artworksResult.data.map(artwork => {
      if (artwork.imageUrl) {
        artwork.imageUrl = artwork.imageUrl.replace(/^http:\/\//i, 'https://');
      }
      if (artwork.userAvatar) {
        artwork.userAvatar = artwork.userAvatar.replace(/^http:\/\//i, 'https://');
      }
      return artwork;
    });
    
    return {
      success: true,
      data: artworks,
      total: countResult.total,
      currentPage: page,
      totalPages: Math.ceil(countResult.total / MAX_LIMIT),
      hasMore: (page * MAX_LIMIT) < countResult.total
    };
  } catch (error) {
    console.error('获取作品列表失败', error);
    return {
      success: false,
      message: error.message || '获取作品列表失败'
    };
  }
}; 