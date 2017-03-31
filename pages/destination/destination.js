// pages/destination/destination.js
const app = getApp();

const WxService = require(`../../service/WxService`);

const AppService = require(`../../service/AppService`);

const common = require(`../../utils/util`);

let markers;

let isShare = false;

let controlsArray = [{
    id: 1,
    iconPath: '/pages/resouces/myicon/myposition.png',
    position: {
        left: AppService.systemInfo.windowWidth - 60,
        top: 20,
        width: 40,
        height: 40
    },
    clickable: true
}, {
    id: 2,
    iconPath: '/pages/resouces/myicon/allWatchBtn.png',
    position: {
        left: AppService.systemInfo.windowWidth - 60,
        top: 60,
        width: 40,
        height: 40
    },
    clickable: true
}];

Page({
  data:{
    userInfo:{},
    groupList:null,
    usersListTag: false,
    //上传坐标点之后得到的数据
    destination:``,
    mydistance:``,
    mytime:``,
    myspeed:``,
    usersList:null,
    //options传递参数
    isGroupHost:``,
    groupId:``,
    origin_lat:``,
    origin_lon:``,
    destlon:``,
    destlat:``,
    pastTime:``,
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
  },
  onLoad:function(options){
    let _this = this;
    //options传递参数
    console.log(options);
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

        WxService.getLocation().then(res => {
          let [longitude,latitude,speed] = [res.longitude,res.latitude,(res.speed == -1||undefined)?0:res.speed];
          _this.updateLocation(longitude,latitude,speed); 
        })
      }
    });

    !isShare && AppService.getUserInfo().then(res => {
      console.log(`getUserInfo11`,res);
      if(res.statusCode == 200){
        _this.setData({
            userInfo: res.data.user,
            groupList: res.data.groupList,
        });
      }
      _this.dataDeal();
    }).catch(error => {
      console.log(error);
    });

    isShare && _this.dataDeal()
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
  socketCatch: function(){
    let _this = this;
    wx.onSocketError(res => {
      console.log('WebSocket连接打开失败，请检查！');
      setTimeout(() => {
        !_this.isUnLoad && service.connectToVoice(_this.data.userId);
      },1000)
    });
    wx.onSocketClose(res => {
      console.log('WebSocket 已关闭！');
      setTimeout(() => {
        !_this.isUnLoad && service.connectToVoice(_this.data.userId);
      },1000)
    })
  },
  onHide:function(){
    
  },
  onUnload:function(){
    let _this = this;
    _this.isUnLoad = true;
    clearInterval(_this.timer_10);
    clearInterval(_this.timer_60);
    wx.closeSocket();
  },
  dataDeal: function(){
    let _this = this;

    let theGroup = _this.data.groupList.find(item => item.groupId == _this.data.groupId)
    
    _this.setData({
        destination: theGroup.destName
    });
    wx.setNavigationBarTitle({
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
    let _this = this;
    WxService.getLocation().then(res => {
      //console.log(res);
      _this.setData({
        origin_lat:res.latitude,
        origin_lon:res.longitude
      });
      let [lat,lon,destlon,destlat,groupid] = [res.latitude,res.longitude,_this.data.destlon,_this.data.destlat,_this.data.groupId];
      console.log(lat,lon,destlon,destlat,groupid);
      AppService.nav({
        lat:lat,
        lon:lon,
        destlon:destlon,
        destlat:destlat,
        groupid:groupid
      }).then(res => {
        //console.log(res);
        let data = res.data.data.routelatlon;
        _this.dealRouteData(data);
         markers = _this.data.markers;
         //上传坐标点
         _this.getLocation();
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
   * 每60s重新算路
   */
  reGetRoute: function(){
    let _this = this;
    
    WxService.getLocation().then(res => {
      //console.log(res);
      let [lat,lon,destlon,destlat,groupid] = [res.latitude,res.longitude,_this.data.destlon,_this.data.destlat,_this.data.groupId];
      //console.log(lat,lon,destlon,destlat,groupid);
      AppService.nav({
        lat:lat,
        lon:lon,
        destlon:destlon,
        destlat:destlat,
        groupid:groupid
      }).then(res => {
        //console.log(res);
        let data = res.data.data.routelatlon;
        _this.dealRouteData(data);
      })
    }).catch(error => {
      //console.log(error);
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
      //console.log(`getLocation-----`,res);
      longitude = res.longitude;
      latitude = res.latitude;
      speed = (res.speed == -1||`undefined`)?0:res.speed;
      
    }).then(res =>{
  
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
      speed: speed
    }).then(res => {
      
      let users = res.data.data;
      _this.users = res.data.data;
      _this.setData({
          groupName: res.data.groupname
      });
      wx.setNavigationBarTitle({title: res.data.groupname});
      //console.log('users', users);

      users.map((item,i) => {
        item.index = i;
        item.avatar_url = `../resouces/voice/avatar_tag${i+1}.png`;
      })
      //console.log(`users`,users);
      let mySelf = users.find(item => item.userId == _this.data.userInfo.userId);
      console.log('myself', mySelf);
      if (mySelf) {
          dealMySelf();
      }


      users = users.filter(item => item.userId != _this.data.userInfo.userId);
      if(users){
        dealUsers();
      }
      function dealMySelf(){
        _this.setData({
              mydistance: mySelf.distanceSurplus,
              mytime: parseInt(mySelf.surplusTime / 60),
              myspeed: parseInt(mySelf.speed),
              my_tag_url: `../resouces/voice/avatar_tag${mySelf.index+1}.png`
          });
          if (mySelf.isOver) {
              WxService.navigateTo(`../successes/successes?groupId=${_this.data.groupId}&userId=${_this.data.userInfo.userId}&lat=${_this.data.my_lat}&lon=${_this.data.my_lon}&deslon=${_this.data.destlon}&deslat=${_this.data.destlat}&destination={_this.data.destination}&pastTime=${_this.data.pastTime}`,() => {
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

            item.updateTime = common.getNowDate(item.updateTime);
            item.surplusTime = parseInt(item.surplusTime / 60);

            if (item.speed) {
                item.speed = parseInt(item.speed);
            }
            if (item.speed < 0) {
                item.speed = 0;
            }
        });
        _this.setData({
            markers: userMarkers,
            usersList: users
        });
      }
   
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
          _this.data.voice_number++;
          _this.setData({
            voice_number:_this.data.voice_number
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
      service.downloadFile(content.data.id).then(res => {
        console.log(res);
        ceaterMarker(content);

        let playTime = (content.data.timelong + 1) * 1000 ;

        if(content.data.userid != _this.data.userId){
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
      let users = _this.users;
      let theUserIndex = users.findIndex((item) => item.userId == content.data.userid);
      let obj = {
          id: 3,
          iconPath: `/pages/resouces/voice/speak${theUserIndex+1}.png`,
          position: {
              left: 20,
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
    WxService.navigateTo(`../chat/chat`);
  },
})