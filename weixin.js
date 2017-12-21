'use strict'
var config=require('./config.js');
var Wechat=require('./wechat/wechat.js');

var wechatApi=new Wechat(config.wechat);

exports.reply=function *(next){
	// body...
	var message=this.weixin;
	if (message.MsgType==='event') {
		if (message.Event==='subscribe') {
			if (message.EventKey) {
				console.log('扫二维码进来：'+message.EventKey+' '+message.ticket);
			}

			this.body='哈哈,你订阅了这个号';
		}else if (message.Event='unsubscribe') {
			console.log('无情取关');
			this.body='';
		}else if (message.Event='LOCATION') {
			this.body='您上报的位置是：'+message.Latitude+''+message.Longitude+'-'+message.Precision;
		}else if (message.Event='CLICK') {
			this.body='您点击了菜单:'+message.EventKey;
		}else if (message.Event='SCAN') {
			console.log('关注后扫描二维码'+message.EventKey+' '+message.Ticket);
			this.body='看到你扫了一下哦';
		}else if (message.Event='VIEW') {
			this.body='你点击了菜单中的链接：'+message.EventKey;
		}
	}else if (message.MsgType==='text') {
		var content=message.Content;
		var reply='额，你说的 '+message.Content+' 太复杂啦';

		if(content==='1') {
			reply='天下第一吃大米';
		}else if (content==='2') {
			reply='天下第二吃豆腐';
		}else if (content==='3') {
			reply='天下第三吃仙丹';
		}else if(content==='4') {
			reply=[{
				title:'技术改变世界',
				description:'只是个描述而已',
				picurl:'http://img2015.zdface.com/20170302/bb1ab6ef00e477aaf0a64698c7dc10a2.png',
				url:'https://github.com/'
			},{
				title:'NodeJs 开发微信',
				description:'爽到爆',
				picurl:'http://i.shangc.net/2017/0709/20170709010129139.jpg',
				url:'https://nodejs.org/'
			}]
		}else if(content==='5'){
			var data=yield wechatApi.uploadMaterial('image',__dirname+'/2.jpg');

			reply={
				type:'image',
				media_id:data.media_id
			}
		}else if(content==='6'){
			var data=yield wechatApi.uploadMaterial('video',__dirname+'/6.mp4');
			reply={
				type:'video',
				media_id:data.media_id,
				title:'上传的电影',
				description:'这不是你想象中的电影'
			}
		}else if(content==='7'){
			var data=yield wechatApi.uploadMaterial('image',__dirname+'/2.jpg');
			reply={
				type:'music',
				title:'江湖天下',
				description:'射雕英雄传片中曲',
				MUSIC_Url:'http://34.214.88.128:8080/7.mp3',
				media_id:data.media_id
			}
		}else if(content==='8'){
			var data=yield wechatApi.uploadMaterial('image',__dirname+'/2.jpg',{type:'image'});

			reply={
				type:'image',
				media_id:data.media_id
			}
		}else if(content==='9'){
			var data=yield wechatApi.uploadMaterial('video',__dirname+'/6.mp4',{
				type:'video',description:{"title":"很好看","introduction":"我喜欢的"}
			});
			reply={
				type:'video',
				media_id:data.media_id,
				title:'上传的电影',
				description:'这不是你想象中的电影'
			}
		}

		this.body=reply;
	}

	yield next;
}