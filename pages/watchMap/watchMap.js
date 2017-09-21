// pages/watchMap/watchMap.js
const WxService = require(`../../service/WxService`);

const AppService = require(`../../service/AppService`);

const app = getApp();

Page({
  data:{
    userId: ``,
    title: ``,
    distance: ``,
    content: ``,
    list: [],
    index:0,

    longitude: ``,
    latitude: ``,
    destination: ``,
    markers: [],
    include_markers: [],

    controls: [{
      id: 1,
      iconPath: '/pages/resouces/myicon/allWatchBtn.png',
      position: {
        left: 15,
        top: 350,
        width: 40,
        height: 40
      },
      clickable: true
    }]
  },
  
  /**
   * 函数名：onLoad
   * 作用：接受页面传递的index参数，通过全局存取看地图页面的坐标点。设置界面初始值。
   */
  onLoad:function(options){
    let _this=this;
    _this.list = JSON.parse(options.list);
    _this.setData({
      index: options.index,
      list: JSON.parse(options.list),
      userId: app.globalData.userInfo.userId
    });
    _this.markers(_this.list);

    _this.setData({
      include_markers:_this.data.markers
    })

    let mylist = _this.list.map((item, i) => {
        return {
          title:item.name,
          distance:item.direct+item.distance,
          content:item.address,
          longitude:item.location.split(",")[0],
          latitude:item.location.split(",")[1],
          destination:item.name
        }
    });

    if(_this.list[_this.data.index]){
      wx.setNavigationBarTitle({
        title: _this.list[_this.data.index].name
      })
      this.setData({
        title:_this.list[_this.data.index].name,
        distance:_this.list[_this.data.index].direct+_this.list[_this.data.index].distance,
        content:_this.list[_this.data.index].address,
        longitude:_this.list[_this.data.index].location.split(",")[0],
        latitude:_this.list[_this.data.index].location.split(",")[1],
        destination:_this.list[_this.data.index].name,
        list: mylist,
      });
    }    
  },
  onReady:function(){
    // 使用 wx.createMapContext 获取 map 上下文
    
  },

  
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  },
  markers: function(list){
    let _this = this;
   
    var array = list.map((item,i) => {

      let loc = item.location.split(",");
      if(_this.data.index == i){
        _this.setData({
          latitude: parseFloat(loc[1]),
          longitude: parseFloat(loc[0]),
        });

        wx.setNavigationBarTitle({
          title: _this.list[_this.data.index].name
        })
      }
      return {
        iconPath: "/pages/resouces/myicon/poi_"+(i+1)+((_this.data.index == i)?".png":"x.png"),
        id: i,
        latitude: parseFloat(loc[1]),
        longitude: parseFloat(loc[0]),
        width: 25,
        height: 30,
        
      }
    });
    if(array.length){
      this.setData({
        markers:array
      });
    }
  },
  controlsEvent: function (res) {
    let _this = this;
    _this.setData({
      include_markers:_this.data.markers
    })
  },
  /**
   * 函数名：destinationEvent
   * 作用：进行群组创建，创建成功需要进行界面跳转，并且要给下个界面传递一个groupId
   */

  destinationEvent:function(res){
    let _this=this;
    //app.globalData.index = res.currentTarget.dataset.target;
    let that=this;
    wx.showToast({
      title: '正在创建群组中',
      icon: 'loading',
      duration: 10000
    })
   
    _this.createGroup();
  },
  createGroup: function(){
    let _this = this;
    let lat = (_this.list[_this.data.index].location.split(","))[1];
    let lon = (_this.list[_this.data.index].location.split(","))[0];
    console.log(`建群传输数据`,this.data.userId,_this.list[_this.data.index].name,(_this.list[_this.data.index].location.split(","))[0],(_this.list[_this.data.index].location.split(","))[1],(_this.list[_this.data.index].name));
    AppService.createGroup(_this.data.userId,_this.list[_this.data.index].name,parseFloat((_this.list[_this.data.index].location.split(","))[0]),parseFloat((_this.list[_this.data.index].location.split(","))[1]),(_this.list[_this.data.index].name));
  },
  /**
   * markderTap和changeEvent区别
   * markerTap是通过改变index的值从而触发了changeEvent，在changeEvent进行打点。
   */
  markertap:function(res){
    console.log(res.markerId);
    var index = res.markerId;
    this.setData({
      index: index
    })
  },

  changeEvent: function(e){

    let _this = this;
    console.log(e.detail.current);
    let index = e.detail.current;
    _this.setData({
      index: index
    });

    _this.markers(_this.list);
  },
})