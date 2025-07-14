// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const MAX_LIMIT = 20

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 获取用户自己的作品
  const { page = 1, userId } = event
  const skip = (page - 1) * MAX_LIMIT
  
  // 如果传入了特定用户ID，则查询该用户的作品，否则查询当前用户的作品
  const queryOpenId = userId || openid
  
  try {
    // 查询数据
    const result = await db.collection('artworks')
      .where({
        _openid: queryOpenId
      })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(MAX_LIMIT)
      .get()
    
    // 获取总数
    const countResult = await db.collection('artworks').where({
      _openid: queryOpenId
    }).count()
    
    // 确保所有图片URL使用HTTPS协议
    const artworks = result.data.map(artwork => {
      if (artwork.imageUrl) {
        artwork.imageUrl = artwork.imageUrl.replace(/^http:\/\//i, 'https://')
      }
      return artwork
    })
    
    return {
      success: true,
      data: artworks,
      total: countResult.total,
      currentPage: page,
      totalPages: Math.ceil(countResult.total / MAX_LIMIT)
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      message: error.message || '获取作品列表失败'
    }
  }
} 