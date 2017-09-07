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

const service_debug = {
  main_url: `http://117.107.204.167:10081`,
  voice_url: `http://192.168.0.162:8083`,
  voice_socket_url: `http://192.168.0.162:8083`,
  search_url: `https://w.mapbar.com/search2015/search`,
}
module.exports = service_debug;
