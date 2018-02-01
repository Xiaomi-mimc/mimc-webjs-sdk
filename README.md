# MIMC官方详细文档点击此链接：[详细文档](https://github.com/Xiaomi-mimc/operation-manual)

快速开始
===

## 1) 快速接入 & 安全认证

参考 [详细文档](https://github.com/Xiaomi-mimc/operation-manual) 快速接入 & 安全认证

## 2) html中引用相关js文件
    <script type="text/javascript" src="mimc-min_1_0_0.js"></script>
## 3) 创建用户并注册相关回调
    user = new MIMCUser(appId, appAccount);
    user.registerFetchToken(fetchMIMCToken);         //获取token回调
    user.registerStatusChange(statusChange);         //登录结果回调
    user.registerServerAckHandler(serverAck);        //发送消息后，服务器接收到消息ack的回调
    user.registerP2PMsgHandler(receiveP2PMsg);       //接收单聊消息回调
    user.registerDisconnHandler(disconnect);         //连接断开回调
## 4) 获取Token回调
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
## 5) 登录
    user.login();
## 6) 登录结果回调
    function statusChange(bindResult, errType, errReason, errDesc) {
        //bindResult为bool类型登录结果
        //errType, errReason, errDesc为具体错误信息，string类型
    }
## 7) 发送单聊消息
    //返回值为packetId，message为用户自定义消息，utf-8 string类型
    var packetId = user.sendMessage(appAccount, message);
#### PS：发送群聊消息暂不支持
## 8) 服务器Ack回调
    function serverAck(packetId) {
	    //packetId与user.sendMessage的返回值相对应，表示packetId消息已发送成功
	}
## 9) 接收消息回调
    function registerP2PMsgHandler(receiveP2PMsg) {
        receiveP2PMsg.getPacketId();
        receiveP2PMsg.getSequence();
        receiveP2PMsg.getFromAccount();
        receiveP2PMsg.getPayload();//payload为用户自定义消息，utf-8 string类型
    }  
## 10) 注销
    user.logout();
## 11) 连接断开回调
    function disconnect() {
	    //连接断开后需要重新登录
	}

[回到顶部](#readme)
