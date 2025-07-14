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

  try {
    // 查询用户信息
    const userResult = await userCollection.where({
      _openid: openid
    }).get()

    if (userResult.data.length > 0) {
      return {
        success: true,
        data: userResult.data[0]
      }
    } else {
      return {
        success: false,
        message: '未找到用户信息'
      }
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
    return {
      success: false,
      message: '获取用户信息失败',
      error
    }
  }
} 