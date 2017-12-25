/**
 * Created by kuangz on 2017/12/19.
 */
'use strict'

var Promise=require('bluebird');

var request=Promise.promisify(require('request'));

var _=require('lodash');

var util=require('./util.js');

var fs=require('fs');

var prefix='https://api.weixin.qq.com/cgi-bin/';
var api={
    accessToken:prefix+'token?grant_type=client_credential',
    temporary:{
        upload:prefix+'media/upload?',
        fetch:prefix+'media/get?'
    },
    permanent:{
        upload:prefix+'material/add_material?',
        uploadNews:prefix+'material/add_news?',
        uploadNewsPic:prefix+'media/uploadimg?',
        fetch:prefix+'material/get_material?',
        del:prefix+'material/del_material?',
        update:prefix+'material/update_news?',
        count:prefix+'material/get_materialcount?',
        batch:prefix+'material/batchget_material?'
    },
    tag:{
        create:prefix+'tags/create?',
        get:prefix+'tags/get?',
        update:prefix+'tags/update?',
        del:prefix+'tags/delete?',
        getFuns:prefix+'user/tag/get?',
        batchTag:prefix+'tags/members/batchtagging?',
        batchChunTag:prefix+'tags/members/batchuntagging?',
        getIdList:prefix+'tags/getidlist?'
    },
    user:{
        remark:prefix+'user/info/updateremark?',
        getInfo:prefix+'user/info?',
        getInfoList:prefix+'user/info/batchget?',
        getList:prefix+'user/get?'
    },
    mass:{
        tag:prefix+'message/mass/sendall?',
        openId:prefix+'message/mass/send?',
        del:prefix+'message/mass/delete?',
        preview:prefix+'message/mass/preview?',
        get:prefix+'message/mass/get?'
    },
    menu:{
        create:prefix+'menu/create?',
        get:prefix+'menu/get?',
        del:prefix+'menu/delete?',
        self:prefix+'get_current_selfmenu_info?'

    }
    
}

function Wechat(opts) {
    var that=this;
    this.appID=opts.appID;
    this.appSecret=opts.appSecret;
    this.getAccessToken=opts.getAccessToken;
    this.saveAccessToken=opts.saveAccessToken;
    this.fetchAccessToken();

}

Wechat.prototype.fetchAccessToken=function () {
    // body...
    var that=this;
    if(this.access_token && this.expires_in){
        if(this.isValidAccessToken(this)){
            return Promise.resolve(this);
        }
    }
    this.getAccessToken()
        .then(function (data) {
            try{
                data=JSON.parse(data);
            }catch (e){
                return that.updateAccessToken();
            }
            if(that.isValidAccessToken(data)){
                return Promise.resolve(data);
            }else {
                return that.updateAccessToken();
            }
        })
        .then(function (data) {
            console.log(data);
            that.access_token=data.access_token;
            that.expires_in=data.expires_in;
            that.saveAccessToken(data);

            return Promise.resolve(data);
        })
}

Wechat.prototype.isValidAccessToken=function (data) {
    if(!data||!data.access_token||!data.expires_in){
        return false;
    }
    var access_token=data.access_token;
    var expires_in=data.expires_in;
    var now=(new Date().getTime());

    if(now<expires_in){
        return true;
    }else {
        return false;
    }
}


Wechat.prototype.updateAccessToken=function () {
    var appID=this.appID;
    var appSecret=this.appSecret;
    var url=api.accessToken+'&appid='+appID+'&secret='+appSecret;
    return new Promise(function (resolve,reject) {
        request({url:url,json:true}).then(function (res) {
            var data=res.body;
            var now=(new Date().getTime());
            var expires_in=now+(data.expires_in-20)*1000;

            data.expires_in=expires_in;
            resolve(data);
        })
    })

}

