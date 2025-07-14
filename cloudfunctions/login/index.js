// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'cloud1-0gtytwrad05c494a'
})

// 云函数入口函数
exports.main = async (event, context) => {
  // 获取微信上下文
  const wxContext = cloud.getWXContext()

  return {
    event,
    openid: wxContext.OPENID,
    unionid: wxContext.UNIONID,
    appid: wxContext.APPID,
    env: cloud.getWXContext().ENV,
  }
} 