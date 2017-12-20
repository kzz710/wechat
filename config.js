'use strict'

var path=require('path');

var util=require('./libs/util');

var wechat_file=path.join(__dirname,'./config/wechat.txt');

var config={
    wechat:{
        appID:'wx986248b780a42003',
        appSecret:'3a45a89249f21bad4d268233eb075a04',
        token:'myfirstwechatapp',
        getAccessToken:function () {
            return util.readFileAsync(wechat_file);
        },
        saveAccessToken:function (data) {
            data=JSON.stringify(data);
            return util.writeFileAsync(wechat_file,data);
        }
    }
}

module.exports=config;