// pages/destination/destination.js
const app = getApp();

const WxService = require(`../../service/WxService`);

const AppService = require(`../../service/AppService`);

const common = require(`../../utils/util`);

let markers;

let isShare = false;
/**
 * @todo:dataDeal function,两个错误undefined is not a object（theGroup.destName）2,Can not read Perperty 'destname' of undefined。
 * 
 * @todo：检查界面跳转，只有传递了相关参数，才能进行跳转。
 */
let controlsArray = [{
    id: 1,
    iconPath: '/pages/resouces/myicon/myposition.png',
    position: {
        left: 10,
        top: 20,
        width: 40,
        height: 40
    },
    clickable: true
}, {
    id: 2,
    iconPath: '/pages/resouces/myicon/allWatchBtn.png',
    position: {
        left: 10,
        top: 60,
        width: 40,
        height: 40
    },
    clickable: true
}];

Page({
  data:{
    arr:[1,2,3,4,5,6,7,8],
    userInfo:{},
    groupList:null,
    usersListTag: false,
    //上传坐标点之后得到的数据
    destination:``,
    mydistance:``,
    mytime:``,
    myspeed:``,
    my_isOver: 0,
    usersList:null,
    userNumber:0,
    //options传递参数
    isGroupHost:``,
    groupId:``,
    origin_lat:``,
    origin_lon:``,
    destlon:``,
    destlat:``,
    //第三版界面改版
    myborderColor: '#3c78ff',
    //地图
    longitude:116.415079,
    latitude: 40.088899,
    markers: [],
    includePoints:[{
      latitude: 23.099994,
      longitude: 113.324520
    },{
      latitude: 21.099994,
      longitude: 113.324520
    }],
    controls: [],
    polyline: [{
      points: [],
      color:"#FF0000DD",
      width: 100,
      dottedLine: false
    }],
    //speak
    voice_number: 0,
    color: "#f8f8f8"
  },
  onLoad:function(options){
    let _this = this;
    //options传递参数
    
    _this.setData({
      groupId: options.groupId,
      isGroupHost: options.isGroupHost,
      destlon: options.lon,
      destlat: options.lat,
      controls: controlsArray,
    })
   
    options.isShare && AppService.getUserInfo().then((res) => {
      
      
      if(res.statusCode == 200){
        isShare = true;
        _this.setData({
            userInfo: res.data.user,
            groupList: res.data.groupList,
        });
        return _this.getRoute();
      }
    }).then(res => {
      //表示加群之后，重新获取用户信息，主要获取群列表信息
      return AppService.getUserInfo();
      
    }).then(res => {
      if (res.statusCode == 200) {
        _this.setData({
          userInfo: res.data.user,
          groupList: res.data.groupList,
        });
      }
      _this.dataDeal();
    });

    !options.isShare && AppService.getUserInfo().then(res => {
      console.log('get USer info',res);
      if(res.statusCode == 200){
        _this.setData({
            userInfo: res.data.user,
            groupList: res.data.groupList,
        });
      }
      
    }).then(res => {
      
      _this.dataDeal();
    }).catch(error => {
      console.log(error);
    });

    

    //语音通道的建立
    AppService.connectVoice();
  },
  onReady:function(){
    
  },
  onShow:function(){
    let _this = this;
    
    //缓存读取是否第一次使用
    let isFirst = wx.getStorageSync('isFirst');
    
    if(isFirst !== false){
      WxService.showModal(`温馨提示`,`点击右上角的分享图标可以分享您的目的地给好友哦！`,false,() => {
        wx.setStorageSync('isFirst', false);
      })
    }
    //onmessage()监听数据。
    _this.onmessage();

    _this.socketCatch();
  },
  /**
   * @function socketCatch
   * 当socket出现异常关闭的情况或者错误的情况，就重新连接socket。
   */
  socketCatch: function(){
    let _this = this;
    wx.onSocketError(res => {
      
      setTimeout(() => {
        !_this.isUnLoad && AppService.connectVoice();
      },1000)
    });
    wx.onSocketClose(res => {
     
      setTimeout(() => {
        !_this.isUnLoad && AppService.connectVoice();
      },1000)
    })
  },
  onHide:function(){
    
  },
  /**
   * @function onUnload
   * 页面生命周期函数，在页面卸载时，清除定时器。
   */
  onUnload:function(){
    let _this = this;
    _this.isUnLoad = true;
    clearInterval(_this.timer_10);
    clearInterval(_this.timer_60);
    wx.closeSocket();
  },
  /**
   * 处理数据
   * 直接通过群组id获取用户信息列表
   * @param groupid-群id
   */
  
  dataDeal: function(){
    let _this = this;

    let theGroup = _this.data.groupList.find(item => item.groupId == _this.data.groupId)
    console.log(_this.data.groupList);
    console.log(_this.data.groupId);
    theGroup && _this.setData({
        destination: theGroup.destName
    });
    theGroup && wx.setNavigationBarTitle({
        title: theGroup.groupName
    });
    _this.getRoute();
    _this.timer_60 = setInterval(_this.reGetRoute,60000);
    _this.timer_10 = setInterval(_this.getLocation,10000);
  },
  /**
   * 第一次画路线
   */
  getRoute: function(){
    WxService.showLoading()
    let _this = this;
    WxService.getLocation().then(res => {
      
      _this.setData({
        origin_lat:res.latitude,
        origin_lon:res.longitude
      });

      let [lat,lon,destlon,destlat,groupid] = [res.latitude,res.longitude,_this.data.destlon,_this.data.destlat,_this.data.groupId];
      console.log('第一次画线', lat, lon, destlon, destlat, groupid);
      AppService.nav({
        lat: lat,
        lon: lon,
        destlon: destlon,
        destlat: destlat,
        groupid: groupid,
        userid: _this.data.userInfo.userId
      }).then(res => {
        
        let data = res.data.data.routelatlon;
        _this.dealRouteData(data);
        WxService.hideLoading();
        markers = _this.data.markers;
        //上传坐标点
        _this.getLocation();
      }).catch(err => {
        console.log('未获取路况信息')
      })
     
      
    }).catch(error => {
      console.log(error);
      wx.showToast({
        title: '您可能未打开定位信息！',
        icon: 'loading',
        duration: 2000
      })
    })
  },
  /**
   * @function reGetRoute
   * 调用导航，获取坐标点串，然后调用dealRouteData()把坐标点串描绘在地图上。
   */
  reGetRoute: function(){
    let _this = this;
    
    WxService.getLocation().then(res => {
      console.log(res);
      let [lat,lon,destlon,destlat,groupid] = [res.latitude,res.longitude,_this.data.destlon,_this.data.destlat,_this.data.groupId];
      console.log('每60s重新算路',lat,lon,destlon,destlat,groupid);
      
      AppService.nav({
        lat: lat,
        lon: lon,
        destlon: destlon,
        destlat: destlat,
        groupid: groupid
      }).then(res => {
        console.log(res);
        let data = res.data.data.routelatlon;
        _this.dealRouteData(data);
      }).catch(err => {
        console.log('未获取路况信息')
      })
      
      
    }).catch(error => {
      console.log(error);
      wx.showToast({
        title: '您可能未打开定位信息！',
        icon: 'loading',
        duration: 2000
      })
    })
  },
  /**
   * 处理数据
   * 把字符串坐标点处理之后画到地图上
   * @param data-坐标点串
   * @where 在函数getRoute()和reGetRoute()中引用。
   */
  dealRouteData: function(data){
    let _this = this;

    let array = data.split(";");
      
    array = array.map(item => {
      return {
        longitude: Number(item.split(",")[0]),
        latitude: Number(item.split(",")[1])
      }
    });
    array.pop();

    _this.setData({
        polyline: [{
            points: array,
            color: "#3c78ffDD",
            width: 6,
            dottedLine: false
        }],
        latitude: array[0].latitude,
        longitude: array[0].longitude,
        markers: [{
            iconPath: '../resouces/myicon/poi_start.png',
            id: 0,
            latitude: array[0].latitude,
            longitude: array[0].longitude,
            width: 30,
            height: 40
        }, {
            iconPath: "../resouces/myicon/poi_end.png",
            id: 0,
            latitude: array[array.length - 1].latitude,
            longitude: array[array.length - 1].longitude,
            width: 30,
            height: 40
        }],
    });
  },
  /**
   * getLocation()获取当前位置并上传坐标点
   * @param 
   */
  getLocation: function(){
    let _this = this;
    let longitude,latitude,speed;
    WxService.getLocation().then(res => {
      console.log(`getLocation-----`,res);
      longitude = res.longitude;
      latitude = res.latitude;
      //console.log(typeof res.speed == `undefined`);
      speed = (typeof res.speed == `undefined`||parseInt(res.speed) < 0)? 0 : parseInt(res.speed)*3.6;
      console.log(`wx接口获取`,longitude,latitude,speed);
    }).then(res =>{
      console.log(`upLoadLonlat准备上传的数据`,longitude,latitude,speed);
      _this.updateLocation(longitude,latitude,speed);
    })
  },
  /**
   * updateLocation()上传坐标点
   * @param （longitude，latitude，speed）经纬度和速度
   */
  updateLocation: function(longitude,latitude,speed){
    let _this = this;
    
    AppService.upLoadLonlat({
      groupid: _this.data.groupId,
      lon: longitude,
      lat: latitude,
      speed: speed,
      userid: _this.data.userInfo.userId
    }).then(res => {
      
      console.log(`updateLocation返回数据`,res)
      !_this.data.destination && AppService.getUserInfo().then(res => {
        if(res.statusCode == 200){
          _this.setData({
            userInfo: res.data.user,
            groupList: res.data.groupList,
          });
        }
        let theGroup = _this.data.groupList.find(item => item.groupId == _this.data.groupId)
       
        theGroup && _this.setData({
            destination: theGroup.destName
        });
      })
      let users = res.data.data;
      _this.users = res.data.data;
      let personNumber = users.length;
      _this.setData({
          groupName: res.data.groupname
      });
      wx.setNavigationBarTitle({ title: res.data.groupname + "(" + personNumber+"人)"});
      //console.log('users', users);

      users.map((item,i) => {
        item.index = i;
        item.avatar_url = `../resouces/voice/avatar_tag${i+1}.png`;
      })
      //console.log(`users`,users);
      let mySelf = users.find(item => item.userId == _this.data.userInfo.userId);
      console.log(`mySelf`,mySelf);
      if (mySelf) {
          dealMySelf();
      }


      users = users.filter(item => item.userId != _this.data.userInfo.userId && item.userName != null);
      if(users){
        dealUsers();
      }
      function dealMySelf(){
        _this.setData({
              mydistance: mySelf.distanceSurplus.toFixed(1),
              mytime: (parseInt(mySelf.surplusTime / 60/60) < 1)?parseInt(mySelf.surplusTime / 60) + "分钟":parseInt(mySelf.surplusTime / 60/60) + "小时" + parseInt(mySelf.surplusTime / 60%60) + "分钟",
              myspeed: parseInt(mySelf.speed),
              my_tag_url: `../resouces/voice/avatar_tag${mySelf.index+1}.png`,
              my_isOver: mySelf.isOver
          });
          if (mySelf.isOver) {
              WxService.navigateTo(`../successes/successes?groupId=${_this.data.groupId}&userId=${_this.data.userInfo.userId}&lat=${_this.data.my_lat}&lon=${_this.data.my_lon}&deslon=${_this.data.destlon}&deslat=${_this.data.destlat}&destination=${_this.data.destination}`,() => {
                clearInterval(_this.timer_10);
              });
          }
      }

      //users处理
     
      function dealUsers(){
        let userMarkers = [].concat(_this.data.markers.slice(0, 2));
        users.forEach((item, i) => {
            userMarkers.push({
                iconPath: `/pages/resouces/voice/poi${item.index + 1}.png`,
                id: i,
                latitude: item.lat,
                longitude: item.lon,
                width: 30,
                height: 40,
                marker_tag: i
            });
            item.distanceSurplus = item.distanceSurplus.toFixed(1);
            item.updateTime = common.getNowDate(item.updateTime);
            item.surplusTime = (parseInt(item.surplusTime / 60/60) < 1)?parseInt(item.surplusTime / 60) + "分钟":parseInt(item.surplusTime / 60/60) + "小时" + parseInt(item.surplusTime / 60%60) + "分钟";

            if (item.speed) {
                item.speed = parseInt(item.speed);
            }
            if (item.speed < 0) {
                item.speed = 0;
            }
        });
        _this.setData({
            markers: userMarkers,
            usersList: users,
            userNumber:users.length + 1
        });
      }
   
    }).catch(error => {
      common.dealCatch(function(){
        WxService.hideLoading();
        WxService.showModal('温馨提示','此群已解散',false,function(){
          wx.navigateBack({
            delta: 5
          })
        });
      },function(){
        wx.showToast({
          title: '路线计算失败，请检网络后重试！',
          icon: 'loading',
          duration: 2000
        })
      });
    });
  },
  onmessage: function(){
    let _this = this;

    _this.socketMsgQueue = _this.socketMsgQueue || [];

    wx.onSocketMessage(function(res) {

      let content=JSON.parse(res.data);
      console.log(content);
      if(content.status==200&&(_this.data.groupId == content.data.groupid)){
      
        console.log(`content`,content);

        _this.socketMsgQueue.push(content);
        console.log(' _this.socketMsgQueue',_this.socketMsgQueue.length);
        if(app.globalData.isAutoPlay){
          _this.playVoice();
        }else{
          (content.data.userid != _this.data.userInfo.userId) && (_this.data.voice_number=parseInt(_this.data.voice_number)+1);
          (content.data.userid != _this.data.userInfo.userId) && (_this.data.voice_number <= 99) && _this.setData({
            voice_number:_this.data.voice_number
          })
          (content.data.userid != _this.data.userInfo.userId) && (_this.data.voice_number > 99) && _this.setData({
            voice_number: "99+"
          })
          
        }
      }
    });
  },
  playVoice: function(){
    var _this = this;
    // _this.isPlaying = false;
    function playFor(){
      console.log('start playing', _this.socketMsgQueue.length);
      if(_this.socketMsgQueue.length > 0){
          console.log('start playing');
          play(_this.socketMsgQueue.shift(), playFor);
      }else{
        _this.isPlaying = false;
      }
    }
    
    function playEnd(next){
      console.log('start playing end');
      _this.isPlaying = false;
      controlsArray.length = 2;
      _this.setData({
        controls: controlsArray
      });
      next && next();
    }

    function play(content, next){
      console.log('start playing ',content);
      _this.isPlaying = true;
      WxService.downloadFile(content.data.id).then(res => {
        console.log(res);
        ceaterMarker(content);

        let playTime = (content.data.timelong + 1) * 1000 ;

        if(content.data.userid != _this.data.userInfo.userId){
          wx.playVoice({
            filePath: res.tempFilePath
          })
        }else{
          playTime = 2000;
        }

        setTimeout(function(){
            playEnd(next);
        },playTime)
      })
    }

    !_this.isPlaying && playFor();


    function ceaterMarker(content){
      console.log(`执行了相关Markders`)
      let users = _this.users;
      let theUserIndex = users.findIndex((item) => item.userId == content.data.userid);
      let obj = {
          id: 3,
          iconPath: `/pages/resouces/voice/speak${theUserIndex+1}.png`,
          position: {
              left: AppService.systemInfo.windowWidth - 60,
              top: 20,
              width: 50,
              height: 50
          },
          clickable: false
      }
      controlsArray.length = 2;
      controlsArray.push(obj);
      console.log(`controlsArray`,controlsArray);
      _this.setData({
        controls: controlsArray
      });
    }

  },
  changeEvent: function(){
    let _this = this;
    this.setData({
      usersListTag:!_this.data.usersListTag
    })
  },
  controlsEvent: function(res){
    console.log(res);
    let _this = this;
    if(res.controlId == 1){
      _this.mapCtx = wx.createMapContext('map');
      _this.mapCtx.getCenterLocation({
        success: function(res){
          
        }
      });
      _this.mapCtx.moveToLocation()
    }
    if(res.controlId == 2){
      this.setData({
        include_markers: _this.data.markers
      })
    }
  },
  setEvent: function(){
    let _this = this;
    
    WxService.navigateTo(`../setpage/setpage?groupId=${_this.data.groupId}&groupName=${_this.data.groupName}&isGroupHost=${_this.data.isGroupHost}`);
  },
  chatEvent: function(){
    let _this = this;
    _this.setData({
      voice_number: 0
    })
    WxService.navigateTo(`../chat/chat?groupId=${_this.data.groupId}&groupName=${_this.data.groupName}&isGroupHost=${_this.data.isGroupHost}`);
  },
  selfEvent: function(){
    this.setData({
      myborderColor:'#3c78ff',
      checkIndex: ''
    });
  },
  usersItemEvent: function(e){
    let index = 1;
    this.setData({
      myborderColor: '#cccccc',
      checkIndex: index
    });
  },
  //上传语音相关
  touchStartEvent: function() {
    let _this = this;
    _this.setData({
      color: "#aaaaaa"
    })
    _this.startTime = new Date().getSeconds();
    WxService.startRecord().then(res => {
      console.log(res)
      let tempFilePath = res.tempFilePath;

      return WxService.saveFile(tempFilePath);
    }).then(res => {
      console.log(`saveFile`,res);
      let savedFilePath = res.savedFilePath;
      let userid =  _this.data.userInfo.userId;
      let groupid = _this.data.groupId;
      let timelong = ((_this.endTime-_this.startTime)>=0)?(_this.endTime-_this.startTime):(60-_this.startTime+_this.endTime);

      console.log(`上传的各种数据`,userid,groupid)
      WxService.upLoadFile(savedFilePath,userid,groupid,timelong);
    })

  },
  touchEndEvent: function() {
    let _this=this;
    _this.setData({
      color: "#f8f8f8"
    })
    wx.stopRecord();
    _this.endTime = new Date().getSeconds();
  },

  touchCancelEvent:function(){
    wx.stopRecord();
  },
  onShareAppMessage: function () {
    let _this=this;
    let lat = this.data.destlat;
    let lon = this.data.destlon;
    return {
      title: `群组分享`,
      desc: `图吧是技术最好的地图导航类技术企业`,
      path: `/pages/destination/destination?groupId=${this.data.groupId}&isGroupHost=false&lat=${lat}&lon=${lon}&isShare=true`,
    }
  },
})