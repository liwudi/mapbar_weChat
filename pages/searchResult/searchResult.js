// pages/searchResult/searchResult.js
const WxService = require(`../../service/WxService`);

const AppService = require(`../../service/AppService`);

const app = getApp();

Page({
  data:{
    userId: ``,
    userInfo: {},
    destination: ``,
    longitude: ``,
    latitude: ``,
    currentCity: ``,
    cityCode: ``,



    destinationList:[],//关键字搜索列表
    deslon:"",
    deslat:"",
    isLastPage:false,//最后一页
    page_num:1,//当前显示页数
    target_num:0, //数据总数
    hasOther: false,

    other_cityName: ``,
    other_detailCityName: ``,
    
    isShowTaost:true,
    other_cityCode:null,
    other_cityPoints:null,
  },
  /**
   * 函数名：onLoad
   * 作用：获取自己当前位置坐标，接收上个页面传递过来的位置关键字
   */
  onLoad:function(options){
    console.log("options",options);

    let _this=this;
    wx.setNavigationBarTitle({title: options.data})
    
    WxService.getLocation().then(res => {
      _this.setData({
        latitude: res.latitude,
        longitude: res.longitude,
      })
 
      return AppService.getCityCode();

    }).then((data) => {
      console.log(`data`,data);
      _this.setData({
        destination: options.data,
        userInfo: app.globalData.userInfo,
        userId: app.globalData.userInfo.userId,
        currentCity: data.currentCity,
        cityCode: data.code,
      });
    }).then(() => {

      let str = ""+_this.data.longitude+","+_this.data.latitude;
      let page_num = _this.data.page_num;
      console.log(`在common中执行search`,_this.data.cityCode,str,page_num);
      _this.commonSearch(_this.data.cityCode,str,page_num);
    }); 
  },

  
  commonSearch: function(cityCode,str,page_num){
    let _this = this;
    WxService.getLocation().then(res => {
      _this.setData({
        longitude:res.longitude,
        latitude:res.latitude
      });
      return AppService.commonSearch(_this.data.destination,str,cityCode,page_num)
    }).then(res => {
      console.log("sucess返回数据",res);

      _this.dealSearchData(res.data);

    })
  },
  keywordsSearch: function(cityCode,str,page_num){
    let _this = this;
    WxService.getLocation().then(res => {
      _this.setData({
        longitude:res.longitude,
        latitude:res.latitude
      });
      
      return AppService.keywordsSearch(_this.data.destination,str,cityCode,page_num);
    }).then(res => {
      console.log("sucess返回数据",res);
      
      _this.dealSearchData(res.data);
    })
  },
  dealSearchData: function(res) {
    let _this = this;
    if(res.pois){
      let num;
      if(res.totalCount>200){
        num = 200;
      }else{
        num = res.totalCount;
      }
      //创建list来处理res.data.pois
      let list=res.pois;
      for(let i=0;i<list.length;i++){
        console.log(list[i].distance/1000);
        list[i].distance=list[i].distance/1000>=1?parseInt(list[i].distance/1000)+"km":parseInt(list[i].distance)+"m";
      }
      console.log("处理后list",list);
      _this.setData({
        destinationList:list,
        target_num:num
      });
      
    }else if(res.districtSwap){

      _this.setData({
        hasOther: true,
        other_cityName:`${res.districtSwap.name}`,
        other_detailCityName:`${res.districtSwap.parents}${res.districtSwap.name}`,
        other_cityCode:`${res.districtSwap.adcode}`,
        other_cityPoints:`${res.districtSwap.centerPoint}`
      })
    }
  },
  onReady:function(){
    // 页面渲染完成
    
  },
  onShow:function(){
    // 页面显示
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  },
  /**
   * prePageEvent
   * 作用：获取当前点击的选择的坐标点。并且把这个坐标点展示到另一个界面中，需要传参
   */
  prePageEvent:function(){
    let _this = this;
    let x = this.data.longitude;
    let y = this.data.latitude;
    let str = ""+x+","+y;
    let cityCode = _this.data.cityCode;
    if(_this.data.other_cityCode){
      cityCode = _this.data.other_cityCode;
      str = _this.data.other_cityPoints;
    }
    
    wx.showToast({
      title: '加载中',
      icon: 'loading',
      duration: 10000
    })

    AppService.aroundSearch(this.data.destination,str,cityCode,this.data.page_num+1).then(res => {

      let list=res.data.pois;
      for(let i=0;i<list.length;i++){
        console.log(list[i].distance/1000);
        list[i].distance=list[i].distance/1000>=1?parseInt(list[i].distance/1000)+"km":parseInt(list[i].distance)+"m";
      }
      _this.setData({
        destinationList:list,
        page_num:_this.data.page_num-1
      });
      
      wx.hideToast();
    })
  },
  /**
   * nextPageEvent
   * 作用：获取当前点击的选择的坐标点。并且把这个坐标点展示到另一个界面中，需要传参
   */
  nextPageEvent:function(){
    let _this=this;
    let x = this.data.longitude;
    let y = this.data.latitude;
    let str = ""+x+","+y;
    let cityCode = _this.data.cityCode;
    if(_this.data.other_cityCode){
      cityCode = _this.data.other_cityCode;
      str = _this.data.other_cityPoints;
    }
    wx.showToast({
      title: '加载中',
      icon: 'loading',
      duration: 10000
    });
    AppService.aroundSearch(this.data.destination,str,cityCode,this.data.page_num+1).then(res => {
      console.log(`aroundSearch`,res);
      let list=res.data.pois;
      for(let i=0;i<list.length;i++){
        console.log(list[i].distance/1000);
        list[i].distance=list[i].distance/1000>=1?parseInt(list[i].distance/1000)+"km":parseInt(list[i].distance)+"m";
      }
      _this.setData({
        destinationList:list,
        page_num:_this.data.page_num+1
      });
      
      wx.hideToast();
    })
  },
  /**
   * 函数名：selectedMapEvent
   * 作用：获取当前点击的选择的坐标点。并且把这个坐标点展示到另一个界面中，需要传参
   */
  selectedMapEvent:function(res){
    let _this = this;
    
    console.log(res);
    _this.index = res.currentTarget.dataset.target;
    
    WxService.navigateTo(`../watchMap/watchMap?index=${res.currentTarget.dataset.target}&list=${JSON.stringify(_this.data.destinationList)}`);
  },
  /**
   * 函数名：selectedDestinationEvent
   * 作用：获取当前点击的选择的坐标点。并且把这个坐标点展示到另一个界面中，需要传参
   */
  selectedDestinationEvent:function(res){
    let _this=this;
    _this.index = res.currentTarget.dataset.target;
    wx.showToast({
      title: '正在创建群组中',
      icon: 'loading',
      duration: 10000
    })
    _this.createGroup();
  },
  createGroup: function(){
    let _this = this;
    let lat = (_this.data.destinationList[_this.index].location.split(","))[1];
    let lon = (_this.data.destinationList[_this.index].location.split(","))[0];
    AppService.createGroup(_this.data.userId,_this.data.destinationList[_this.index].name,(_this.data.destinationList[_this.index].location.split(","))[0],(_this.data.destinationList[_this.index].location.split(","))[1],(_this.data.destinationList[_this.index].name));
  },
  clearEvent: function(){
    this.setData({
      isShowTaost:false
    });
  },
  currentCityEvent: function(){
    let _this = this;

    let x = this.data.longitude;
    let y = this.data.latitude;
    let str = ""+x+","+y;
    this.setData({
      hasOther: false
    });
    let cityCode = _this.data.cityCode;
    _this.keywordsSearch(cityCode,str,_this.data.page_num);
  },
  otherCityEvent: function(){
    let _this = this;

    let x = this.data.longitude;
    let y = this.data.latitude;
    let str = ""+x+","+y;
    this.setData({
      destination: _this.data.other_detailCityName,
      hasOther: false
    });
    let cityCode = _this.data.other_cityCode;
    console.log(`这个cityCode是`,cityCode)
    _this.keywordsSearch(cityCode,str,_this.data.page_num);
  }
})