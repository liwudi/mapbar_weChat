
const app = getApp();

const WxService = require(`../../service/WxService`);

const AppService = require(`../../service/AppService`);

const common = require(`../../utils/util`);

let tagList;//标识的是是否已读。



let data = [];//存放拉取下来的数据，以及onmessage接受的数据。


Page({
  data: {
    userId: ``,
    userInfo: null,
    groupId: ``,
    //chat列表相关数据
    chatList:[],
    tempFilePath:"",//记录自己每次说话的语音地址
    timer:0,
    time:'',
    pageIndex:1,
  },
  /**
   * 函数名：onload
   * 作用：初始化聊天数据列表，并且建立socket连接。
   */
  onLoad:function(options){
    console.log(`chatList options`,options.groupId);
    let _this=this;
    if(!tagList){
      tagList = [];
    }
    _this.msgArray = [];

    _this.setData({
      chatList: [],
      groupId:options.groupId
    });

    AppService.getUserInfo().then(res => {
      _this.setData({
          userInfo:res.data.user,
          userId:res.data.user.userId,
      });
      return AppService.voice_search(options.groupId,_this.data.pageIndex);
    }).then(res => {
      console.log(`getInitailData`,res);
      //获取到了一个语音的数组，通过遍历来进行数据处理。
      _this.dealVoiceArray(res);

    })
  },
  dealVoiceArray: function(res) {
    let _this = this;
    
    let voice_array = res.data.data.reverse();
    for(let i=0;i<voice_array.length;i++){
      _this.dealItemData(voice_array[i])
    }
  },
  
  onReady: function (e) {
    
  },
  
  onShow:function(){
    let _this=this;
    _this.onmessage();

  },
  onmessage: function(){
    let _this = this;
    wx.onSocketMessage(function(res) {
      let content = JSON.parse(res.data);
      if(content.status == 200){
        console.log(content);
        let item = content.data;

        //语音播放，过滤自己。
        if(content.data.userid != _this.data.userId){
          _this.msgArray.push(content);
        }
        if(app.globalData.isAutoPlay){
          (!_this.isplaying) && _this.downLoad_playVoice();
        }else{
          _this.msgArray = [];
        }

        //接受到的数据进行处理
        _this.dealItemData(item);
      }
    });
  },
  /**
  * 处理数据
  * 把对象push到一个新的数组上chatList
  * @param item - Object {groupid,id,timelong,uptime,userid,userimg,username}
  */
  dealItemData: function(item){
    let _this = this;
    let theTime = item.uptime;
    let len = data.length;
    
    let dealData = () => {

      item.avatarUrl = item.userimg;
      item.nickName = item.username;
      item.voiceLenth = item.timelong+'"'||'';
      if(_this.data.userId == item.userid){
        item.tag = 0;
      }else{
        item.tag = 1;
      }
      if(item.userid == _this.data.userId){
        item.isMe = 1;
        item.hronUrl = "../resouces/myicon/white_hornc.png";
      }else{
        item.isMe = 0;
        item.hronUrl = "../resouces/myicon/black_hornc.png";
      }
      data[len-1].userInfo.push(item);
    }

    let dealArray = () => {
      let obj = new Object();
      obj.time = item.uptime;
      obj.times = common.getNowDate(item.uptime);
      obj.userInfo = [];
      item.avatarUrl = item.userimg;
      item.nickName = item.username;
      item.voiceLenth = item.timelong+'"'||'';
      if(_this.data.userId == item.userid){
        item.tag = 0;
      }else{
        item.tag = 1;
      }
      if(item.userid == _this.data.userId){
        item.isMe = 1;
        item.hronUrl = "../resouces/myicon/white_hornc.png";
      }else{
        item.isMe = 0;
        item.hronUrl = "../resouces/myicon/black_hornc.png";
      }
      obj.userInfo.push(item);
      data.push(obj);
    }
    (len == 0 || theTime - data[len - 1].time > 60000) && dealArray();

    !(len == 0 || theTime - data[len - 1].time > 60000) && dealData();

    _this.setData({
      chatList:data
    })
  },
  downLoad_playVoice: function(){
    
    let _this = this;
    
    if(_this.msgArray.length > 0){
      
      let content = _this.msgArray.shift();
      let audio_id = content.data.id;
      
      WxService.downloadFile(content.data.id).then(res => {
         
          _this.isplaying = true;
          let playTime = (content.data.timelong + 1) * 1000 ;

          if(content.data.userid != _this.data.userId){
            wx.playVoice({
              filePath: res.tempFilePath
            })
          }else{
            playTime = 2000;
          }

          _this.voice_timer = setTimeout(function(){
              _this.downLoad_playVoice();
          },playTime)
      })
    }else{
      _this.isplaying = false;
    }
  },

  onHide:function(){
    // 页面隐藏

  },
  /**
   * 点击录音并且上传
   */
    touchStartEvent: function() {
    let _this = this;

    _this.startTime = new Date().getSeconds();
    WxService.startRecord().then(res => {
      console.log(res)
      let tempFilePath = res.tempFilePath;

      return WxService.saveFile(tempFilePath);
    }).then(res => {
      console.log(`saveFile`,res);
      let savedFilePath = res.savedFilePath;
      let userid =  _this.data.userId;
      let groupid = _this.data.groupId;
      let timelong = ((_this.endTime-_this.startTime)>=0)?(_this.endTime-_this.startTime):(60-_this.startTime+_this.endTime);
      if(timelong == 0){
        timelong = 1
      }
      WxService.upLoadFile(savedFilePath,userid,groupid,timelong);
    })

  },
  touchEndEvent: function() {
    let _this=this;
    wx.stopRecord();
    _this.endTime = new Date().getSeconds();
  },

  touchCancelEvent:function(){
    wx.stopRecord();
  },
  /**
   * 函数名：tapNotMeEvent
   * 作用：点击进行播放语音。
   */
  // tapNotMeEvent:function(res){
  //   // console.log(res);
  //   let _this=this;
  //   clearTimeout(_this.voice_timer);
    
  //   _this.msgArray = []
  //   let index = res.target.dataset.id;
  //   let index1,index2;
  //   if(index){
  //     index1 = index.split(".")[0];
  //     index2 = index.split(".")[1];
  //     _this.data.chatList[index1].userInfo[index2].tag = 0;
  //     data[index1].userInfo[index2].tag = 0;
  //   }else{
  //     return;
  //   }
  //   _this.setData({
  //     chatList:_this.data.chatList
  //   });
  //   for(let i=0;i<_this.data.chatList.length;i++){
  //     for(let j=0;j<_this.data.chatList[i].userInfo.length;j++){
  //       if(_this.data.chatList[i].userInfo[j].isMe){
  //         _this.data.chatList[i].userInfo[j].hronUrl="../resouces/myicon/white_hornc.png";
  //         data[i].userInfo[j].hronUrl="../resouces/myicon/white_hornc.png";
  //       }else{
  //         _this.data.chatList[i].userInfo[j].hronUrl="../resouces/myicon/black_hornc.png";
  //         data[i].userInfo[j].hronUrl="../resouces/myicon/black_hornc.png";
  //       }
  //     }
  //   }
  //   //进行audio音频播放，第一步，根据data中的id获取音频地址，然后放在audio中播放
  //   let audio_id=_this.data.chatList[index1].userInfo[index2].id;
  //   WxService.downloadFile(audio_id).then(res => {
  //     console.log(res);
  //     wx.playVoice({
  //       filePath: res.tempFilePath
  //     });
  //   });   
  //   tagList.push(_this.data.chatList[index1].userInfo[index2].uptime);
  //   _this.setData({
  //     chatList:_this.data.chatList
  //   });
  //   clearInterval(this.data.timer);
  //   let i=0;
  //   let tag="a";
    
  //   let time=parseInt(this.data.chatList[index1].userInfo[index2].voiceLenth);
  //   this.data.timer=setInterval(function(){
  //     i++;
  //     time-=0.5;
  //     if(i%3==1){
  //       tag='a';
  //     }else if(i%3==2){
  //       tag="b";
  //     }else{
  //       tag='c';
  //     }
  //     _this.data.chatList[index1].userInfo[index2].hronUrl="../resouces/myicon/black_horn"+tag+".png";
  //     data[index1].userInfo[index2].hronUrl="../resouces/myicon/black_horn"+tag+".png";
  //     _this.setData({
  //       chatList:_this.data.chatList
  //     });
  //     if(time<=0){
  //       clearInterval(_this.data.timer);
  //       _this.data.chatList[index1].userInfo[index2].hronUrl="../resouces/myicon/black_hornc.png";
  //       data[index1].userInfo[index2].hronUrl="../resouces/myicon/black_hornc.png";
  //       _this.setData({
  //         chatList:_this.data.chatList
  //       });
  //     }
  //   },500);
  // },
  tapNotMeEvent: function (res) {
    let _this = this;

    let index = res.target.dataset.id;
    let index1,index2;
    index && (index1 = index.split(".")[0]);
    index && (index2 = index.split(".")[1]);
    
    if(index){
      _this.data.chatList[index1].userInfo[index2].tag = 0
    }else{
      return
    }
    _this.data.chatList[index1].userInfo[index2].tag = 0
    _this.setData({
      chatList:_this.data.chatList
    })

    let audio_id=_this.data.chatList[index1].userInfo[index2].id;
    WxService.downloadFile(audio_id).then(res => {
      console.log(res);
      wx.playVoice({
        filePath: res.tempFilePath
      });
    });

    //处理图片动态效果
    _this.dealImage(index1,index2);
  },
  tapMeEvent: function(res) {
    let _this = this;

    let index = res.target.dataset.id;
    let index1,index2;
    index && (index1 = index.split(".")[0]);
    index && (index2 = index.split(".")[1]);
    
    if(index1 && index2){
      _this.data.chatList[index1].userInfo[index2].tag = 0
    }else{
      return
    }
    _this.data.chatList[index1].userInfo[index2].tag = 0
    _this.setData({
      chatList:_this.data.chatList
    })

    let audio_id=_this.data.chatList[index1].userInfo[index2].id;
    WxService.downloadFile(audio_id).then(res => {
      console.log(res);
      wx.playVoice({
        filePath: res.tempFilePath
      });
    });

    //处理图片动态效果
    _this.dealImage(index1,index2);
  },
  dealImage: function(index1,index2){
    let _this = this;
    for(let i=0;i<_this.data.chatList.length;i++){
      for(let j=0;j<_this.data.chatList[i].userInfo.length;j++){
        if(_this.data.chatList[i].userInfo[j].isMe){
          _this.data.chatList[i].userInfo[j].hronUrl="../resouces/myicon/white_hornc.png";
          data[i].userInfo[j].hronUrl="../resouces/myicon/white_hornc.png"
        }else{
          _this.data.chatList[i].userInfo[j].hronUrl="../resouces/myicon/black_hornc.png";
          data[i].userInfo[j].hronUrl="../resouces/myicon/black_hornc.png";
        }
      }
    }
    _this.setData({
      chatList:_this.data.chatList
    });
    clearInterval(_this.data.timer);
    let i=0;
    let tag="a";
    

    let time = parseInt(_this.data.chatList[index1].userInfo[index2].voiceLenth);
    _this.data.timer = setInterval(function(){
      i++;
      time-=0.5;
      if(i%3==1){
        tag='a';
      }else if(i%3==2){
        tag="b";
      }else{
        tag='c';
      }
      console.log(tag);
      if(_this.data.chatList[index1].userInfo[index2].isMe){
        
        _this.data.chatList[index1].userInfo[index2].hronUrl="../resouces/myicon/white_horn"+tag+".png";

        _this.setData({
          chatList:_this.data.chatList
        });
        if(time<=0){
          clearInterval(_this.data.timer);
          _this.data.chatList[index1].userInfo[index2].hronUrl="../resouces/myicon/white_hornc.png";
        
          _this.setData({
            chatList:_this.data.chatList
          });
        }
      }else{
        _this.data.chatList[index1].userInfo[index2].hronUrl="../resouces/myicon/black_horn"+tag+".png";
        
        _this.setData({
          chatList:_this.data.chatList
        });
        if(time<=0){
          clearInterval(_this.data.timer);
          _this.data.chatList[index1].userInfo[index2].hronUrl="../resouces/myicon/black_hornc.png";
          
          _this.setData({
            chatList:_this.data.chatList
          });
        }
      }
    },500);
  }
})
