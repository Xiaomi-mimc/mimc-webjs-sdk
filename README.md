[跳转到操作指南](https://github.com/Xiaomi-mimc/operation-manual)

快速开始
===

## 1) 预备步骤

APP开发者访问小米开放平台（dev.mi.com）申请appId/appKey/appSec。

步骤如下：登陆小米开放平台网页 -> ”管理控制台” -> ”小米应用商店” -> ”创建应用” -> 填入应用名和包名 -> ”创建” -> 记下看到的AppId/AppKey/AppSec 。

 #### PS：建议MIMC与小米推送使用的APP信息一致

## 2) 获取Token


+ appId/appKey/appSec：

  小米开放平台(dev.mi.com/cosole/man/)申请
  
  信息敏感，不应存储于APP端，应存储在AppProxyService
  
+ appAccount:

  APP帐号系统内唯一ID
  
+ AppProxyService：

  a) 验证appAccount合法性；
  
  b) 访问TokenService，获取Token并下发给APP；
  
#### 访问TokenService获取Token方式如下：
```
    curl “https://mimc.chat.xiaomi.net/api/account/token”
    -XPOST -d '{"appId":$appId,"appKey":$appKey,"appSecret":$appSec,"appAccount":$appAccount}' 
    -H "Content-Type: application/json"
```
## 3) html中引用相关js文件
    <script type="text/javascript" src="mimc-min_1_0_0.js"></script>
## 4) 创建用户并注册相关回调
    user = new MIMCUser(appId, appAccount);
    user.registerFetchToken(fetchMIMCToken);         //获取token回调
    user.registerStatusChange(statusChange);         //登录结果回调
    user.registerServerAckHandler(serverAck);        //发送消息后，服务器接收到消息ack的回调
	user.registerP2PMsgHandler(receiveP2PMsg);       //接收单聊消息回调
    user.registerDisconnHandler(disconnect);         //连接断开回调
## 5) 获取Token回调
	function fetchMIMCToken() {
    /**
     * @return: 小米TokenService服务下发的原始数据
     * @note: fetchToken()访问APP应用方自行实现的AppProxyService服务，该服务实现以下功能：
                    1. 存储appId/appKey/appSec（不应当存储在APP客户端）
                    2. 用户在APP系统内的合法鉴权
                    3. 调用小米TokenService服务，并将小米TokenService服务返回结果通过fetchToken()原样返回
     **/
    }
## 6) 登录
    user.login();
## 7) 登录结果回调
    function statusChange(bindResult, errType, errReason, errDesc) {
        //bindResult为bool类型登录结果
        //errType, errReason, errDesc为具体错误信息，string类型
    }
## 8) 发送消息
    //返回值为packetId，message为用户自定义消息，utf-8 string类型
    var packetId = user.sendMessage(appAccount, message);
## 9) 服务器Ack回调
    function serverAck(packetId) {
	    //packetId与user.sendMessage的返回值相对应，表示packetId消息已发送成功
	}
## 10) 接收消息回调
    function registerP2PMsgHandler(receiveP2PMsg) {
        receiveP2PMsg.getPacketId();
        receiveP2PMsg.getSequence();
        receiveP2PMsg.getFromAccount();
        receiveP2PMsg.getFromResource();
        receiveP2PMsg.getPayload();//payload为用户自定义消息，utf-8 string类型
    }  
## 11) 注销
    user.logout();
## 12) 连接断开回调
    function disconnect() {
	    //连接断开后需要重新登录
	}

# PushService

## 下面的例子中所使用到的常量解释：(变量名称/含义)

```
$appId						小米开放平台申请的AppId
$appKey                 	          	小米开放平台申请的AppKey
$appSecret             		          	小米开放平台申请的AppSecret             
$fromAccount            	         	表示消息发送方成员号account(app账号)
$fromResource           	         	表示用户设备的标识
$toAccount              	    		表示消息接收方成员号account(app账号)
$msgType                    	          	表示发送消息的类型
                                                msgType="base64": msg是base64编码后的数据，一般传输二进制数据时使用
						msgType="":       msg是原始数据，一般传输String数据时使用
$msg                    	          	表示发送的消息,参阅$msgType注释使用
$topicId			 		表示群ID 
$packetId               	          	表示发送消息包ID
```

