const Promise = require(`../vendor/bluebird/bluebird.js`);

let get = (url,data) => {
    return new Promise((resolve, reject) => {
        wx.request({
          url,
          data,
          method: 'GET', 
          success: function(res){
            resolve(res);
          },
          fail: reject
        })
    })
}

let post = (url,data) => {
    return new Promise((resolve, reject) => {
        wx.request({
          url,
          data,
          method: 'POST', 
          success: function(res){
            resolve(res);
          },
          fail: reject
        })
    })
}

let deadline = (time) => {
    return new Promise((resolve, reject) => {
        if(new Date().getTime() - time >3600000){
            reject
        }else{
            resolve
        }
    })
}
module.exports = {
    get,
    post,
    deadline,
}