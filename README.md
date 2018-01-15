# maobar_weChat
微信小程序
##项目目录
### 1、app.js
小程序的入口启动文件
### 2、app.json
小程序的全局配置文件
### 3、app.wxss
小程序的全局样式文件
### 4、config.js
小程序项目的公共配置文件

### 5、pages
小程序的界面相关文件
### 6、vendor
小程序引入的第三方库（Promise）
### 7、util
小程序共有功能函数
### 8、service
小程序的服务集成和封装
####  A、BaseService——对wx.request()的Promise化。
####  B、WxService——使用Promise，对wx相关的Api进行Promise化
####  C、AppService——对整个小程序page抛出的接口服务。
