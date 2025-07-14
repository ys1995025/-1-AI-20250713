// 全局应用类型定义

interface IAppOption {
  globalData: {
    userInfo: WechatMiniprogram.UserInfo | null;
    openid: string | null;
    isCloudReady: boolean;
    systemInfo?: WechatMiniprogram.GetSystemInfoSuccessCallbackResult;
    statusBarHeight?: number;
    menuButtonInfo?: ReturnType<typeof wx.getMenuButtonBoundingClientRect>;
    navBarHeight?: number;
  };
  checkLoginStatus: () => Promise<void>;
}

// 云函数返回类型
interface CloudFunctionResult<T> {
  result: T;
  requestID: string;
  errMsg: string;
}

interface LoginResult {
  openid: string;
  unionid?: string;
  appid: string;
  env: string;
  event: any;
}

interface UserInfoResult {
  success: boolean;
  data?: {
    _id: string;
    _openid: string;
    nickName: string;
    avatarUrl: string;
    gender: number;
    country: string;
    province: string;
    city: string;
    language: string;
    createTime: Date;
    updateTime: Date;
  };
  message?: string;
  error?: any;
}

interface SaveUserInfoResult {
  success: boolean;
  created?: boolean;
  updated?: boolean;
  data?: any;
  message?: string;
  error?: any;
} 