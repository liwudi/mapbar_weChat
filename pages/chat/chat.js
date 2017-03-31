var data = [];
var socketOpen = false;
var startTime;
var endTime;
var common = require('../../utils/util.js');
const app = getApp();
let config = require(`../../utils/config`);
let service = require(`../../utils/service`);

let tagList;

Page({
  data: {
    userId:"",
    userInfo:null,
    groupId:"",
    //chat列表相关数据
    chatList:[],
    socketMsgQueue:[],
    tempFilePath:"",//记录自己每次说话的语音地址
    timer:0,
    time:'',
    startTime:'',
    endTime:"",
    pageIndex:1,
  },
  /**
   * 函数名：onload
   * 作用：初始化聊天数据列表，并且建立socket连接。
   */
  onLoad:function(options){
  
    if(!tagList){
      tagList = [];
    }
    
    var _this=this;
    _this.msgArray = [];
    data=[];
    this.setData({
      chatList:data,
      groupId:options.groupId
    });
    service.getUserInfo().then(res => {
      
      _this.setData({
        userInfo:res.userInfo,
        userId:res.user.userId,
      });

      if(res.user.openStatus==null){
        _this.setData({
          isFirst:false
        });
      }

      return service.get(
        `${app.globalData.voice_url}/voiceByGroup?groupid=${options.groupId}&pageSize=50&pageIndex=${_this.data.pageIndex}`,
        {}
      )
    }).then(res => {
      console.log(`getInitailData`,res);
      var voice_array=res.data.reverse();
        
      var voice_length=res.data.length;
      if(voice_length){
        
        var length=options.voice_number;//这个代表options.voice_length;
        if(voice_array.length>length){
          for(var i=0;i<voice_array.length;i++){
            //这里对每一条数据进行加工
            var len=data.length;
            var content=voice_array[i];
            var this_time=content.uptime;
            
            if(data[len-1]){//如果data数组中的最后一个数据存在
              
              if(this_time-data[len-1].time<=60000){//当前时间与最后一个时间作比较如果小于60秒
                content.avatarUrl=content.userimg||"../resouces/myicon/userImg.png";
                content.nickName=content.username||"";
                content.voiceLenth=content.timelong+'"'||'';
                if(_this.data.userId==content.userid){
                  content.tag=0;
                }else{
                  content.tag=1;
                  if(tagList.includes(this_time)){
                    content.tag=0;
                  }
                }
                if(content.userid==_this.data.userId){
                  content.isMe=1;
                  content.hronUrl="../resouces/myicon/white_hornc.png";
                }else{
                  content.isMe=0;
                  content.hronUrl="../resouces/myicon/black_hornc.png";
                }
                data[len-1].userInfo.push(content);
              }else{
                var obj=new Object();
                obj.time=this_time;
                obj.times=common.getNowDate(this_time);
                obj.userInfo=[];
                content.avatarUrl=content.userimg||"../resouces/myicon/userImg.png";
                content.nickName=content.username||"用户名";
                content.voiceLenth=content.timelong+'"'||'';
                if(_this.data.userId==content.userid){
                  content.tag=0;
                }else{
                  content.tag=1;
                  if(tagList.includes(this_time)){
                    content.tag=0;
                  }
                }
                if(content.userid==_this.data.userId){
                  content.isMe=1;
                  content.hronUrl="../resouces/myicon/white_hornc.png";
                }else{
                  content.isMe=0;
                  content.hronUrl="../resouces/myicon/black_hornc.png";
                }
                obj.userInfo.push(content);
                data.push(obj);
              }
            }else{
              
              var obj=new Object();
              obj.time=this_time;
              obj.times=common.getNowDate(this_time);
              obj.userInfo=[];
              content.avatarUrl=content.userimg||"../resouces/myicon/userImg.png";
              content.nickName=content.username||"";
              content.voiceLenth=content.timelong+'"'||'';
              if(_this.data.userId==content.userid){
                  content.tag=0;
                }else{
                  content.tag=1;
                  if(tagList.includes(this_time)){
                    content.tag=0;
                  }
                }
              if(content.userid==_this.data.userId){
                content.isMe=1;
                content.hronUrl="../resouces/myicon/white_hornc.png";
              }else{
                content.isMe=0;
                content.hronUrl="../resouces/myicon/black_hornc.png";
              }
              obj.userInfo.push(content);
              data.push(obj);
            }
            
            _this.setData({
              chatList:data,
              
            }); 

          }

        }
      }
    })
  },
  onReady: function (e) {
    
  },
  
  onShow:function(){
    var _this=this;
    
    onmessage();
    function onmessage(){
      wx.onSocketMessage(function(res){
        console.log(`getSocketMessage`,res);

        var content = JSON.parse(res.data);
      

        if(content.status==200){
            console.log(content);
            
            
            let dealData = content.data;

            

            if(content.data.userid != _this.data.userId){
              _this.msgArray.push(content);
            }
            if(app.globalData.isAutoPlay){
              (!_this.isplaying) && _this.downLoad_playVoice();
            }else{
              _this.msgArray = []
            }
            
            _this.dealOnMessageData(dealData);
            
        }
      });
    }
  },



  
  downLoad_playVoice: function(){
    
    let _this = this;
    
    if(_this.msgArray.length > 0){
      
      let content = _this.msgArray.shift();
      let audio_id = content.data.id;
      
      service.downloadFile(content.data.id).then(res => {
         
          _this.isplaying = true;
          let playTime = (content.data.timelong + 1) * 1000 ;

          if(content.data.userid != _this.data.userId){
            wx.playVoice({
              filePath: res.tempFilePath
            })
          }else{
            playTime = 2000;
          }

          _this.voice_timer=setTimeout(function(){
              _this.downLoad_playVoice();
          },playTime)
      })
    }else{
      _this.isplaying = false;
    }
  },









  dealOnMessageData: function(dealData){
    var this_time=dealData.uptime;

    var len=data.length;
    let _this = this;
    if(data[len-1]){
      if(this_time-data[len-1].time<=60000){
        dealData.avatarUrl = dealData.userimg||"../resouces/image/userImg.png";
        dealData.nickName = dealData.username||"";
        dealData.voiceLenth = dealData.timelong+'"'||'';
        if(_this.data.userId== dealData.userid){
          dealData.tag=0;
        }else{
          dealData.tag=1;
        }
        if(dealData.userid==_this.data.userId){
          dealData.isMe=1;
          dealData.hronUrl="../resouces/myicon/white_hornc.png";
        }else{
          dealData.isMe=0;
          dealData.hronUrl="../resouces/myicon/black_hornc.png";
        }
        data[len-1].userInfo.push(dealData);
      }else{
        var obj=new Object();
        obj.time=this_time;
        obj.times=common.getNowDate(this_time);
        obj.userInfo=[];
        dealData.avatarUrl = dealData.userimg||"../resouces/image/userImg.png";
        dealData.nickName = dealData.username||"用户名";
        dealData.voiceLenth=dealData.timelong+'"'||'';
        if(_this.data.userId == dealData.userid){
          dealData.tag=0;
        }else{
          dealData.tag=1;
        }
        if(dealData.userid==_this.data.userId){
          dealData.isMe=1;
          dealData.hronUrl="../resouces/myicon/white_hornc.png";
        }else{
          dealData.isMe=0;
          dealData.hronUrl="../resouces/myicon/black_hornc.png";
        }
        obj.userInfo.push(dealData);
        data.push(obj);
      }
    }else{
      var obj=new Object();
      obj.time=this_time;
      obj.times=common.getNowDate(this_time);
      obj.userInfo=[];
      dealData.avatarUrl=dealData.userimg||"../resouces/image/userImg.png";
      dealData.nickName=dealData.username||"";
      dealData.voiceLenth=dealData.timelong+'"'||'';
      if(_this.data.userId==dealData.userid){
          dealData.tag=0;
        }else{
          dealData.tag=1;
        }
      if(dealData.userid==_this.data.userId){
        dealData.isMe=1;
        dealData.hronUrl="../resouces/myicon/white_hornc.png";
      }else{
        dealData.isMe=0;
        dealData.hronUrl="../resouces/myicon/black_hornc.png";
      }
      obj.userInfo.push(dealData);
      data.push(obj);
    }
    _this.setData({
      chatList:data
    });
  },
  onHide:function(){
    // 页面隐藏

  },
  /**
   * 点击录音并且上传
   */
  touchStartEvent:function(){
    var _this=this;
    startTime=new Date().getSeconds();
    console.log("touchStart");
    wx.startRecord({
      success: function(res) {
        console.log("录音了！")
        var tempFilePath = res.tempFilePath;//返回的一个录音地址
        _this.setData({
          tempFilePath:tempFilePath
        });
        wx.saveFile({
          tempFilePath: _this.data.tempFilePath,
          success: function(res){
            console.log("saved");
            var time=((endTime-startTime)>=0)?(endTime-startTime):(60-startTime+endTime);
            var savedFilePath = res.savedFilePath;
            wx.uploadFile({
              url: app.globalData.voice_url+'/voiceUp',//上传语音文件的服务器地址
              filePath: savedFilePath,
              name:'content',
              // header: {}, // 设置请求的 header
              formData: {
                userid: _this.data.userId,
                groupid:_this.data.groupId,
                timelong: time
              }, 
              success: function(res){
                console.log("上传语音成功");
              }
            });
          }
        });     
      }
    });
  },
  touchEndEvent:function(){
    var _this=this;
    wx.stopRecord();
    endTime=new Date().getSeconds();
    console.log("end");
  },
  touchCancelEvent:function(){
    wx.stopRecord();
  },
  /**
   * 函数名：tapNotMeEvent
   * 作用：点击进行播放语音。
   */
  tapNotMeEvent:function(res){
    // console.log(res);
    var _this=this;
    clearTimeout(_this.voice_timer);
    
    _this.msgArray = []
    var index = res.target.dataset.id;
    var index1,index2;
    if(index){
      index1 = index.split(".")[0];
      index2 = index.split(".")[1];
      _this.data.chatList[index1].userInfo[index2].tag = 0;
      data[index1].userInfo[index2].tag = 0;
    }else{
      return;
    }
    _this.setData({
      chatList:_this.data.chatList
    });
    for(var i=0;i<_this.data.chatList.length;i++){
      for(var j=0;j<_this.data.chatList[i].userInfo.length;j++){
        if(_this.data.chatList[i].userInfo[j].isMe){
          _this.data.chatList[i].userInfo[j].hronUrl="../resouces/myicon/white_hornc.png";
          data[i].userInfo[j].hronUrl="../resouces/myicon/white_hornc.png";
        }else{
          _this.data.chatList[i].userInfo[j].hronUrl="../resouces/myicon/black_hornc.png";
          data[i].userInfo[j].hronUrl="../resouces/myicon/black_hornc.png";
        }
      }
    }
    //进行audio音频播放，第一步，根据data中的id获取音频地址，然后放在audio中播放
    var audio_id=_this.data.chatList[index1].userInfo[index2].id;
    console.log(`time`,_this.data.chatList[index1].userInfo[index2].uptime);
    tagList.push(_this.data.chatList[index1].userInfo[index2].uptime);
    wx.downloadFile({
      url: app.globalData.voice_url+'/voiceById?id='+audio_id, 
      success: function(res){
        wx.playVoice({
          filePath: res.tempFilePath
        });
      }
    });
    _this.setData({
      chatList:_this.data.chatList
    });
    clearInterval(this.data.timer);
    var i=0;
    var tag="a";
    var _this=this;
    var time=parseInt(this.data.chatList[index1].userInfo[index2].voiceLenth);
    this.data.timer=setInterval(function(){
      i++;
      time-=0.5;
      if(i%3==1){
        tag='a';
      }else if(i%3==2){
        tag="b";
      }else{
        tag='c';
      }
      _this.data.chatList[index1].userInfo[index2].hronUrl="../resouces/myicon/black_horn"+tag+".png";
      data[index1].userInfo[index2].hronUrl="../resouces/myicon/black_horn"+tag+".png";
      _this.setData({
        chatList:_this.data.chatList
      });
      if(time<=0){
        clearInterval(_this.data.timer);
        _this.data.chatList[index1].userInfo[index2].hronUrl="../resouces/myicon/black_hornc.png";
        data[index1].userInfo[index2].hronUrl="../resouces/myicon/black_hornc.png";
        _this.setData({
          chatList:_this.data.chatList
        });
      }
    },500);
  },


  tapMeEvent:function(res){
    var _this=this;
    clearTimeout(_this.voice_timer);
    _this.msgArray = []
    
    console.log(res.target.dataset.id);
    var index = res.target.dataset.id;
    var index1,index2;
    if(index){
      index1 = index.split(".")[0];
      index2 = index.split(".")[1];
      data[index1].userInfo[index2].tag = 0
      _this.data.chatList[index1].userInfo[index2].tag = 0;//tag标记已读！
      data[index1].userInfo[index2].tag = 0;
    }else{
      return;
    }
    _this.setData({
      chatList:_this.data.chatList
    });
    var audio_id=_this.data.chatList[index1].userInfo[index2].id;
    console.log("我的audio_id",audio_id);
    wx.downloadFile({
      url: app.globalData.voice_url+'/voiceById?id='+audio_id, 
      success: function(res) {
        wx.playVoice({
          filePath: res.tempFilePath
        });
      }
    });
    for(var i=0;i<_this.data.chatList.length;i++){
      for(var j=0;j<_this.data.chatList[i].userInfo.length;j++){
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
    
    var i=0;
    var tag="a";
    var _this=this;

    var time=parseInt(this.data.chatList[index1].userInfo[index2].voiceLenth);
    _this.data.timer=setInterval(function(){
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
      _this.data.chatList[index1].userInfo[index2].hronUrl="../resouces/myicon/white_horn"+tag+".png";
      data[index1].userInfo[index2].hronUrl="../resouces/myicon/white_horn"+tag+".png";
      _this.setData({
        chatList:_this.data.chatList
      });
      if(time<=0){
        clearInterval(_this.data.timer);
        _this.data.chatList[index1].userInfo[index2].hronUrl="../resouces/myicon/white_hornc.png";
        data[index1].userInfo[index2].hronUrl="../resouces/myicon/white_hornc.png";
        _this.setData({
          chatList:_this.data.chatList
        });
      }
    },500);
  }
})
