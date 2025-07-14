// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const artworksCollection = db.collection('artworks')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    // 从event中获取参数
    const { imageUrl, prompt, negativePrompt, actualPrompt } = event
    
    if (!imageUrl || !prompt) {
      return {
        success: false,
        message: '缺少必要参数'
      }
    }
    
    // 确保URL使用HTTPS协议
    const httpsImageUrl = imageUrl.replace(/^http:\/\//i, 'https://')
    
    // 下载远程图片
    let fileContent;
    
    // 判断是云存储ID还是外部URL
    if (httpsImageUrl.startsWith('cloud://')) {
      // 如果是云存储ID，直接使用fileID参数
      const res = await cloud.downloadFile({
        fileID: httpsImageUrl
      });
      fileContent = res.fileContent;
    } else {
      // 如果是外部URL，需要先下载
      const res = await cloud.downloadFile({
        url: httpsImageUrl
      });
      fileContent = res.fileContent;
    }
    
    // 上传图片到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: `artworks/${openid}_${Date.now()}.jpg`,
      fileContent: fileContent,
    })
    
    // 从数据库中获取用户信息
    let userInfo = null
    try {
      const userResult = await db.collection('users').where({
        _openid: openid
      }).get()
      
      if (userResult.data.length > 0) {
        userInfo = userResult.data[0]
      }
    } catch (error) {
      console.error('获取用户信息失败', error)
    }
    
    // 保存作品信息到数据库
    const artwork = {
      _openid: openid,
      imageUrl: uploadResult.fileID, // 云存储中的文件ID
      prompt,
      negativePrompt: negativePrompt || '',
      actualPrompt: actualPrompt || prompt,
      createTime: db.serverDate(),
      userName: userInfo ? userInfo.nickName : '匿名用户',
      userAvatar: userInfo ? userInfo.avatarUrl : null,
      likes: 0,
      views: 0
    }
    
    const dbResult = await artworksCollection.add({
      data: artwork
    })
    
    return {
      success: true,
      artworkId: dbResult._id,
      data: {
        ...artwork,
        _id: dbResult._id
      }
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      message: error.message || '发布作品失败'
    }
  }
} 