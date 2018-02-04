# MIMC官方详细文档点击此链接：[详细文档](https://github.com/Xiaomi-mimc/operation-manual)

快速开始
===

## 1) html中引用相关js文件
    <script type="text/javascript" src="mimc-min_1_0_0.js"></script>
## 2) 创建用户并注册相关回调
    user = new MIMCUser(appId, appAccount);
    user.registerFetchToken(fetchMIMCToken);         //获取token回调
    user.registerStatusChange(statusChange);         //登录结果回调
    user.registerServerAckHandler(serverAck);        //发送消息后，服务器接收到消息ack的回调
    user.registerP2PMsgHandler(receiveP2PMsg);       //接收单聊消息回调
    user.registerDisconnHandler(disconnect);         //连接断开回调
#### 1. 获取Token回调
#### 参考 [详细文档](https://github.com/Xiaomi-mimc/operation-manual) 如何接入 & 安全认证
    /**
     * @return: 小米TokenService服务下发的原始数据
     * @note: fetchToken()访问APP应用方自行实现的AppProxyService服务，该服务实现以下功能：
                    1. 存储appId/appKey/appSec（不应当存储在APP客户端）
                    2. 用户在APP系统内的合法鉴权
		        3. 调用小米TokenService服务，参考{ 2) 获取Token }
		        并将小米TokenService服务返回结果通过fetchToken()原样返回 **/
    function fetchMIMCToken() { 
        //App developer implement 
    }
#### 2. 在线状态变化回调
    function statusChange(bindResult, errType, errReason, errDesc) {
        //bindResult为bool类型登录结果
        //errType, errReason, errDesc为具体错误信息，string类型
    }
#### 3. 服务器Ack回调
    function serverAck(packetId) {
	    //packetId与user.sendMessage的返回值相对应，表示packetId消息已发送成功
	}
#### 4. 接收消息回调
    function registerP2PMsgHandler(receiveP2PMsg) {
        receiveP2PMsg.getPacketId();
        receiveP2PMsg.getSequence();
        receiveP2PMsg.getFromAccount();
        receiveP2PMsg.getPayload();//payload为用户自定义消息，utf-8 string类型
    }  
#### 5. 连接断开回调
    function disconnect() {
	    //连接断开后需要重新登录
	}
	
## 3) 登录
    user.login();
  
## 4) 发送单聊消息
    //返回值为packetId，message为用户自定义消息，utf-8 string类型
    var packetId = user.sendMessage(appAccount, message);

## 5) 发送群聊消息
```
暂不支持
```

## 6) 注销
    user.logout();


[回到顶部](#readme)
