/**
 * 图像生成服务
 * 封装对文生图云函数的调用
 */

// 文生图任务状态枚举
export enum TaskStatus {
  PENDING = 'PENDING',   // 任务排队中
  RUNNING = 'RUNNING',   // 任务处理中
  SUCCEEDED = 'SUCCEEDED', // 任务执行成功
  FAILED = 'FAILED',     // 任务执行失败
  CANCELED = 'CANCELED', // 任务取消成功
  UNKNOWN = 'UNKNOWN'    // 任务不存在或状态未知
}

// 创建任务参数
export interface CreateTaskParams {
  prompt: string;            // 提示词
  negativePrompt?: string;   // 反向提示词
  size?: string;             // 图像尺寸，默认1024*1024
  n?: number;                // 生成图片数量，1-4
  seed?: number;             // 随机种子
  promptExtend?: boolean;    // 是否开启提示词扩展
}

// 生成的图片结果
export interface GeneratedImage {
  orig_prompt: string;       // 原始提示词
  actual_prompt?: string;    // 实际使用的提示词（开启提示词扩展时）
  url: string;               // 图片URL
}

// 任务结果
export interface TaskResult {
  task_id: string;           // 任务ID
  task_status: TaskStatus;   // 任务状态
  submit_time?: string;      // 提交时间
  scheduled_time?: string;   // 调度时间
  end_time?: string;         // 结束时间
  results?: GeneratedImage[]; // 生成结果
}

/**
 * 创建文生图任务
 * @param params 创建参数
 * @returns 创建结果
 */
export async function createImageTask(params: CreateTaskParams): Promise<{
  success: boolean;
  data?: {
    task_id: string;
    task_status: TaskStatus;
  };
  message?: string;
}> {
  try {
    const result = await wx.cloud.callFunction({
      name: 'imageGeneration',
      data: {
        action: 'createTask',
        params
      }
    });

    const response: any = result.result;

    if (!response.success) {
      return {
        success: false,
        message: response.message || '创建任务失败'
      };
    }

    return {
      success: true,
      data: {
        task_id: response.data.output.task_id,
        task_status: response.data.output.task_status as TaskStatus
      }
    };
  } catch (error: any) {
    console.error('创建文生图任务出错', error);
    return {
      success: false,
      message: error.message || '创建文生图任务出错'
    };
  }
}

/**
 * 查询文生图任务结果
 * @param taskId 任务ID
 * @returns 任务结果
 */
export async function queryTaskResult(taskId: string): Promise<{
  success: boolean;
  data?: TaskResult;
  message?: string;
}> {
  try {
    const result = await wx.cloud.callFunction({
      name: 'imageGeneration',
      data: {
        action: 'queryTaskResult',
        params: {
          taskId
        }
      }
    });

    const response: any = result.result;

    if (!response.success) {
      return {
        success: false,
        message: response.message || '查询任务结果失败'
      };
    }

    // 提取任务结果
    const output = response.data.output;
    
    return {
      success: true,
      data: {
        task_id: output.task_id,
        task_status: output.task_status as TaskStatus,
        submit_time: output.submit_time,
        scheduled_time: output.scheduled_time,
        end_time: output.end_time,
        results: output.results
      }
    };
  } catch (error: any) {
    console.error('查询文生图任务结果出错', error);
    return {
      success: false,
      message: error.message || '查询文生图任务结果出错'
    };
  }
}

/**
 * 轮询任务结果直到完成或失败
 * @param taskId 任务ID
 * @param onProgress 进度回调
 * @param interval 轮询间隔(毫秒)
 * @param maxAttempts 最大尝试次数
 * @returns 任务结果
 */
export async function pollTaskResult(
  taskId: string,
  onProgress?: (status: TaskStatus) => void,
  interval: number = 3000,
  maxAttempts: number = 40
): Promise<{
  success: boolean;
  data?: TaskResult;
  message?: string;
}> {
  let attempts = 0;
  
  return new Promise((resolve) => {
    const checkTask = async () => {
      attempts++;
      
      try {
        const result = await queryTaskResult(taskId);
        
        if (result.success && result.data) {
          const status = result.data.task_status;
          
          // 回调当前状态
          if (onProgress) {
            onProgress(status);
          }
          
          // 任务已完成或失败
          if (status === TaskStatus.SUCCEEDED || 
              status === TaskStatus.FAILED || 
              status === TaskStatus.CANCELED) {
            resolve(result);
            return;
          }
        }
        
        // 达到最大尝试次数
        if (attempts >= maxAttempts) {
          resolve({
            success: false,
            message: '查询任务超时，请稍后再试'
          });
          return;
        }
        
        // 继续轮询
        setTimeout(checkTask, interval);
      } catch (error: any) {
        console.error('轮询任务结果出错', error);
        
        // 出错后仍然继续尝试，除非达到最大尝试次数
        if (attempts >= maxAttempts) {
          resolve({
            success: false,
            message: error.message || '查询任务失败'
          });
        } else {
          setTimeout(checkTask, interval);
        }
      }
    };
    
    // 开始轮询
    checkTask();
  });
} 