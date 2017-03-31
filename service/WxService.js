//wx service
const Promise = require(`../vendor/bluebird/bluebird`);

const config = require(`../config`);

const BaseService = require(`./BaseService`);

let wxLogin = () => {
    return new Promise((resolve, reject) => {
        wx.login({
            success: function(res){
                if(res.code){
                    resolve(res);
                }else{
                    reject(res);
                }
            },
            fail:reject
        })
    })
}



let _currentLatLon = {}

let setCurrentLatLon = (currentLatLon) => {
    _currentLatLon = currentLatLon;
}

let getCurrentLatLon = () => {
    return _currentLatLon;
}

let wxUserInfo = () =>{
    return new Promise((resolve, reject) => {
        wx.getUserInfo({
            success: resolve,
            fail: reject
        })
    })
}

let wxCheckSession = () => {
    return new Promise((resolve,reject) => {
        wx.checkSession({
            success: resolve,
            fail: reject
        })
    })
} 

let currentPoint = {}

let getLocation = () => {
    return new Promise((resolve, reject) => {
        if(currentPoint.time && new Date().getTime() - currentPoint.time < 9*1000){
            resolve(currentPoint);
        }else{
            wx.getLocation({
                type: `gcj02`, 
                success: (res) => {
                    res.time = new Date().getTime();
                    currentPoint = res;
                    resolve(res);
                },
                fail: reject
            })
        }
        
    })
}

let navigateTo = (url,success,fail) => {
    wx.navigateTo({
      url: url,
      success: function(res){
        success&&success(res);
      },
      fail: function() {
        fail&&fail();
      },
      complete: function() {
        // complete
      }
    })
}

let redirectTo = (url,success,fail) => {
    wx.redirectTo({
      url: url,
      success: function(res){
        success&&success(res)
      },
      fail: function() {
        fail&&fail();
      }
    })
}

let showModal = (title,content,isShowCancel,next) => {
    wx.showModal({
        title: title,
        content: content,
        showCancel: isShowCancel,
        success: function (res){
            if(res.confirm) {
                next&&next();
            }
        }
    })
}





module.exports = {
    wxLogin,
    wxCheckSession,
    wxUserInfo,
    getLocation,
    navigateTo,
    redirectTo,
    showModal,
}