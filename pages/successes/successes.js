// pages/successes/successes.js
const app = getApp();

const WxService = require(`../../service/WxService`);

const AppService = require(`../../service/AppService`);

const common = require(`../../utils/util`);
Page({
  data:{
    //我的信息
    userId:"",
    groupId:"",
    my_lat:"",
    my_lon:"",
    destlat:"",
    destlon:"",
    userInfo: {},
    users:null,
   
    mySelf:null,
    myIndex:'',
    //地图信息
    title:"翰林书画院",
    distance:"距您您900m",
    content:"北京市东城区东四十一条21号院",
    longitude:"113.3245211",
    latitude:"23.10229",
    polyline:[],
    markers: [],
    //本页所需数据
    ranking:``,
    destination:``,
    this_distance:``,
    this_time:``,
    average_speed:``,
    max_speed:``,

    history_distance:``,
    one_max_distance:``,
    all_city:``,

    //分享数据
    share_history_distance: ``,
    share_one_max_distance: ``,
    share_all_city: ``,

    usersList:[],
    isShare:false,

    isShowKilometre: false,
    isShowHour: false,
    isShowDay: false
  },
  onLoad:function(options){
    var _this=this;
    //处理界面传递参数
    if(options.isShare){
      this.setData({
        isShare:true
      });
    }
    this.setData({
      destination:options.destination,
      userId:options.userId,
      groupId:options.groupId,
      my_lon:options.lon,
      my_lat:options.lat,
      destlon:options.deslon,
      destlat:options.deslat
    });

    AppService.getUserInfo().then(res => {
      console.log(`successes界面获取用户信息`,res);
      _this.setData({
        userInfo:res.data.user,
        one_max_distance:res.data.user.maxDistance==null?0:(res.data.user.maxDistance).toFixed(1),
        all_city:res.data.user.totalCitys==null?0:res.data.user.totalCitys,
        history_distance:res.data.user.totalDistance==null?0:res.data.user.totalDistance.toFixed(1),
      });
      options.isShare && _this.setData({
        share_history_distance: options.hisdistance,
        share_one_max_distance: options.maxdistance,
        share_all_city: options.allcity
      })

      
      _this.getUsersList();
    }); 
  },
  getUsersList: function(){
    let _this = this;
    AppService.getUsersList(_this.data.groupId,1).then(res => {
      console.log('usersList11111111111111111111111111111111111111111',res);
      let list = res.data.data;
      let mylist = list.map((item, i) => {
        // 时间动态展示处理
        let minnutes = true,hour = false,day = false;
        let time = ((item.updateTime - item.creatTime) / 60000).toFixed(0);
        if(time/60>=1){
          time = (time/60).toFixed(1);
          minnutes = false,
          hour = true;
        }
        if(hour==true && time/24>=1){
          time = (time/24).toFixed(1);
          hour = false;
          day = true;
        }
        let distance = item.distance.toFixed(0);
        let meter = true;
        if (distance / 1000 >= 1){
          meter = false;
          distance = (distance/1000).toFixed(2);
        }
        return {
          minnutes: minnutes,
          hour: hour,
          day: day,
          img:item.userImg,
          username:item.userName,
          time:time,
          meter:meter,
          distance:distance,
        }
      });
      _this.setData({
        usersList:mylist
      });
      let mySelf = list.find((item) =>item.userId ==_this.data.userId);
      let index = list.findIndex((item) => item.userId == this.data.userId);
      console.log(`mySelf`,mySelf);
      let this_distance = mySelf.distance.toFixed(0);
      if (mySelf.distance/1000 >= 1){
        this_distance = (mySelf.distance / 1000).toFixed(1);
        _this.setData({
          isShowKilometre: true
        })
      }

      let this_time = ((mySelf.updateTime - mySelf.creatTime) /60000).toFixed(0);
      if(this_time>60){
        this_time = (this_time/60).toFixed(1);
        _this.setData({
          isShowHour: true
        })
      }
      if (this.data.isShowHour && this_time/24 > 1){
        this_time = (this_time / 24).toFixed(1);
        _this.setData({
          isShowHour: false,
          isShowDay:true
        })
      }
       
      _this.setData({
        myIndex: index + 1,
        mySelf:mySelf,
        my_lat:mySelf.origLat,
        my_lon:mySelf.origLon,
        // one_max_distance:mySelf.maxDistance==null?0:(mySelf.maxDistance).toFixed(3),
        // all_city:mySelf.totalCitys==null?0:mySelf.totalCitys,
        // history_distance:mySelf.totalDistance==null?0:mySelf.totalDistance.toFixed(3),

        this_distance: this_distance,
        /**
         * @todo:这个地方是需要改的，也是我们的用时一直改变的原因！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！
         */
        this_time: this_time,
        average_speed: ((mySelf.distance / ((mySelf.updateTime - mySelf.creatTime) / 1000 < 0.6 ? 0.6 : (mySelf.updateTime - mySelf.creatTime) / 1000))*3.6).toFixed(1),
        max_speed:mySelf.speedMax.toFixed(1),
      });
      _this.reGetRoute();
    })

  },
  /**
   * @function reGetRoute 界面重新算路
   */
  reGetRoute: function(){
    let _this=this;
    console.log(`reGetRoute`);
    var data="";
    console.log(_this.data.my_lon,_this.data.my_lat,_this.data.destlon,_this.data.destlat,_this.data.groupId)
    AppService.nav({
      lon:_this.data.my_lon,
      lat:_this.data.my_lat,
      destlon:_this.data.destlon,
      destlat:_this.data.destlat,
     
      groupid:Number(_this.data.groupId)
    }).then(res => {
      console.log(res);
      data = res.data.data.routelatlon;

      let array = data.split(";");

      array.pop();

      array = array.map(item => {
        return {
          longitude: Number(item.split(",")[0]),
          latitude: Number(item.split(",")[1])
        }
      });

       _this.setData({
          polyline: [{
              points: array,
              color: "#3c78ffDD",
              width: 6,
              dottedLine: false
          }],
          longitude:Number(array[0].longitude),
          latitude:Number(array[0].latitude),
          markers: [{
            iconPath: '../resouces/myicon/poi_start.png',
            id: 0,
            latitude: Number(array[0].latitude),
            longitude: Number(array[0].longitude),
            width: 30,
            height: 30
          },{
            iconPath: "../resouces/myicon/poi_end.png",
            id: 1,
            latitude: Number(array[array.length-1].latitude),
            longitude: Number(array[array.length-1].longitude),
            width: 30,
            height: 30
          }],
        });
    })
    
  },
  onReady:function(){
    // 页面渲染完成
  },
  onShow:function(){
    // 页面显示
    var _this=this;
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  },
  onShareAppMessage: function () {
    var _this=this;
    var lat = this.data.destlat;
    var lon = this.data.destlon;
    return {
      title: '目的地分享',
      desc: '图吧是技术最好的地图导航类技术企业',
      path: `/pages/successes/successes?isShare=true&groupId=${_this.data.groupId}&userId=${_this.data.userId}&destination=${_this.data.destination}&lat=${_this.data.my_lat}&lon=${_this.data.my_lon}&deslon=${_this.data.destlon}&deslat=${_this.data.destlat}&hisdistance=${_this.data.history_distance}&maxdistance=${_this.data.one_max_distance}&allcity=${_this.data.all_city}`
    }
  },
})