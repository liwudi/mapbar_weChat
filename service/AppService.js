//app service
const BaseService = require(`./BaseService`);

const WxService = require(`./WxService`);

const Promise = require(`../vendor/bluebird/bluebird`);

const Config = require(`../config`);

let userInfo = {
    "userId": "",
    "userName": "",
    "userImg": "",
    "userPhone": null,
    "totalDistance": 0,
    "cityName": "",
    "totalCitys": 0,
    "maxDistance": 0,
    "openStatus": 0,
    "creatTime": 1490687160000,
    "updateTime": 1490921126000,
    "id": 1240,
}

userInfo = wx.getStorageSync('userInfo');

let userName,userImg,userId;

if(!!userInfo){

    userId = userInfo.userId;

    userName = userInfo.userName;

    userImg = userInfo.userImg;

}


function setUserInfo(userInfo){
    wx.setStorageSync('userInfo',userInfo)
    console.log(`set之后的_userInfo`,userInfo)
}

function getUserInfo(){
    return WxService.wxCheckSession().then(() => {
        if(userInfo&&userId&&userName&&userImg){
            console.log(`再次通道`);
            console.log(getGroupList());
            return getGroupList()
        }else{
            return WxService.wxLogin().then((res) => {
                
                return WxService.wxUserInfo().then((data) => {
                    console.log(`首次通道`);
                    data.code = res.code;
                    return data;
                })
            }).then((res) => {
                console.log(res)
                return getUserId(res.code,res.userInfo.avatarUrl,res.userInfo.nickName);
            })
        }
    }).catch(() => {
        console.log(`catch通道`);
        WxService.wxLogin().then((res) => {
            
            return WxService.wxUserInfo().then((data) => {
                console.log(data);
                data.code = res.code;
                return data;
            })
        }).then((res) => {
            return getUserId(res.code,res.userInfo.avatarUrl,res.userInfo.nickName);
        })
    });
}

function getUserId(code, avatarUrl, nickName){
    return BaseService.get(
        `${Config.main_url}/wxGroup/login.json`,
        {
            code,
            userimg:avatarUrl,
            username:nickName,
        }
    ).then(res => {
        res.data.user.maxDistance = res.data.user.maxDistance.toFixed(2);
        res.data.user.totalDistance = res.data.user.totalDistance.toFixed(2);
        console.log(`set--userInfo`,res);
        setUserInfo(res.data.user);
        return res;
    })
}

function getGroupList(){
    return BaseService.get(
        `${Config.main_url}/wxGroup/login.json`,
        {
            userid: userInfo.userId,
            username: userInfo.userName,
            userimg: userInfo.userImg,
        }
    ).then(res => {
        console.log(res);
        console.log(`set--userInfo`,res);
        setUserInfo(res.data.user);
        return res;
    })
}

let systemInfo = {
    "model":"iPhone 6",
    "pixelRatio":2,
    "windowWidth":320,
    "windowHeight":528,
    "system":"iOS 10.0.1",
    "language":"zh_CN",
    "version":"6.3.9",
    "platform":"devtools"
};

wx.getSystemInfo({
    success: (res) => {
        systemInfo = res;
    }
});

function pushSms(phoneNum){
    return BaseService.get(
        `${Config.main_url}/wxGroup/pushSms.json`,
        {
            userId:userInfo.userId,
            phoneNum
        }
    )
}

function upLoadPin(code_value){
    return BaseService.get(
      `${Config.main_url}/wxGroup/uploadPin.json`,
      {
        pin:code_value,
        userid:userInfo.userId
      }
    )
}

function nav(data){
    return BaseService.get(
        `${Config.main_url}/wxGroup/getDrive.json`,
        Object.assign({
            userid: userInfo.userId
        }, data)
    )
}

function upLoadLonlat(data){
    
    return BaseService.get(
        `${Config.main_url}/wxGroup/updateLoc.json`,
        Object.assign({
            userid: userInfo.userId
        }, data)
    )
}

//获取城市code

let cityCode = {
    time: ``,
    code: ``,
}

function getCityCode(){
    let now = new Date().getTime();
    if(cityCode.time &&  (now - cityCode.time < 600*1000)){
        return cityCode;
    }else{
        return WxService.getLocation().then(res => {
        
            return BaseService.get(
                `https://wedrive.mapbar.com/opentsp/gis/api/inverse?resType=json&lat=${res.latitude}&lon=${res.longitude}&inGb=02&outGb=g02&ak=69453725f7e942bb84eac04189fd20ab`,
                {}
            )
        }).then(res => {
            cityCode.time = now;
            cityCode.code = res.data.province.code;
            return cityCode;
        })
    }
    
}


function suggestSearch(keywords,cityCode){
    return BaseService.get(
        `https://w.mapbar.com/search2015/search/suggest`,
        {
            'keywords': keywords,
            'city':cityCode
        }
    )
}


function exitTheGroup(userId,groupId){
    BaseService.get(
    `${Config.main_url}/wxGroup/updateGroup.json`,
    {
        userid:userId,
        groupid:groupId,
        status:1
    }
    ).then(res => {
    console.log(res);
        wx.navigateBack({delta: 5});
        if(res.status == 200){
            
        }
    }).catch(error => {
        console.log(error);
    });
}

function changeGroupName(userId,groupId,groupname){
    BaseService.get(
    `${Config.main_url}/wxGroup/updateGroup.json`,
    {
        userid:userId,
        groupid:groupId,
        groupname:groupname
    }
    ).then(res => {
    console.log(res);
        wx.navigateBack({delta: 1});
        if(res.status == 200){
            
        }
    }).catch(error => {
        console.log(error);
    });
}

module.exports = {
    getUserId,
    getUserInfo,
    getGroupList,
    pushSms,
    nav,
    upLoadLonlat,
    upLoadPin,
    systemInfo,
    getCityCode,
    suggestSearch,
    exitTheGroup,
    changeGroupName,
}