Wechat.prototype.uploadMaterial=function (type,material,permanent) {
    var that=this;
    var form={};
    var uploadUrl=api.temporary.upload;

    if (permanent) {
        uploadUrl=api.permanent.upload;
        _.extend(form,permanent);
    }
    if(type==='pic'){
        uploadUrl=api.permanent.uploadNewsPic;
    }
    if (type==='news') {
        uploadUrl=api.permanent.uploadNews;
        form=material;
    }else {
        form.media=fs.createReadStream(material);
    }
    
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=uploadUrl+'access_token='+data.access_token;
            if(!permanent){
                url+='&type='+type;
            }
            else {
                if(type!=='pic'&&type!=='news'){
                    url+='&type='+type;
                }
                form.access_token=data.access_token;
            }
            var options={
                method:'POST',
                url:url,
                json:true
            }
            if(type==='news'){
                options.body=form;
            }else {
                options.formData=form;
            }

            request(options).then(function (res) {
            console.log(res);
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('Upload material failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.fetchMaterial=function (mediaId,type,permanent) {
    var that=this;
    var form={};
    var fetchUrl=api.temporary.fetch;

    if (permanent) {
        fetchUrl=api.permanent.fetch;
    }
    
    
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=fetchUrl+'access_token='+data.access_token;
            if(!permanent){
                url+='&media_id='+mediaId;
                if(type==='video'){
                    url=url.replace('https://','http://');
                }
            }else{
                form.media_id=mediaId;
            }

            var options={
                method:'POST',
                url:url,
                json:true
            }
            if(permanent){
                options.body=form;
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('Upload material failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.deleteMaterial=function (mediaId) {
    var that=this;
    var form={
        media_id:mediaId
    };
    var deleteUrl=api.permanent.del;

    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=deleteUrl+'access_token='+data.access_token;
            
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('Upload material failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.updateMaterial=function (mediaId,news) {
    var that=this;
    var form={
        media_id:mediaId
    };
    var updateUrl=api.permanent.update;
    _.extend(form,news);
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=updateUrl+'access_token='+data.access_token;
            
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('Upload material failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.countMaterial=function () {
    var that=this;
    var countUrl=api.permanent.count;
    
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=countUrl+'access_token='+data.access_token;
            
            var options={
                method:'POST',
                url:url,
                json:true
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('Upload material failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.batchMaterial=function (opts) {
    var that=this;
    var batchUrl=api.permanent.batch;
    opts.type=opts.type||'image';
    opts.offset=opts.offset||0;
    opts.count=opts.count||1;

    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=batchUrl+'access_token='+data.access_token;
            
            var options={
                method:'POST',
                url:url,
                json:true,
                body:opts
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('Upload material failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.createTag=function (name) {
    var that=this;
    var createTagUrl=api.tag.create;
    var form={tag:{name:name}};
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=createTagUrl+'access_token='+data.access_token;
            
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('createTag failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.getTag=function (name) {
    var that=this;
    var getTagUrl=api.tag.get;
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=createTagUrl+'access_token='+data.access_token;
            
            var options={
                method:'GET',
                url:url,
                json:true,
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('getTag failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.updateTag=function (id,name) {
    var that=this;
    var updateTagUrl=api.tag.update;
    var form={tag:{name:name,id:id}};
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=updateTagUrl+'access_token='+data.access_token;
            
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('updateTag failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.delTag=function (id) {
    var that=this;
    var delTagUrl=api.tag.del;
    var form={tag:{id:id}};
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=delTagUrl+'access_token='+data.access_token;
            
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('delTag failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.getFuns=function (tagId,nextOpenId) {
    var that=this;
    var getFunsUrl=api.tag.getFuns;
    var form={tagid:tagId,next_openid:nextOpenId};
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=getFunsUrl+'access_token='+data.access_token;
            
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('getFuns failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.batchTag=function (tagId,openidArr) {
    var that=this;
    var batchTagUrl=api.tag.batchTag;
    var form={openid_list:openidArr,tagid:tagId};
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=batchTagUrl+'access_token='+data.access_token;
            
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('batchTag failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.batchChunTag=function (tagId,openidArr) {
    var that=this;
    var batchChunTagUrl=api.tag.batchChunTag;
    var form={openid_list:openidArr,tagid:tagId};
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=batchChunTagUrl+'access_token='+data.access_token;
            
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('batchChunTag failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.getIdList=function (openId) {
    var that=this;
    var getIdListUrl=api.tag.getIdList;
    var form={openid:openId};
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=getIdListUrl+'access_token='+data.access_token;
            
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('getIdList failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.remarkUser=function (openId,remark) {
    var that=this;
    var remarkUrl=api.user.remark;
    var form={openid:openId,remark:remark};
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=remarkUrl+'access_token='+data.access_token;
            
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('remarkUser failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.getUserInfo=function (openIds,lang) {
    var that=this;
    lang=lang||'zh_CN';
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            if(_.isArray(openIds)){
                var url=api.user.getInfoList+'access_token='+data.access_token;
                var options={
                    method:'POST',
                    url:url,
                    json:true,
                    body:{user_list:openIds}
                }
            }else {
                var url=api.user.getInfo+'access_token='+data.access_token+'&openid='+openIds+'&lang='+lang;
                var options={
                    method:'GET',
                    url:url,
                    json:true
                }
            }            
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('getUserInfo failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.getListUser=function (nextOpenId) {
    var that=this;
    var getListUrl=api.user.getList;
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=getListUrl+'access_token='+data.access_token;
            if(nextOpenId){
                url+='&next_openid='+nextOpenId;
            }
            var options={
                method:'GET',
                url:url,
                json:true
                
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('getListUser failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.sendMsgByTag=function (type,message,tagId) {
    var that=this;
    var sendUrl=api.mass.tag;
    var form={
        filter:{},
        msgtype:''
    };
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=sendUrl+'access_token='+data.access_token;
            if(!tagId){
                form.filter.is_to_all=true;
            }else {
                form.filter={
                    is_to_all:false,
                    tag_id:tagId
                }
            }
            form.msgtype=type;
            form[type]=message;
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('send message failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.sendMsgByOpenId=function (type,message,openidArr) {
    var that=this;
    var sendUrl=api.mass.openId;
    var form={
        msgtype:type,
        touser:openidArr
    };
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=sendUrl+'access_token='+data.access_token;
            form[type]=message;
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('send message failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.delSendMsg=function (msgId,articleIdx) {
    var that=this;
    var delUrl=api.mass.del;
    var articleIdx=articleIdx||0;
    var form={
        msg_id:msgId,
        article_idx:articleIdx
    };
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=delUrl+'access_token='+data.access_token;
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('del send message failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.previewSendMsg=function (type,message,openId) {
    var that=this;
    var previewUrl=api.mass.preview;
    var form={
        touser:openId,
        msgtype:type
    };
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=previewUrl+'access_token='+data.access_token;
            form[type]=message;
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('preview send message failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}


Wechat.prototype.getSendMsgStatus=function (msgId) {
    var that=this;
    var getUrl=api.mass.get;
    var form={
        msg_id:msgId
    };
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=getUrl+'access_token='+data.access_token;
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('del send message failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.createMenu=function (opts) {
    var that=this;
    var createUrl=api.menu.create;
    var form=opts;
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=createUrl+'access_token='+data.access_token;
            var options={
                method:'POST',
                url:url,
                json:true,
                body:form
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('create menu failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.getMenu=function () {
    var that=this;
    var getUrl=api.menu.get;
    
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=getUrl+'access_token='+data.access_token;
            var options={
                method:'GET',
                url:url,
                json:true
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('get menu failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.delMenu=function () {
    var that=this;
    var delUrl=api.menu.del;
    
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=delUrl+'access_token='+data.access_token;
            var options={
                method:'GET',
                url:url,
                json:true
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error('del menu failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}

Wechat.prototype.selfMenu=function () {
    var that=this;
    var selfUrl=api.menu.self;
    
    return new Promise(function (resolve,reject) {
        that.fetchAccessToken()
        .then(function (data) {
            // body...
            var url=selfUrl+'access_token='+data.access_token;
            var options={
                method:'GET',
                url:url,
                json:true
            }
            request(options).then(function (res) {
            var _data=res.body;
            if(_data){
                resolve(_data);
            }else{
                throw new Error(' get self menu failed');
            }
        }).catch(function (err) {
            // body...
            reject(err);
        })
        })
        
    })

}



Wechat.prototype.reply=function () {
    var content=this.body;
    var message=this.weixin;
    var xml=util.tpl(content,message);
    console.log(xml);
    this.status=200;
    this.type='application/xml';
    this.body=xml;

}

module.exports=Wechat;