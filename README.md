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
#### 参考 [详细文档](https://github.com/Xiaomi-mimc/operation-manual) 如何接入 & 安全认证，实现以下API： 
```
    function fetchMIMCToken() { 
        // 访问AppProxyService，从返回数据中获取[小米TokenService返回的原始数据]并直接返回
    }
```
#### 2. 在线状态变化回调
```
    /**
     * @param[bindResult] bool: true/false 表示登录成功/失败
     * @param[errType] string: 登录失败类型
     * @param[errReason] string: 登录失败原因
     * @param[errDesc] string: 登录失败描述
     **/
    function statusChange(bindResult, errType, errReason, errDesc) {
    }
```
#### 3. 服务器Ack回调
```
    /**
     * @param[packetId] string: 成功发送到服务器消息的packetId，即sendMessage(,)的返回值
     **/
    function serverAck(packetId) {
    }
```
#### 4. 接收消息回调
```
    /**
     * @param[receiveP2PMsg] object: 接收到的P2P消息体 
     **/
    function registerP2PMsgHandler(receiveP2PMsg) {
        receiveP2PMsg.getPacketId(); // 客户端生成的消息ID
        receiveP2PMsg.getSequence(); // 由服务器生成，用于去重排序(升序)
        receiveP2PMsg.getFromAccount(); // 消息发送者在APP帐号系统的帐号ID
        receiveP2PMsg.getPayload(); // payload为用户自定义消息，utf-8 string类型
    }  
```
#### 5. 连接断开回调
```
    function disconnect() {
    }
```
	
## 3) 登录
```
    user.login();
```
  
## 4) 发送单聊消息
```
    /**
     * @param[appAccount] string: 消息接收者在App帐号系统的帐号ID
     * @param[message] string utf8: 用户自定义消息体
     # @return string: 由客户端生成的消息ID
     **/
    var packetId = user.sendMessage(appAccount, message);
```
## 5) 发送群聊消息
```
暂不支持
```

## 6) 注销
```
    user.logout();
```

[回到顶部](#readme)
