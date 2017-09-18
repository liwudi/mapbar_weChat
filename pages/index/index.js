//index.js
const WxService = require(`../../service/WxService`);

const AppService = require(`../../service/AppService`);

const app = getApp();

const systemInfo = require(`../../utils/util`).systemInfo;

Page({
  data: {
    array:[{
      src:"../resouces/myicon/index_a.png",
      content:"设置目的地，自动建群"
    },{
      src:"../resouces/myicon/share.png",
      content:"分享给好友"
    },{
      src:"../resouces/myicon/group.png",
      content:"好友加入群组"
    },{
      src:"../resouces/myicon/distance.png",
      content:"查看群成员剩余距离"
    },{
      src:"../resouces/myicon/time.png",
      content:"查看群成员剩余时间"
    },{
      src:"../resouces/myicon/groupchat.png",
      content:"群组语音聊天"
    }],
    userimg: "../resouces/myicon/userImg.png",

    userInfo: {},//初始化的用户昵称、头像信息
    groupList: [],//用于展示群的列表
    groupNumber: null,
    isbind: false,//标识是否绑定了电话

    isClickCode: false,//是否在验证码时间内
    isWrong: false,//验证码是否填写错误
    number_value: "",//电话号输入框的值
    code_value: "",//验证码输入框的值
    rest_time: 60,//再次发送验证码剩余时间
    isNumberShow: false,//确认电话号码是否有输入
    isCodeShow: false,//确认验证码是否有输入
    isNumberWrong:false,

    ismaxDistance: false,
    istotalDistance: false,

    windowHeight: (systemInfo.windowHeight * (750 / systemInfo.screenWidth) - 400)+'rpx',
    listHeight: (systemInfo.windowHeight * (750 / systemInfo.screenWidth) - 738) + 'rpx',
    color: "#f8f8f8",

    //modal相关
    modalHidden:true,
    confirmData:null,
    inputValue:"",


    //test
    iosAndandroid:null
  },
  touchStartEvent:function() {
    console.log('start');

    this.setData({
      color:"#aaaaaa",
      modalHidden: false
    })
  },
  touchEndEvent: function() {
    console.log('end');
    this.setData({
      color: "#f8f8f8"
    })
  },
  onLoad: function (options) {
    console.log('友盟传递参数',options);
    if (options.groupId) {
      this.getDataAndGotoDestination(options.groupId)
    }
  },
  onShow: function(options){
    
    wx.setNavigationBarTitle({ title: '图吧同行' });
    var _this = this;
    AppService.getUserInfo().then(res => {
      console.log('用户信息',res);
      if(res.statusCode == 200){
        res.data.user.maxDistance = (res.data.user.maxDistance == null)? 0 : (res.data.user.maxDistance*1000).toFixed(0);
        res.data.user.totalDistance = (res.data.user.totalDistance == null) ? 0 : (res.data.user.totalDistance*1000).toFixed(0);
        if (res.data.user.maxDistance > 1000){
          res.data.user.maxDistance = (res.data.user.maxDistance/1000).toFixed(1);
          _this.setData({
            ismaxDistance: true
          })
        }
        if (res.data.user.totalDistance > 1000) {
          res.data.user.totalDistance = (res.data.user.totalDistance / 1000).toFixed(1);
          _this.setData({
            istotalDistance: true
          })
        }
        //缓存全局userid，在适当的时候使用，可减少http请求。
        app.globalData.userInfo = res.data.user;
        _this.setData({
            userInfo: res.data.user,
            isbind: res.data.user.userPhone,
            groupList: res.data.groupList,
            groupNumber: res.data.groupList.length
        })
      }
    }).catch(err =>{
      
      /**
       * @service 获取网络状态，如果网络没问题，就是用户授权未开启
       */
      WxService.getNetworkType().then(res => {
        
        if(res !== 'none'){
          WxService.showSetModal('用户信息');
        }else{
          /**
           * @info: 如果网络有问题，就给出提示信息
           */
          wx.showToast({
            title: '请检查您的网络问题',
            icon: 'loading',
            duration: 2000
          })
        }
      })
    })
  },
 
  //验证码相关函数
  clearNumberEvent:function(){
    this.setData({
      number_value:"",
      isNumberShow:false
    });
  },
 
  clearCodeEvent:function(){
    this.setData({
      code_value:"",
      isCodeShow:false
    });
  },
 
  inputNumberEvent:function (event) {
    let data=event.detail.value;
    if(data){
      this.setData({
        isNumberShow:true,
        isNumberWrong:false,
        isWrong:false
      });
    }
    this.setData({
      number_value:data
    });
  },
 
  inputCodeEvent:function (event) {
    let data=event.detail.value;
    if(data){
      this.setData({
        isCodeShow:true,
        isNumberWrong:false,
        isWrong:false
      });
    }
    this.setData({
      code_value:data
    });
  },
  
  modalCancelEvent:function(){
    this.setData({
      isbind:!this.data.isbind
    });
  },
  
  modalConfirmEvent:function(){
    let _this=this;
    let number_data=this.data.number_value;
    if(number_data.length!==11||number_data.charAt(0)!=="1"){
      _this.setData({
        isNumberWrong:true
      })
      return
    }
    AppService.upLoadPin(_this.data.userInfo.userId,_this.data.code_value).then(res => {
      
      if(res.status==6001){
        _this.setData({
          isWrong:true
        }); 
      }else{
        _this.setData({
          isbind:!_this.data.isbind
        });
        wx.showToast({
          title: '绑定成功',
          icon: 'success',
          duration: 1000
        });
      }
    })
  },

  getCodeEvent:function(){
    let _this=this;

    this.setData({
      rest_time:60
    });
    let number_data=this.data.number_value;
    if(number_data.length!==11||number_data.charAt(0)!=="1"){
      wx.showModal({
        title: '提示',
        content: '请输入正确的电话号码！',
        showCancel:false,
      });
    }else{
      AppService.pushSms(this.data.userInfo.userId,this.data.number_value).then(res => {
        
        _this.setData({
          isClickCode:!_this.data.isClickCode
        });
        _this.timer=setInterval(function(){
          _this.setData({
            rest_time:_this.data.rest_time-1
          })
          if(_this.data.rest_time==0){
              _this.setData({
              isClickCode:!_this.data.isClickCode
            });
            clearInterval(_this.timer);
          }
        },1000);
      })
    }
  },
  
  //页面跳转相关的函数!!!!
  
  tapEvent: function() {
    WxService.navigateTo(`../search/search`);
  },


  helpEvent:function(){
    WxService.navigateTo(`../help/help`);
  },


  enterGroupEvent:function(res){

    let _this = this;

    let groupIndex = res.currentTarget.dataset.id;
    
    let groupId = this.data.groupList[groupIndex].groupId;
   
    let isGroupHost = (String(_this.data.groupList[groupIndex].userId)==String(_this.data.userInfo.userId))?true:false;
    let lat = this.data.groupList[groupIndex].lat;
    let lon = this.data.groupList[groupIndex].lon;

    if(groupId){
      
      WxService.navigateTo(`../destination/destination?groupId=${groupId}&isGroupHost=${isGroupHost}&lat=${lat}&lon=${lon}`);
    }
  },
  onShareAppMessage: function () {
    return {
      title: '图吧同行',
      path: '/pages/index/index'
    }
  },
  //用于处理ios和android分享的处理函数。
  getDataAndGotoDestination(groupid){
    let _this = this;
    let isGroupHost = false;
    for (let i = 0; i < _this.data.groupList.length; i++) {
      if (String(_this.data.groupList[i].userId) == String(_this.data.userInfo.userId)) {
        isGroupHost = true;
        break;
      }
    }
    let groupId = groupid;
    if (groupId) {
      WxService.navigateTo(`../destination/destination?groupId=${groupId}&isGroupHost=${isGroupHost}`);
      this.setData({
        modalHidden: true
      })
    } else {
      wx.showToast({
        title: '请检查您的输入是否是数字',
        icon: 'loading',
        duration: 2000
      })
    }
  },
  modalChange:function() {
    let _this = this;
    let isGroupHost = false;
    for(let i = 0;i < _this.data.groupList.length; i++){
      if (String(_this.data.groupList[i].userId) == String(_this.data.userInfo.userId)){
        isGroupHost = true;
        break;
      }
    }
    let groupId = Number(this.data.confirmData);
    if (groupId){
      WxService.navigateTo(`../destination/destination?groupId=${groupId}&isGroupHost=${isGroupHost}`);
      this.setData({
        modalHidden: true
      })
    }else{
      wx.showToast({
        title: '请检查您的输入是否是数字',
        icon: 'loading',
        duration: 2000
      })
    }
    
  },
  modalCancel: function () {
    this.setData({
      modalHidden: true
    });
  },
  /**
   * 函数名：inputEvent
   * 作用：输入框的input事件，用于记录输入的字符串
   */
  inputEvent: function (event) {
    this.setData({
      confirmData: event.detail.value,
      isShowName: event.detail.value ? true:false
    });
  },
  
  clearContentEvent: function () {
    this.setData({
      inputValue: ``,
      isShowName: false
    })
  }
})

