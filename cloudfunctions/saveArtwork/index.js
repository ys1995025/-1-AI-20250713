// 云函数入口文件
const cloud = require('wx-server-sdk');
const fs = require('fs');
const path = require('path');
const request = require('request');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const artworksCollection = db.collection('artworks');

// 下载图片到临时目录
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    // 创建临时文件路径
    const tmpFilePath = path.join('/tmp', `image_${Date.now()}.jpg`);
    
    // 创建可写流
    const writeStream = fs.createWriteStream(tmpFilePath);
    
    // 下载图片
    request({
      url: url,
      encoding: null  // 保持为二进制数据
    })
    .on('error', (err) => {
      reject(err);
    })
    .pipe(writeStream);
    
    // 处理写入完成
    writeStream.on('finish', () => {
      resolve(tmpFilePath);
    });
    
    writeStream.on('error', (err) => {
      reject(err);
    });
  });
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  // 从event中获取参数
  const { imageUrl, prompt, negativePrompt, actualPrompt } = event;
  
  if (!imageUrl || !prompt) {
    return {
      success: false,
      message: '缺少必要参数'
    };
  }

  try {
    // 确保URL使用HTTPS协议
    const httpsImageUrl = imageUrl.replace(/^http:\/\//i, 'https://');
    
    // 下载图片到临时文件
    console.log('开始下载图片:', httpsImageUrl);
    const tmpFilePath = await downloadImage(httpsImageUrl);
    console.log('图片下载完成，临时路径:', tmpFilePath);
    
    // 读取临时文件
    const fileContent = fs.readFileSync(tmpFilePath);
    console.log('文件读取完成，大小:', fileContent.length);
    
    // 上传到云存储
    console.log('开始上传到云存储');
    const cloudPath = `artworks/${openid}_${Date.now()}.jpg`;
    const uploadResult = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: fileContent
    });
    console.log('上传到云存储完成:', uploadResult.fileID);
    
    // 获取用户信息
    let userInfo = null;
    try {
      const userResult = await db.collection('users').where({
        _openid: openid
      }).get();
      
      if (userResult.data.length > 0) {
        userInfo = userResult.data[0];
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
    
    // 构建作品数据
    const artwork = {
      _openid: openid,
      imageUrl: uploadResult.fileID,
      prompt: prompt,
      negativePrompt: negativePrompt || '',
      actualPrompt: actualPrompt || prompt,
      createTime: db.serverDate(),
      userName: userInfo ? userInfo.nickName : '匿名用户',
      userAvatar: userInfo ? userInfo.avatarUrl : null,
      likes: 0,
      views: 0
    };
    
    // 保存到数据库
    console.log('开始保存到数据库');
    const dbResult = await artworksCollection.add({
      data: artwork
    });
    console.log('保存到数据库完成:', dbResult._id);
    
    // 清理临时文件
    try {
      fs.unlinkSync(tmpFilePath);
    } catch (err) {
      console.warn('清理临时文件失败:', err);
    }
    
    return {
      success: true,
      artworkId: dbResult._id,
      data: {
        ...artwork,
        _id: dbResult._id
      }
    };
  } catch (error) {
    console.error('发布作品失败:', error);
    return {
      success: false,
      message: error.message || '发布作品失败'
    };
  }
}; 