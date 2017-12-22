/**
 * Created by kuangz on 2017/12/18.
 */
'use strict'

var Koa=require('koa');

var wechat=require('./wechat/g');

var util=require('./libs/util');

var config=require('./config.js');

var weixin=require('./weixin');


var app=new Koa();

app.use(wechat(config.wechat,weixin.reply));

app.listen(1234);