## 1） 推送单聊信息

+ HTTP 请求
```
curl https://mimc.chat.xiaomi.net/api/push/p2p/ -XPOST -d '{"appId":$appId, "appKey":$appKey，"appSecret":$appSecret, "fromAccount":$fromAccount, "fromResource":$fromResource, "toAccount":$toAccount, "msg":$msg， "msgType":$msgType}' -H "Content-Type: application/json"
```

+ JSON结果
```
{
	"code":200,
	"data":{"packetId":$packetId},
	"message":"success"
}
```

## 2）推送群聊信息

+ HTTP 请求
```
curl https://mimc.chat.xiaomi.net/api/push/p2t/ -XPOST -d '{"appId":$appId, "appKey":$appKey，"appSecret":$appSecret, "fromAccount":$fromAccount, "fromResource":$fromResource, "msg":$msg, "topicId":$topicId, "msgType":$msgType}' -H "Content-Type: application/json"
```

+ JSON结果
```
{
	"code":200,
	"data":{"packetId":$packetId},
	"message":"success"
}
```

# Topic API：

## 下面的例子中所使用到的常量解释：(变量名称/含义)

```
$appId						小米开放平台申请的AppId
$appKey                 	          	小米开放平台申请的AppKey
$appSecret             		          	小米开放平台申请的AppSecret				
$topicId			 		表示群ID
$topicName			 		表示创建群的时候所指定的群名称
$topicId1			 		表示查询所属群信息时用户所加入群的群ID
$topicId2			 		表示查询所属群信息时用户所加入群的群ID
$topicName1			 		表示查询所属群信息时用户所加入群的群名称
$topicName2			 		表示查询所属群信息时用户所加入群的群名称
$topicBulletin1			 		表示查询所属群信息时用户所加入群的群公告
$topicBulletin2					表示查询所属群信息时用户所加入群的群公告
$newBulletin					表示更新群时设置的新群公告
$newTopicName					表示更新群时设置的新群名称
$ownerUuid					表示群主uuid
$ownerAccount					表示群主account(app账号)
$ownerToken					表示群主token
$userAccount1					表示群成员1号account(app账号)
$userAccount2					表示群成员2号account(app账号)
$userAccount3					表示群成员3号account(app账号)
$userAccount4					表示群成员4号account(app账号)
$userAccount5					表示群成员5号account(app账号)
$userUuid1					表示userAccount1的uuid（广义上表示任意一个群成员的uuid）
$userToken1					表示userAccount1的token（广义上表示任意一个群成员的token）
```

### PS：
```
token的获取使用User.getToken()方法。
uuid的获取使用User.getUuid()方法，uuid由MIMC根据($appId, $appAccount)生成，全局唯一。
身份认证有两种方式：1. token（$ownerToken/$userToken1）; 2. app信息,app帐号（$appKey，$appSecret，$ownerAccount/$userAccount1）。
当两种认证信息都存在时，优先验证前者。前者一般用于app客户端，后者一般用于app服务端。下面给出了这两种的使用方式。
```

## 1) 创建群(createTopic)：

#### 如下为$ownerAccount创建群
	
+ HTTPS请求
```
curl "https://mimc.chat.xiaomi.net/api/topic/$appId" -XPOST -d '{"topicName":$topicName,"accounts":"$userAccount1,$userAccount2,$userAccount3"}' -H "Content-Type: application/json" -H "token:$ownerToken"

curl "https://mimc.chat.xiaomi.net/api/topic/$appId" -XPOST -d '{"topicName":$topicName,"accounts":"$userAccount1,$userAccount2,$userAccount3"}' -H "Content-Type: application/json" -H "appKey:$appKey" -H "appSecret:$appSecret" -H "appAccount:$ownerAccount"
```
	
