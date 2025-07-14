// 云函数入口文件
const cloud = require('wx-server-sdk');
const axios = require('axios');

// 初始化云开发环境
cloud.init({
  env: 'cloud1-0gtytwrad05c494a'
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, params } = event;
  
  try {
    // 从环境变量获取API密钥
    const apiKey = process.env.DASHSCOPE_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        message: 'API密钥未设置，请在云函数环境变量中设置DASHSCOPE_API_KEY'
      };
    }
    
    switch (action) {
      case 'createTask':
        return await createImageGenerationTask(apiKey, params);
      case 'queryTaskResult':
        return await queryTaskResult(apiKey, params.taskId);
      default:
        return {
          success: false,
          message: `未知操作: ${action}`
        };
    }
  } catch (error) {
    console.error('文生图操作出错', error);
    return {
      success: false,
      message: error.message || '文生图操作出错',
      error: error
    };
  }
};

/**
 * 创建文生图任务
 * @param {string} apiKey - DashScope API Key
 * @param {object} params - 生成参数
 * @returns {object} 创建结果
 */
async function createImageGenerationTask(apiKey, params) {
  try {
    const { prompt, negativePrompt, size, n, seed, promptExtend } = params;
    
    if (!prompt) {
      return {
        success: false,
        message: '提示词不能为空'
      };
    }
    
    // 构建请求体
    const requestBody = {
      model: 'wanx2.1-t2i-turbo',
      input: {
        prompt: prompt
      },
      parameters: {
        size: size || '1024*1024',
        n: n || 1
      }
    };
    
    // 添加可选参数
    if (negativePrompt) requestBody.input.negative_prompt = negativePrompt;
    if (seed !== undefined) requestBody.parameters.seed = seed;
    if (promptExtend !== undefined) requestBody.parameters.prompt_extend = promptExtend;
    
    // 发起API请求
    const response = await axios({
      method: 'post',
      url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
      },
      data: requestBody
    });
    
    const result = response.data;
    
    // 保存任务记录到数据库
    await saveTaskToDatabase({
      taskId: result.output.task_id,
      status: result.output.task_status,
      prompt,
      negativePrompt,
      size,
      n,
      seed,
      createdAt: new Date(),
      requestId: result.request_id
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('创建文生图任务出错', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || '创建文生图任务出错',
      error: error.response?.data || error
    };
  }
}

/**
 * 查询文生图任务结果
 * @param {string} apiKey - DashScope API Key
 * @param {string} taskId - 任务ID
 * @returns {object} 任务结果
 */
async function queryTaskResult(apiKey, taskId) {
  try {
    if (!taskId) {
      return {
        success: false,
        message: '任务ID不能为空'
      };
    }
    
    // 发起API请求
    const response = await axios({
      method: 'get',
      url: `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    const result = response.data;
    
    // 更新任务状态到数据库
    await updateTaskInDatabase(taskId, result);
    
    // 如果任务成功完成，确保返回的图片URL使用HTTPS
    if (result.output?.task_status === 'SUCCEEDED' && 
        result.output?.results && 
        result.output?.results.length > 0) {
      
      result.output.results.forEach(item => {
        if (item.url) {
          item.url = ensureHttps(item.url);
        }
      });
    }
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('查询文生图任务结果出错', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || '查询文生图任务结果出错',
      error: error.response?.data || error
    };
  }
}

/**
 * 确保URL使用HTTPS协议
 * @param {string} url - URL
 * @returns {string} 使用HTTPS协议的URL
 */
function ensureHttps(url) {
  if (!url) return url;
  return url.replace(/^http:\/\//i, 'https://');
}

/**
 * 保存任务记录到数据库
 * @param {object} taskData - 任务数据
 */
async function saveTaskToDatabase(taskData) {
  try {
    // 保存到imageGenerationTasks集合
    const tasksCollection = db.collection('imageGenerationTasks');
    await tasksCollection.add({
      data: taskData
    });
  } catch (error) {
    console.error('保存任务记录到数据库出错', error);
    // 不中断主流程，只记录日志
  }
}

/**
 * 更新数据库中的任务状态
 * @param {string} taskId - 任务ID
 * @param {object} result - 任务结果
 */
async function updateTaskInDatabase(taskId, result) {
  try {
    const tasksCollection = db.collection('imageGenerationTasks');
    
    // 查找任务记录
    const taskRecord = await tasksCollection.where({
      taskId: taskId
    }).get();
    
    if (taskRecord.data.length === 0) {
      console.warn('未找到任务记录', taskId);
      return;
    }
    
    // 更新任务记录
    await tasksCollection.where({
      taskId: taskId
    }).update({
      data: {
        status: result.output?.task_status,
        updatedAt: new Date(),
        results: result.output?.results || [],
        metrics: result.output?.task_metrics,
        endTime: result.output?.end_time
      }
    });
  } catch (error) {
    console.error('更新任务状态到数据库出错', error);
    // 不中断主流程，只记录日志
  }
} 