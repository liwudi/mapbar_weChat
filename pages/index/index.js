//index.js
const WxService = require(`../../service/WxService`);

const AppService = require(`../../service/AppService`);

const app = getApp();

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
    isbind: false,//标识是否绑定了电话

    isClickCode: false,//是否在验证码时间内
    isWrong: false,//验证码是否填写错误
    number_value: "",//电话号输入框的值
    code_value: "",//验证码输入框的值
    rest_time: 60,//再次发送验证码剩余时间
    isNumberShow: false,//确认电话号码是否有输入
    isCodeShow: false,//确认验证码是否有输入
    isNumberWrong:false,
  },


  onShow: function(options){
    
    var _this = this;
    
    console.log(`执行onshow`)
    AppService.getUserInfo().then(res => {
      console.log(res);
      if(res.statusCode == 200){
        res.data.user.maxDistance = res.data.user.maxDistance.toFixed(2);
        res.data.user.totalDistance = res.data.user.totalDistance.toFixed(2);
        //缓存全局userid，在适当的时候使用，可减少http请求。
        app.globalData.userInfo = res.data.user;
        _this.setData({
            userInfo: res.data.user,
            isbind: res.data.user.userPhone,
            groupList: res.data.groupList,
        })
      }
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
    AppService.upLoadPin(_this.data.code_value).then(res => {
      console.log(res);
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
    console.log(this.data.number_value);
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
      AppService.pushSms(this.data.number_value).then(res => {
        console.log(res);
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
  }
})

