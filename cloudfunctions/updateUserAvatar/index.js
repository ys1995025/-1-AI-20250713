// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'cloud1-0gtytwrad05c494a'
})

const db = cloud.database()
const userCollection = db.collection('users')

// 确保URL使用HTTPS协议
function ensureHttps(url) {
  if (!url) return url;
  return url.replace(/^http:\/\//i, 'https://');
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 从event中获取头像URL和fileID以及其他图片信息
  const { avatarUrl, fileID, imageInfo } = event
  
  if (!avatarUrl || !fileID) {
    return {
      success: false,
      message: '头像参数不完整'
    }
  }
  
  try {
    // 检查用户是否已存在
    const userResult = await userCollection.where({
      _openid: openid
    }).get()
    
    // 获取用户旧头像fileID（如果存在）
    let oldFileID = null
    if (userResult.data.length > 0 && userResult.data[0].avatarFileID) {
      oldFileID = userResult.data[0].avatarFileID
    }
    
    // 准备头像数据，确保URL使用HTTPS
    const avatarData = {
      avatarUrl: ensureHttps(avatarUrl),
      avatarFileID: fileID,
      avatarUpdateTime: db.serverDate(),
      avatarPath: `user_avatars/${openid}${imageInfo?.extension ? '.' + imageInfo.extension : '.png'}`
    }
    
    // 如果提供了图片信息，保存更多图片详情
    if (imageInfo) {
      avatarData.avatarInfo = {
        width: imageInfo.width,
        height: imageInfo.height,
        size: imageInfo.size,
        format: imageInfo.format,
        extension: imageInfo.extension,
        originalName: imageInfo.originalName || 'avatar'
      }
    }
    
    // 更新用户头像信息
    let result
    if (userResult.data.length > 0) {
      // 用户存在，更新头像
      result = await userCollection.where({
        _openid: openid
      }).update({
        data: {
          ...avatarData,
          updateTime: db.serverDate()
        }
      })
    } else {
      // 用户不存在，创建用户记录
      result = await userCollection.add({
        data: {
          _openid: openid,
          ...avatarData,
          nickName: '用户' + openid.substring(0, 6),
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }
    
    // 如果存在旧头像，尝试删除
    if (oldFileID) {
      try {
        await cloud.deleteFile({
          fileList: [oldFileID]
        })
      } catch (deleteError) {
        console.error('删除旧头像失败', deleteError)
        // 删除失败不影响主流程，继续执行
      }
    }
    
    return {
      success: true,
      data: result,
      avatarInfo: avatarData
    }
  } catch (error) {
    console.error('更新头像失败', error)
    return {
      success: false,
      message: '更新头像失败',
      error
    }
  }
} 