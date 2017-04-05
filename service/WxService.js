//wx service
const Promise = require(`../vendor/bluebird/bluebird`);

const Config = require(`../config`);

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


let startRecord = () => {
    return new Promise((resolve, reject) => {
        wx.startRecord({
          success: resolve,
          fail: reject
        })
    })
}

let saveFile = (tempFilePath) => {
    return new Promise((resolve,reject) => {
        wx.saveFile({
          tempFilePath: tempFilePath,
          success: function(res){
            resolve(res);
          },
          fail: reject
        })
    })
}

let connectSocket = (webSocketCode,i = 0) => {
    return new Promise((resolve,reject) => {
        wx.connectSocket({
          url: `${Config.voice_socket_url}/websocket?socketCode=${webSocketCode}`,
          data: {},
          header: {
              'content-type': 'application/json'
          },
          method: 'POST',
          success: function(){
            wx.showToast({
                title: '语音通道建立成功！',
                icon: 'success',
                duration: 2000
            })
          },
          fail: function(){
            if(i > 5){
                return
            }
            connectSocket(webSocketCode,++i);
          }
        })
    })
}

let upLoadFile = (savedFilePath,userid,groupid,timelong) => {
    return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: `${Config.voice_url}/voiceUp`,
          filePath: savedFilePath,
          name:'content',
          // header: {}, // 设置请求的 header
          formData: {
            userid,
            groupid,
            timelong
          }, 
          success: function(res){
            console.log("上传语音成功");
          }
        })
    })
}

let downloadFile = (audio_id) => {
    return new Promise((resolve,reject) => {
        wx.downloadFile({
            url: `${Config.voice_url}/voiceById?id=${audio_id}`, 
            success: function(res) {
                resolve(res);
                
            },
            fail: reject
        })
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

    startRecord,
    saveFile,

    connectSocket,

    upLoadFile,
    downloadFile,
}