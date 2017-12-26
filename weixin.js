'use strict'
var config=require('./config.js');
var Wechat=require('./wechat/wechat.js');
var menu=require('./menu.js');

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
		}else if (message.Event='scancode_push') {
			console.log(message.ScanCodeInfo.ScanType);
			console.log(message.ScanCodeInfo.ScanResult);
			this.body='你点击了菜单中的链接：'+message.EventKey;
		}else if (message.Event='scancode_waitmsg') {
			console.log(message.ScanCodeInfo.ScanType);
			console.log(message.ScanCodeInfo.ScanResult);
			this.body='你点击了菜单中的链接：'+message.EventKey;
		}else if (message.Event='pic_sysphoto') {
			console.log(message.SendPicsInfo.Count);
			console.log(message.SendPicsInfo.PicList);
			this.body='你点击了菜单中的链接：'+message.EventKey;
		}else if (message.Event='pic_photo_or_album') {
			console.log(message.SendPicsInfo.Count);
			console.log(message.SendPicsInfo.PicList);
			this.body='你点击了菜单中的链接：'+message.EventKey;
		}else if (message.Event='pic_weixin') {
			console.log(message.SendPicsInfo.Count);
			console.log(message.SendPicsInfo.PicList);
			this.body='你点击了菜单中的链接：'+message.EventKey;
		}else if (message.Event='location_select') {
			console.log(message.SendLocationInfo.Location_X);
			console.log(message.SendLocationInfo.Location_Y);
			console.log(message.SendLocationInfo.Scale);
			console.log(message.SendLocationInfo.Label);
			console.log(message.SendLocationInfo.Poiname);
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
				title:'匆匆那年',
				description:'匆匆那年看的李一桐',
				MUSIC_Url:'http://other.web.rf01.sycdn.kuwo.cn/resource/n2/66/79/3849065227.mp3',
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
				type:'video',description:{"title":"my love","introduction":"my love too"}
			});
			reply={
				type:'video',
				media_id:data.media_id,
				title:'上传的电影',
				description:'这不是你想象中的电影'
			}
		}else if(content==='10'){
			var picData=yield wechatApi.uploadMaterial('image',__dirname+'/2.jpg',{});
			var media={
				articles: [{
				title: '李一桐',
				thumb_media_id: picData.media_id,
				author: 'kzz',
				digest: '没有摘要',
				show_cover_pic: 1,
				content: '李一桐好美啊',
				content_source_url: 'https://github.com'
				}]
			}

			var data=yield wechatApi.uploadMaterial('news',media,{});

			data =yield wechatApi.fetchMaterial(data.media_id,'image',{});

			console.log(data);
			var items=data.news_item;
			var news=[];
			items.forEach(function(item){
				news.push({
					title:item.title,
					description:item.digest,
					picurl:picData.url,
					url:item.url
				});
			})
			reply=news;
		}else if (content==='11') {
			var data=yield wechatApi.countMaterial();
			var list=yield wechatApi.batchMaterial({
				type:'image',
				offset:0,
				count:2
			});
			console.log(JSON.stringify(data));
			console.log(list);
			reply='1';
		}else if(content==='12'){
			var list=yield wechatApi.batchMaterial({
				type:'image',
				offset:0,
				count:1
			});
			var mediaId=list.item[0].media_id;
			var result=yield wechatApi.deleteMaterial(mediaId);
			var data=yield wechatApi.countMaterial();
			console.log(JSON.stringify(data));
			reply='删除了一个永久图片素材';
		}else if (content==='13') {
			var data=yield wechatApi.createTag('hansame');
			console.log('新分组 hansame');
			console.log(data);
			yield wechatApi.batchTag(data.tag.id,[message.FromUserName]);
			var tagList=yield wechatApi.getIdList(message.FromUserName);
			console.log(tagList);
			reply='已经分配好标签';
		}else if (content==='14') {
			var user=yield wechatApi.getUserInfo(message.FromUserName);
			console.log(user);
			var openIds=[
				{
					openid:message.FromUserName,
					lang:'en'
				}
			]
			var users=yield wechatApi.getUserInfo(openIds);

			console.log(users);

			reply=JSON.stringify(user);
		}else if(content==='15'){
			var userList=yield wechatApi.getListUser();
			console.log(userList);
			reply=userList.total;
		}else if(content==='16'){
			var list=yield wechatApi.batchMaterial({
				type:'news',
				offset:0,
				count:1
			});
			var mediaId=list.item[0].media_id;
			var msg={
				media_id:mediaId
			}
			var tagList=yield wechatApi.getIdList(message.FromUserName);
			var tagid=tagList.tagid_list[0];
			var data=yield wechatApi.sendMsgByTag('mpnews',msg,tagid);
			console.log(data);
			reply='hahaha,it is ok!!!';
		}else if(content==='17'){
			var list=yield wechatApi.batchMaterial({
				type:'news',
				offset:0,
				count:1
			});
			var mediaId=list.item[0].media_id;
			var msg={
				media_id:mediaId
			}

			var text={
				'content':'我到底帅不帅'
			}
			var msgData=yield wechatApi.previewSendMsg('mpnews',msg,message.FromUserName);
			console.log(msgData);
			reply='Yeah';
		}else if(content==='18'){
			var list=yield wechatApi.batchMaterial({
				type:'news',
				offset:0,
				count:1
			});
			var mediaId=list.item[0].media_id;
			var msg={
				media_id:mediaId
			}
			var tagList=yield wechatApi.getIdList(message.FromUserName);
			var tagid=tagList.tagid_list[0];
			var msgData=yield wechatApi.sendMsgByTag('mpnews',msg,tagid);
			console.log(msgData);
			var resultData=yield wechatApi.getSendMsgStatus(msgData.msg_id);
			console.log(resultData);
			reply='hahaha';
		}else if(content==='19'){
			yield wechatApi.delMenu();
			yield wechatApi.createMenu(menu);
			reply='已创建菜单';
		}

		this.body=reply;
	}

	yield next;
}