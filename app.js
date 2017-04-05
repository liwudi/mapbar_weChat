//app.js

let common = require('./utils/util');
let WxService = require('./service/WxService');
let AppService = require('./service/AppService');

App({
    /**
     * 初始化
     * 获取用户code，并拉取终点列表
     * @param next
     */
    onLaunch: function () {

    },
    onHide: function () {

    },
    globalData: {
        isInit:false,
        userInfo: {},
    }
});