+ JSON结果
```
{
	 "code":200,"message":"success",
	 "data":{
		"topicInfo":{
			"topicId":$topicId,
			"ownerUuid":$ownerUuid,
			"topicName":$topicName,
			"bulletin":""
		},
		"members":[
			{"uuid":$ownerUuid,"account":$ownerAccount},
			{"uuid":$userUuid1,"account":$userAccount1},
			{"uuid":$userUuid2,"account":$userAccount2},
			{"uuid":$userUuid3,"account":$userAccount3}
		]
	}
}
```

## 2) 查询群信息(queryTopic)：

#### 如下为$userAccount1查询群信息

+ HTTPS请求
```
curl "https://mimc.chat.xiaomi.net/api/topic/$appId/$topicId" -H "Content-Type: application/json" -H "token:$userToken1"

curl "https://mimc.chat.xiaomi.net/api/topic/$appId/$topicId" -H "Content-Type: application/json" -H "appKey:$appKey" -H "appSecret:$appSecret" -H "appAccount:$userAccount1"
```

+ JSON结果
```
{
	 "code":200,"message":"success",
	 "data":{
		"topicInfo":{
			"topicId":$topicId,
			"ownerUuid":$ownerUuid,
			"topicName":$topicName,
			"bulletin":""
		},
		"members":[
			{"uuid":$ownerUuid,"account":$ownerAccount},
			{"uuid":$userUuid1,"account":$userAccount1},
			{"uuid":$userUuid2,"account":$userAccount2},
			{"uuid":$userUuid3,"account":$userAccount3}
		]
	 }
}
```

## 3) 查询所属群信息(queryAccountTopics)：

#### 如下为$userAccount1查询加入的所有群信息

+ HTTPS请求
```
curl "https://mimc.chat.xiaomi.net/api/topic/$appId/account" -H "Content-Type: application/json" -H "token:$userToken1"

curl "https://mimc.chat.xiaomi.net/api/topic/$appId/account" -H "Content-Type: application/json" -H "appKey:$appKey" -H "appSecret:$appSecret" -H "appAccount:$userAccount1"
```

+ JSON结果
```
{
	"code":200,
	"message":"success",
	"data":[
		{
			"topicId":$topicId1,
			"ownerUuid":$ownerUuid,
			"topicName":$topicName1,
			"bulletin":$topicBulletin1
		},
		{
			"topicId":$topicId2,
			"ownerUuid":$ownerUuid,
			"topicName":$topicName2,
			"bulletin":$topicBulletin2
		}
	]
}
```

## 4) 邀请人进群(joinTopic):

#### 如下为$userAccount1邀请$userAccount4,$userAccount5加入群
	
+ HTTPS请求
```
curl "https://mimc.chat.xiaomi.net/api/topic/$appId/$topicId/accounts" -XPOST -d '{"accounts":"$userAccount4,$userAccount5"}' -H "Content-Type: application/json" -H "token:$userToken1"

curl "https://mimc.chat.xiaomi.net/api/topic/$appId/$topicId/accounts" -XPOST -d '{"accounts":"$userAccount4,$userAccount5"}' -H "Content-Type: application/json" -H "appKey:$appKey" -H "appSecret:$appSecret" -H "appAccount:$userAccount1"
```

+ JSON结果
```
{
	 "code":200,"message":"success",
	 "data":{
		"topicInfo":{
			"topicId":$topicId,
			"ownerUuid":$ownerUuid,
			"topicName":$topicName,
			"bulletin":""
		},
		"members":[
			{"uuid":$ownerUuid,"account":$ownerAccount},
			{"uuid":$userUuid1,"account":$userAccount1},
			{"uuid":$userUuid2,"account":$userAccount2},
			{"uuid":$userUuid3,"account":$userAccount3},
			{"uuid":$userUuid4,"account":$userAccount4},
			{"uuid":$userUuid5,"account":$userAccount5}
		]
	}
}
```

## 5) 非群主用户退群(quitTopic):

#### 如下为$userAccount1退群

+ HTTPS请求
```
curl "https://mimc.chat.xiaomi.net/api/topic/$appId/$topicId/account" -XDELETE -H "Content-Type: application/json" -H "token:$userToken1"

curl "https://mimc.chat.xiaomi.net/api/topic/$appId/$topicId/account" -XDELETE -H "Content-Type: application/json" -H "appKey:$appKey" -H "appSecret:$appSecret" -H "appAccount:$userAccount1"
```
	
