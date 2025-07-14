// components/tab-bar/tab-bar.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    selected: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 底部导航列表
    tabList: [
      {
        pagePath: "/pages/home/home",
        text: "首页",
        iconPath: "/assets/icons/home.svg",
        selectedIconPath: "/assets/icons/home_selected.svg"
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的",
        iconPath: "/assets/icons/user.svg",
        selectedIconPath: "/assets/icons/user_selected.svg"
      }
    ],
    // 当前选中的索引
    currentIndex: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 切换Tab
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const tabItem = this.data.tabList[index];
      
      // 如果点击的是当前页，不做跳转
      if (index === this.data.selected) {
        return;
      }
      
      // 跳转到对应页面
      wx.switchTab({
        url: tabItem.pagePath
      });
    }
  },

  // 组件生命周期
  lifetimes: {
    attached() {
      // 组件被加载时，更新当前索引
      this.setData({
        currentIndex: this.properties.selected
      });
    }
  }
}) 