//config.js

//线上环境
const service = {
  main_url: `https://wireless.mapbar.com/api/3n1-wxgroup`,
  voice_url: `https://wdservice.mapbar.com/weixin-test/api/3n1-wxgroupvoice`,
  voice_socket_url: `wss://wdservice.mapbar.com/weixin-test/api/3n1-wxgroupvoice`,
  search_url: `https://w.mapbar.com/search2015/search`,
}
//内网测试环境
const service_test = {
  main_url: `http://192.168.0.175:8035`,
  voice_url: `http://192.168.0.162:8083`,
  voice_socket_url: `http://192.168.0.162:8083`,
  search_url: `https://w.mapbar.com/search2015/search`,
}
//外网测试环境--这个环境下会有问题，首页userList的问题
const service_debug = {
  main_url: `http://117.107.204.167:10081`,
  voice_url: `http://117.107.204.167:8083`,
  voice_socket_url: `http://117.107.204.167:8083`,
  search_url: `https://w.mapbar.com/search2015/search`,
}
module.exports = service;

/**
 * @小程序第四版迭代要求
 * 1、class名需要使用关键字+'-'+关键字这样的方式命名。
 * 2、class需要定制非常多的公共样式，便于复用。
 * 3、函数命名使用驼峰命名法。用户操作相关的使用事件来定义。。。。Event，在组件的生命周期中，只执行函数，不执行其他的东西。
 * 4、每个界面需要厘清这个界面的交互逻辑，用到的接口有哪些。用到的变量有哪些来控制。
 * 5、catch处理目前还不完美，需要有一个完美的控制方案。（应该理清界面控制的封装。。。。等一系列相关的东西。）
 * 6、梳理小程序做的更完美的逻辑等
 * 7、这次梳理的重点在destination界面（在需求的变更中，冗余代码太多）
 */
