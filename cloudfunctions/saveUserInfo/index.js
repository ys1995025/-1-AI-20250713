// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'cloud1-0gtytwrad05c494a'
})

const db = cloud.database()
const userCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 从event中获取用户信息
  const { userInfo } = event
  
  if (!userInfo) {
    return {
      success: false,
      message: '未提供用户信息'
    }
  }
  
  try {
    // 检查用户是否已存在
    const userResult = await userCollection.where({
      _openid: openid
    }).get()
    
    let result
    
    if (userResult.data.length > 0) {
      // 更新用户信息
      result = await userCollection.where({
        _openid: openid
      }).update({
        data: {
          ...userInfo,
          updateTime: db.serverDate()
        }
      })
      
      return {
        success: true,
        updated: true,
        data: result
      }
    } else {
      // 创建新用户
      result = await userCollection.add({
        data: {
          _openid: openid,
          ...userInfo,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      
      return {
        success: true,
        created: true,
        data: result
      }
    }
  } catch (error) {
    console.error('保存用户信息失败', error)
    return {
      success: false,
      message: '保存用户信息失败',
      error
    }
  }
} 