+ JSON结果
```
{
	 "code":200,"message":"success",
	 "data":{
		"topicInfo":{
			"topicId":$topicId,
			"ownerUuid":$ownerUuid,
			"topicName":$topicName,
			"bulletin":""
		},
		"members":[
			{"uuid":$ownerUuid,"account":$ownerAccount},
			{"uuid":$userUuid2,"account":$userAccount2},
			{"uuid":$userUuid3,"account":$userAccount3},
			{"uuid":$userUuid4,"account":$userAccount4},
			{"uuid":$userUuid5,"account":$userAccount5}
		]
	}
}
```

+ 若是群主退群，则JSON结果如下：
```
{"code":500,"message":"quit topic fail","data":null}
```
 
## 6) 群主踢用户退群(kickTopic):

#### 如下为$ownerAccount踢$userAccount4,$userAccount5退出群

+ HTTPS请求
```
curl "https://mimc.chat.xiaomi.net/api/topic/$appId/$topicId/accounts?accounts=$userAccount4,$userAccount5" -XDELETE -H "Content-Type: application/json" -H "token:$ownerToken"

curl "https://mimc.chat.xiaomi.net/api/topic/$appId/$topicId/accounts?accounts=$userAccount4,$userAccount5" -XDELETE -H "Content-Type: application/json" -H "appKey:$appKey" -H "appSecret:$appSecret" -H "appAccount:$ownerAccount"
```
	
+ JSON结果
```
{
	 "code":200,"message":"success",
	 "data":{
		"topicInfo":{
			"topicId":$topicId,
			"ownerUuid":$ownerUuid,
			"topicName":$topicName,
			"bulletin":""
		},
		"members":[
			{"uuid":$ownerUuid,"account":$ownerAccount},
			{"uuid":$userUuid2,"account":$userAccount2},
			{"uuid":$userUuid3,"account":$userAccount3}
		]
	}
}
```
	
## 7) 群主更新群信息(updateTopic):

#### 如下为$ownerAccount更新群信息：群主为$userAccount2，群名称为$newTopicName，群公告为$newBulletin
	
+ HTTPS请求
```
curl "https://mimc.chat.xiaomi.net/api/topic/$appId/$topicId" -XPUT -d '{"topicId":$topicId, "ownerUuid":$userUuid2,"topicName":$newTopicName,"bulletin":$newBulletin}' -H "Content-Type: application/json" -H "token:$ownerToken"

curl "https://mimc.chat.xiaomi.net/api/topic/$appId/$topicId" -XPUT -d '{"topicId":$topicId, "ownerUuid":$userUuid2,"topicName":$newTopicName,"bulletin":$newBulletin}' -H "Content-Type: application/json" -H "appKey:$appKey" -H "appSecret:$appSecret" -H "appAccount:$ownerAccount"
```
	
+ JSON结果
```
{
	 "code":200,"message":"success",
	 "data":{
		"topicInfo":{
			"topicId":$topicId,
			"ownerUuid":$userUuid2,
			"topicName":$newTopicName,
			"bulletin":$newBulletin
		},
		"members":[
			{"uuid":$ownerUuid,"account":$ownerAccount},
			{"uuid":$userUuid2,"account":$userAccount2},
			{"uuid":$userUuid3,"account":$userAccount3}
		]
	}
}
```

## 8) 群主销毁群(dismissTopic):

#### 如下为群主销毁群
	
+ HTTPS请求
```
curl "https://mimc.chat.xiaomi.net/api/topic/$appId/$topicId" -XDELETE -H "Content-Type: application/json" -H "token:$ownerToken"

curl "https://mimc.chat.xiaomi.net/api/topic/$appId/$topicId" -XDELETE -H "Content-Type: application/json" -H "appKey:$appKey" -H "appSecret:$appSecret" -H "appAccount:$ownerAccount"
```

+ JSON结果
```
{"code":200,"message":"success！","data":null}
```


[回到顶部](#readme)
