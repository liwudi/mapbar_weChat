// pages/setpage/setpage.js
const WxService = require(`../../service/WxService`);

const AppService = require(`../../service/AppService`);

const app = getApp();

Page({
  data:{
    groupId: ``,
    groupName: ``,
    isGroupHost: false,
    isAutoPlay: true,
    inputValue:``,

    userId:"",
    userInfo:null,
    
    modalHidden:true,//是否隐藏modal
   
    confirmData:"",
  
    isShowName:true,
  },
  /**
   * 函数名：onload
   * 作用：接受群组界面传过来的参数，确定设置的是哪个群组。
   */
  onLoad:function(options){
    console.log(`setPage options`,options);
    let _this=this;
    this.setData({
      groupId:Number(options.groupId),
      groupName:options.groupName,
      isGroupHost:(options.isGroupHost=="true")?true:false,
      isAutoPlay:app.globalData.isAutoPlay,
      inputValue: options.groupName,
    });
    AppService.getUserInfo().then(res => {
      console.log(res);
      _this.setData({
        userId:res.data.user.userId,
        userInfo:res.data.userInfo
      });
    })
  },

  /**
   * 函数名：confirmEvent
   * 作用：解散群组，这里还需要一个解散群组的接口。
   */
  confirmEvent:function(){
    let _this=this;
    console.log(_this.data.userId,_this.data.groupId);
    WxService.showModal(`提示`,`您确定要退出或者解散群组吗?`,true,AppService.exitTheGroup(_this.data.userId,_this.data.groupId))
  },
  setEvent:function(){
    this.setData({
      modalHidden:false
    });
  },
  /**
   * 函数名：modalChange
   * 作用：设置群名称的确定事件。
   */
  modalChange:function(){
    let _this=this;
    AppService.changeGroupName(_this.data.userId, _this.data.groupId, (this.data.confirmData=="") ? this.data.groupName : this.data.confirmData);
  },
  /**
   * 函数名：modalCancel
   * 作用：设置群名称的取消事件。
   */
  modalCancel:function(){
    this.setData({
      modalHidden:true
    });
  },
  /**
   * 函数名：inputEvent
   * 作用：输入框的input事件，用于记录输入的字符串
   */
  inputEvent:function(event){
    this.setData({
      confirmData:event.detail.value,
      isShowName:event.detail.value?true:false,
    });
  },
  /**
   * switchChange事件必须每次缓存isAutoPlay的值，然后在第二次登陆的时候获取。
   */
  switchChange:function(e){
    console.log('switch1 发生 change 事件，携带值为', e);
    app.globalData.isAutoPlay=e.detail.value;
  },
  clearContentEvent: function(){
    this.setData({
      inputValue:``,
      isShowName:false,
    })
  }
})