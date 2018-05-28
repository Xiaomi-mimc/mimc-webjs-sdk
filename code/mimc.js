goog.provide('mimc');
goog.require('proto.ims.ClientHeader');
goog.require('proto.ims.ClientHeader.MSG_DIR_FLAG');
goog.require('proto.ims.XMMsgBind');
goog.require('proto.ims.XMMsgBindResp');
goog.require('proto.ims.XMMsgConn');
goog.require('proto.ims.XMMsgConnResp');
goog.require('proto.ims.XMMsgNotify');
goog.require('proto.ims.XMMsgPing');
goog.require('proto.MIMCGroup');
goog.require('proto.MIMCP2PMessage');
goog.require('proto.MIMCP2TMessage');
goog.require('proto.MIMCPacket');
goog.require('proto.MIMCPacketAck');
goog.require('proto.MIMCPacketList');
goog.require('proto.MIMCPull');
goog.require('proto.MIMCSequenceAck');
goog.require('proto.MIMCUser');
goog.require('proto.MIMC_MSG_TYPE');
goog.require('mimc.md5');


function MIMCUser(appAccount, res) {
    var uuid = "";
    var appId = "";
    var packetIdCount = 0;
    var wsUri = "wss://wsapp.chat.xiaomi.net";
    var loginState = false;
    var resource = "";
    var websocket;
    var intervalId;
    if (arguments[2]) {
        resource = res;
    } else {
        try {
            resource = md5(window.navigator.userAgent);
        } catch(err) {
            resource = "resWeb";
            console.log("md5 failed,err=" + err);
        }
    }
    var msgHandler, groupMsgHandler, serverAckHandler, fetchMIMCToken, statusChange, disconnectHandler;
    var challenge, securityKey, packetName;
    var recvSequence = new Set();

    //msgHandler(message),message为MIMCMessage类型
    this.registerP2PMsgHandler = function (func) {
        msgHandler = func;
    };

    //groupMsgHandler(message),message为MIMGroupCMessage类型
    this.registerGroupMsgHandler = function (func) {
        groupMsgHandler = func;
    };

    //serverAckHandler(packetId)
    this.registerServerAckHandler = function (func) {
        serverAckHandler = func;
    };

    //fetchMIMCToken(),回调函数无参数
    this.registerFetchToken = function (func) {
        fetchMIMCToken = func;
    };

    //statusChange(bindResult, errType, errReason, errDesc)
    this.registerStatusChange = function (func) {
        statusChange = func;
    };

    //disconnect(),回调函数无参数
    this.registerDisconnHandler = function (func) {
        disconnectHandler = func;
    };

    function initWebsocket() {
        websocket = new WebSocket(wsUri);
        websocket.onopen = function(evt) {
            onOpen(evt)
        };
        websocket.onclose = function(evt) {
            onClose(evt)
        };
        websocket.onmessage = function(evt) {
            onMessage(evt)
        };
        websocket.onerror = function(evt) {
            onError(evt)
        };
    }

    function onOpen(evt) {
        MIMCConnect();
    }

    function onClose(evt) {
        if (disconnectHandler !== undefined && disconnectHandler !== null) {
            disconnectHandler();
        } else {
            console.log("DisconnHandler is not registered.");
        }
        loginState = false;
        clearInterval(intervalId);
    }

    function onMessage(evt) {
        var fr = new FileReader();
        fr.onload = function(){
            handleWSMsg(this.result);
        };
        fr.readAsArrayBuffer(evt.data);
    }

    function onError(evt) {
        clearInterval(intervalId);
    }

    function sendWSMessage(wsMessage) {
        websocket.send(wsMessage);
    }

    function closeWebsocket() {
        websocket.close();
    }

    this.login = function() {
        initWebsocket();
    };
    
    this.logout = function () {
        var v5Message = buildPakcetV5(buildClientHeader("UBND", generateHeaderId()), "");
        sendWSMessage(v5Message);
    };

    function MIMCConnect() {
        var clientHeader = new proto.ims.ClientHeader();
        clientHeader.setServer("xiaomi.com");
        clientHeader.setCmd("CONN");
        clientHeader.setId(generateHeaderId());
        var bufferHeader = clientHeader.serializeBinary();

        var conn = new proto.ims.XMMsgConn();
        conn.setVersion(106);
        conn.setModel(navigator.appName);
        conn.setOs(parseFloat(navigator.appVersion));
        conn.setUdid("websocket");
        conn.setSdk(31);
        var bufferPayload = conn.serializeBinary();

        var V5message = buildPakcetV5(bufferHeader, bufferPayload);
        sendWSMessage(V5message);
    }

    function userLogin() {
        if (loginState === true) {
            console.log("user already login.");
            statusChange(true,null,null,null);
            return;
        }

        var tokenInfo;
        if (fetchMIMCToken !== undefined && fetchMIMCToken !== null) {
            tokenInfo = fetchMIMCToken();
        } else {
            console.log("fetchMIMCToken is not registered");
            return;
        }
        if (tokenInfo.code !== 200) {
            if (statusChange !== undefined && statusChange !== null) {
                statusChange(false, "get token failed", "token info code:" + tokenInfo.code, "token info message:" + tokenInfo.message);
            } else {
                console.log("statusChange is not registered");
            }
            return;
        }

        uuid = tokenInfo.data.miUserId;
        appId = tokenInfo.data.appId;
        securityKey = atob(tokenInfo.data.miUserSecurityKey);
        packetName = tokenInfo.data.appPackage;

        var headerId = generateHeaderId();
        var paramMap = new Map();
        paramMap.set("challenge", challenge);
        paramMap.set("chid", tokenInfo.data.miChid);
        paramMap.set("client_attrs", "");
        paramMap.set("cloud_attrs", "");
        paramMap.set("from", uuid + "@xiaomi.com/" + resource);
        paramMap.set("id", headerId);
        paramMap.set("kick", 0);
        paramMap.set("to", "xiaomi.com");
        paramMap.set("token", tokenInfo.data.token);
        var method = "XIAOMI-PASS";
        var sig = generateSig(paramMap, method, tokenInfo.data.miUserSecurityKey);

        var bind = new proto.ims.XMMsgBind();
        bind.setToken(tokenInfo.data.token);
        bind.setKick(0);
        bind.setMethod(method);
        bind.setSig(sig);
        var bufferBind = bind.serializeBinary();

        var V5message = buildPakcetV5(buildClientHeader("BIND", headerId), bufferBind);
        sendWSMessage(V5message);
    }

    function generateSig(paramMap, method, secretKey) {
        var tmp_str = method + '&';
        paramMap.forEach(function (value, key, map) {
            tmp_str = tmp_str + key + '='+ value + '&';
        });
        tmp_str += secretKey;
        var tmp_array = new Uint8Array(str2ab(tmp_str));
        var tmpkey = ab2str(sha1(tmp_array));
        return btoa(tmpkey);
    }

    this.sendMessage = function (toUser, singleMessage, isStore = true) {
        if (loginState === false) {
            console.log("user not login.");
            throw "user not login";
        }
        if (singleMessage.length > 10 * 1024) {
            console.log("packet len > 10k");
            throw "packet len > 10k";
        }

        var userFrom = new proto.MIMCUser();
        userFrom.setAppid(appId);
        userFrom.setAppaccount(appAccount);
        userFrom.setUuid(uuid);
        userFrom.setResource(resource);

        var userTo = new proto.MIMCUser();
        userTo.setAppid(appId);
        userTo.setAppaccount(toUser);

        var p2pMessage = new proto.MIMCP2PMessage();
        p2pMessage.setFrom(userFrom);
        p2pMessage.setTo(userTo);
        p2pMessage.setPayload(encodeUTF8(singleMessage));
        p2pMessage.setIsstore(isStore);

        var packetId = generateHeaderId();
        var mimcPacket = new proto.MIMCPacket();
        mimcPacket.setPacketid(packetId);
        mimcPacket.setPackage(packetName);
        mimcPacket.setType(proto.MIMC_MSG_TYPE.P2P_MESSAGE);
        mimcPacket.setPayload(p2pMessage.serializeBinary());

        var v5Message = buildPakcetV5(buildClientHeader("SECMSG", packetId), mimcPacket.serializeBinary());
        sendWSMessage(v5Message);

        return packetId;
    };

    this.sendGroupMessage = function (groutId, groupMessage, isStore = true) {
        if (loginState === false) {
            console.log("user not login.");
            throw "user not login.";
        }
        if (groupMessage.length > 10 * 1024) {
            console.log("packet len > 10k");
            throw "packet len > 10k";
        }

        var groupTo = new proto.MIMCGroup();
        groupTo.setAppid(appId);
        groupTo.setTopicid(groutId);

        var userFrom = new proto.MIMCUser();
        userFrom.setAppid(appId);
        userFrom.setAppaccount(appAccount);
        userFrom.setUuid(uuid);
        userFrom.setResource(resource);

        var p2tMessage = new proto.MIMCP2TMessage();
        p2tMessage.setFrom(userFrom);
        p2tMessage.setTo(groupTo);
        p2tMessage.setPayload(encodeUTF8(groupMessage));
        p2tMessage.setIsstore(isStore);

        var packetId = generateHeaderId();
        var mimcPacket = new proto.MIMCPacket();
        mimcPacket.setPacketid(packetId);
        mimcPacket.setPackage(packetName);
        mimcPacket.setType(proto.MIMC_MSG_TYPE.P2T_MESSAGE);
        mimcPacket.setPayload(p2tMessage.serializeBinary());

        var v5Message = buildPakcetV5(buildClientHeader("SECMSG", packetId), mimcPacket.serializeBinary());
        sendWSMessage(v5Message);

        return packetId;
    };

    this.pull = function () {
        if (loginState === false) {
            console.log("user not login.");
            throw "user not login.";
        }
        if (groupMessage.length > 10 * 1024) {
            console.log("packet len > 10k");
            throw "packet len > 10k";
        }

        var mimcPull = new proto.MIMCPull();
        mimcPull.setUuid(uuid);
        mimcPull.setResource(resource);

        var packetId = generateHeaderId();
        var mimcPacket = new proto.MIMCPacket();
        mimcPacket.setPacketid(packetId);
        mimcPacket.setPackage(packetName);
        mimcPacket.setType(proto.MIMC_MSG_TYPE.PULL);

        var v5Message = buildPakcetV5(buildClientHeader("SECMSG", packetId), mimcPacket.serializeBinary());
        sendWSMessage(v5Message);

        return packetId;
    };

    function sendSequenceAck(sequence) {
        var mimcSeqAck = new proto.MIMCSequenceAck();
        mimcSeqAck.setUuid(uuid);
        mimcSeqAck.setResource(resource);
        mimcSeqAck.setSequence(sequence);

        var mimcPakcet = new proto.MIMCPacket();
        mimcPakcet.setType(proto.MIMC_MSG_TYPE.SEQUENCE_ACK);
        mimcPakcet.setPayload(mimcSeqAck.serializeBinary());

        var v5Message = buildPakcetV5(buildClientHeader("SECMSG", generateHeaderId()), mimcPakcet.serializeBinary());
        sendWSMessage(v5Message);
    }

    function sendPing() {
        var pingMsg = new proto.ims.XMMsgPing();
        var v5Message = buildPakcetV5(buildClientHeader("PING", generateHeaderId()), pingMsg.serializeBinary());
        sendWSMessage(v5Message);
    }

    function buildClientHeader(cmd, headerId) {
        var clientHeader = new proto.ims.ClientHeader();
        clientHeader.setChid(9);
        clientHeader.setUuid(uuid);
        clientHeader.setServer("xiaomi.com");
        clientHeader.setResource(resource);
        clientHeader.setCmd(cmd);
        clientHeader.setId(headerId);
        return clientHeader.serializeBinary();
    }

    function generateHeaderId() {
        var timestamp = new Date().getTime();
        var headerId = "web" + timestamp + packetIdCount;
        packetIdCount++;
        packetIdCount %= 1000;
        return headerId;
    }

    function buildPakcetV5(header, payload) {
        var PacketV5_Size = 18;
        var header_len = header.length;
        var payload_len = payload.length;
        var packet_size = PacketV5_Size + header_len + payload_len;
        var buffer = new ArrayBuffer(packet_size);
        var dv = new DataView(buffer);
        //set packetv5 magic
        dv.setUint8(0, 0xC2);
        dv.setUint8(1, 0xFE);
        //set packetv5 version
        dv.setUint8(2, 0);
        dv.setUint8(3, 4);
        dv.setUint16(4, 3);
        dv.setUint16(6, 2);
        dv.setUint16(8, header_len);
        dv.setUint32(10, payload_len);

        for (var i = 0; i < header_len; i++) {
            dv.setUint8(14 + i, header[i]);
        }

        for (i = 0; i < payload_len; i++) {
            dv.setUint8(14 + header_len + i, payload[i]);
        }

        var checksum = adler32(buffer.slice(0, packet_size - 4));
        dv.setUint32(packet_size - 4, checksum);

        return buffer;
    }

    function handleWSMsg(wsMessage) {
        var dv = new DataView(wsMessage);
        var magic = dv.getUint16(0);
        var version = dv.getUint16(2);
        var header_type = dv.getUint16(4);
        var payload_type = dv.getUint16(6);
        var header_len = dv.getUint16(8);
        var payload_len = dv.getUint32(10);
        var received_crc = dv.getUint32(14 + header_len + payload_len);
        var actual_crc = adler32(wsMessage.slice(0, 14 + header_len + payload_len));

        if (received_crc !== actual_crc) {
            return;
        }

        var buffer_header = new Uint8Array(wsMessage.slice(14, 14 + header_len));
        var buffer_payload = new Uint8Array(wsMessage.slice(14 + header_len, 14 + header_len + payload_len));
        var clientheader = proto.ims.ClientHeader.deserializeBinary(buffer_header);

        switch (clientheader.getCmd()) {
            case "CONN":
                handleCONN(buffer_payload);
                break;
            case "BIND":
                handleBIND(buffer_payload);
                break;
            case "SECMSG":
                handleSECMSG(buffer_payload, securityKey + '_' + clientheader.getId());
                break;
            case "PING":
                handlePing(buffer_payload);
                break;
            case "KICK":
                handleKick(buffer_payload);
                break;
            default:
                handleUnknowCMD(buffer_payload);
        }
    }

    function handleCONN(connMsg)
    {
        var connResp = proto.ims.XMMsgConnResp.deserializeBinary(connMsg);
        challenge = connResp.getChallenge();
        userLogin();
        intervalId = setInterval(sendPing, 30000);
    }

    function handleBIND(bindMsg)
    {
        var bindResp = proto.ims.XMMsgBindResp.deserializeBinary(bindMsg);
        if (bindResp.getResult()) {
            loginState = true;
        }
        if (statusChange !== undefined && statusChange !== null) {
            statusChange(bindResp.getResult(), bindResp.getErrorType(), bindResp.getErrorReason(), bindResp.getErrorDesc());
        } else {
            console.log("statusChange is not registered");
        }
    }

    function handlePing() {
        return;
    }

    function handleKick() {
        closeWebsocket();
    }

    function handleSECMSG(secmsg, rc4_key) {
        var secmsg_str = rc4(ab2str(secmsg), rc4_key);
        var secmsg_payload = new Uint8Array(str2ab(secmsg_str));
        var mimcPacket = proto.MIMCPacket.deserializeBinary(secmsg_payload);
        switch (mimcPacket.getType()) {
            case proto.MIMC_MSG_TYPE.PACKET_ACK:
                handleP2PMessageAck(mimcPacket.getPayload());
                break;
            case proto.MIMC_MSG_TYPE.COMPOUND:
                handleCompoundMsg(mimcPacket.getPayload());
                break;
            default:
                handleUnknowCMD(mimcPacket.getPayload());
        }
    }

    function handleP2PMessageAck(ackMessage) {
        var messageAck = proto.MIMCPacketAck.deserializeBinary(ackMessage);
        if (serverAckHandler !== undefined && serverAckHandler !== null) {
            serverAckHandler(messageAck.getPacketid(), messageAck.getSequence(), messageAck.getTimestamp(), messageAck.getErrormsg());
        } else {
            console.log("serverAckHandler is not registered");
        }
    }

    function handleCompoundMsg(message) {
        var mimcMsgList = proto.MIMCPacketList.deserializeBinary(message);
        sendSequenceAck(mimcMsgList.getMaxsequence());
        if (mimcMsgList.getUuid() !== uuid || mimcMsgList.getResource() !== resource) {
            return;
        }

        var mimcPackets = mimcMsgList.getPacketsList();
        for (var i = 0; i < mimcPackets.length; i++) {
            try {
                handleMIMCPacket(mimcPackets[i]);
            } catch (err){
                console.log("handleMIMCPacket " + i + " fail, err=" + err.message);
            }
        }
    }

    function handleMIMCPacket(packet) {
        switch (packet.getType()) {
            case proto.MIMC_MSG_TYPE.P2P_MESSAGE:
                handleP2PMessage(packet.getPayload(), packet.getPacketid(), packet.getSequence(), packet.getTimestamp());
                break;
            case proto.MIMC_MSG_TYPE.P2T_MESSAGE:
                handleP2TMessage(packet.getPayload(), packet.getPacketid(), packet.getSequence(), packet.getTimestamp());
                break;
            default:
                handleUnknowCMD(packet.getPayload());
        }
    }

    function handleP2PMessage(message, packetId, sequence, ts) {
        if (recvSequence.has(sequence)) {
            return;
        }
        recvSequence.add(sequence);

        var p2pMessage = proto.MIMCP2PMessage.deserializeBinary(message);
        var userFrom = p2pMessage.getFrom();
        var userTo = p2pMessage.getTo();

        var mimcPacket = new MIMCMessage();
        mimcPacket.setPacketId(packetId);
        mimcPacket.setSequence(sequence);
        mimcPacket.setFromAccount(userFrom.getAppaccount());
        mimcPacket.setFromResource(userFrom.getResource());
        mimcPacket.setPayload(decodeUTF8(p2pMessage.getPayload()));
        mimcPacket.setTimeStamp(ts);
        if (msgHandler !== undefined && msgHandler !== null) {
            msgHandler(mimcPacket);
        } else {
            console.log("msgHandler is not registered");
        }
    }

    function handleP2TMessage(message, packetId, sequence, ts) {
        if (recvSequence.has(sequence)) {
            return;
        }
        recvSequence.add(sequence);

        var p2tMessage = proto.MIMCP2TMessage.deserializeBinary(message);
        var userFrom = p2tMessage.getFrom();
        var group = p2tMessage.getTo();
        var mimcGroupMessage = new MIMCGroupMessage();
        mimcGroupMessage.setPacketId(packetId);
        mimcGroupMessage.setSequence(sequence);
        mimcGroupMessage.setFromAccount(userFrom.getAppaccount());
        mimcGroupMessage.setFromResource(userFrom.getResource());
        mimcGroupMessage.setTopicId(group.getTopicid());
        mimcGroupMessage.setPayload(decodeUTF8(p2tMessage.getPayload()));
        mimcGroupMessage.setTimeStamp(ts);
        if (groupMsgHandler !== undefined && groupMsgHandler !== null) {
            groupMsgHandler(mimcGroupMessage);
        } else {
            console.log("groupMsgHandler is not registered");
        }
    }

    function handleUnknowCMD(unknow_message) {
        return;
    }

    var MIMCMessage = function () {
        var packetId, sequence, fromAccount, fromResource, payload, timeStamp;

        this.setPacketId = function (value) {
            packetId = value;
        };

        this.getPacketId = function () {
            return packetId;
        };

        this.setFromAccount = function (value) {
            fromAccount = value;
        };

        this.getFromAccount = function () {
            return fromAccount;
        };

        this.setFromResource = function (value) {
            fromResource = value;
        };

        this.getFromResource = function () {
            return fromResource;
        };

        this.setSequence = function (value) {
            sequence = value;
        };

        this.getSequence = function () {
            return sequence;
        };

        this.setPayload = function (value) {
            payload = value;
        };

        this.getPayload = function () {
            return payload;
        };

        this.setTimeStamp = function (ts) {
            timeStamp = ts;
        };

        this.getTimeStamp = function () {
            return timeStamp;
        };
    };

    var MIMCGroupMessage = function () {
        var packetId, sequence, fromAccount, fromResource, groupId, payload, timeStamp;

        this.setPacketId = function (value) {
            packetId = value;
        };

        this.getPacketId = function () {
            return packetId;
        };

        this.setFromAccount = function (value) {
            fromAccount = value;
        };

        this.getFromAccount = function () {
            return fromAccount;
        };

        this.setFromResource = function (value) {
            fromResource = value;
        };

        this.getFromResource = function () {
            return fromResource;
        };

        this.setSequence = function (value) {
            sequence = value;
        };

        this.getSequence = function () {
            return sequence;
        };

        this.setTopicId = function (value) {
            groupId = value;
        };

        this.getTopicId = function () {
            return groupId;
        };

        this.setPayload = function (value) {
            payload = value;
        };

        this.getPayload = function () {
            return payload;
        };

        this.setTimeStamp = function (ts) {
            timeStamp = ts;
        };

        this.getTimeStamp = function () {
            return timeStamp;
        };
    };

     function adler32(bytes){
        bytes = new Uint8Array(bytes);

        var a = 1,
            b = 0,
            i = 0,
            MOD_ADLER = 65521,
            len = bytes.length,
            tlen;

        while(len > 0){
            tlen = len > 5550 ? 5550 : len;
            len -= tlen;
            do {
                a += bytes[i++];
                b += a;
            } while(--tlen);

            a %= MOD_ADLER;
            b %= MOD_ADLER;
        }

        return ((b << 16) | a) >>> 0;
    }


    function rc4(str, key) {
        var s = [], j = 0, x, res = '';
        var i = 0;
        for (i = 0; i < 256; i++) {
            s[i] = i;
        }
        for (i = 0; i < 256; i++) {
            j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
            x = s[i];
            s[i] = s[j];
            s[j] = x;
        }
        i = 0;
        j = 0;
        for (var y = 0; y < str.length; y++) {
            i = (i + 1) % 256;
            j = (j + s[i]) % 256;
            x = s[i];
            s[i] = s[j];
            s[j] = x;
            res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
        }
        return res;
    }

    function sha1(data){
        //Input：Uint8Array
        //Output：Uint8Array
        var i,j,t;
        var l=((data.length+8)>>>6<<4)+16,s=new Uint8Array(l<<2);
        s.set(new Uint8Array(data.buffer)),s=new Uint32Array(s.buffer);
        for(t=new DataView(s.buffer),i=0;i<l;i++)s[i]=t.getUint32(i<<2);
        s[data.length>>2]|=0x80<<(24-(data.length&3)*8);
        s[l-1]=data.length<<3;
        var w=[],f=[
                function(){return m[1]&m[2]|~m[1]&m[3];},
                function(){return m[1]^m[2]^m[3];},
                function(){return m[1]&m[2]|m[1]&m[3]|m[2]&m[3];},
                function(){return m[1]^m[2]^m[3];}
            ],rol=function(n,c){return n<<c|n>>>(32-c);},
            k=[1518500249,1859775393,-1894007588,-899497514],
            m=[1732584193,-271733879,null,null,-1009589776];
        m[2]=~m[0],m[3]=~m[1];
        for(i=0;i<s.length;i+=16){
            var o=m.slice(0);
            for(j=0;j<80;j++)
                w[j]=j<16?s[i+j]:rol(w[j-3]^w[j-8]^w[j-14]^w[j-16],1),
                    t=rol(m[0],5)+f[j/20|0]()+m[4]+w[j]+k[j/20|0]|0,
                    m[1]=rol(m[1],30),m.pop(),m.unshift(t);
            for(j=0;j<5;j++)m[j]=m[j]+o[j]|0;
        }
        t=new DataView(new Uint32Array(m).buffer);
        for(var i=0;i<5;i++)m[i]=t.getUint32(i<<2);
        return new Uint8Array(new Uint32Array(m).buffer);
    }

    function str2ab(str) {
        var buf = new ArrayBuffer(str.length); // 2 bytes for each char
        var bufView = new Uint8Array(buf);
        for (var i=0, strLen=str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    function ab2str(ab) {
        var myString = "";
        for (var i=0; i<ab.byteLength; i++) {
            myString += String.fromCharCode(ab[i])
        }
        return myString;
    }

    function hex2str(hex) {
        var tmpStr = hex.toString();//force conversion
        var str = '';
        for (var i = 0; i < tmpStr.length; i += 2)
            str += String.fromCharCode(parseInt(tmpStr.substr(i, 2), 16));
        return str;
    }

    function encodeUTF8(s) {
        var i = 0;
        var bytes = new Uint8Array(s.length * 4);
        for (var ci = 0; ci != s.length; ci++) {
            var c = s.charCodeAt(ci);
            if (c < 128) {
                bytes[i++] = c;
                continue;
            }
            if (c < 2048) {
                bytes[i++] = c >> 6 | 192;
            } else {
                if (c > 0xd7ff && c < 0xdc00) {
                    if (++ci == s.length) throw 'UTF-8 encode: incomplete surrogate pair';
                    var c2 = s.charCodeAt(ci);
                    if (c2 < 0xdc00 || c2 > 0xdfff) throw 'UTF-8 encode: second char code 0x' + c2.toString(16) + ' at index ' + ci + ' in surrogate pair out of range';
                    c = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
                    bytes[i++] = c >> 18 | 240;
                    bytes[i++] = c>> 12 & 63 | 128;
                } else { // c <= 0xffff
                    bytes[i++] = c >> 12 | 224;
                }
                bytes[i++] = c >> 6 & 63 | 128;
            }
            bytes[i++] = c & 63 | 128;
        }
        return bytes.subarray(0, i);
    }

    function decodeUTF8(array) {
        var out, i, len, c;
        var char2, char3;

        out = "";
        len = array.length;
        i = 0;
        while(i < len) {
            c = array[i++];
            switch(c >> 4)
            {
                case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                // 0xxxxxxx
                out += String.fromCharCode(c);
                break;
                case 12: case 13:
                // 110x xxxx   10xx xxxx
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
                case 14:
                    // 1110 xxxx  10xx xxxx  10xx xxxx
                    char2 = array[i++];
                    char3 = array[i++];
                    out += String.fromCharCode(((c & 0x0F) << 12) |
                        ((char2 & 0x3F) << 6) |
                        ((char3 & 0x3F) << 0));
                    break;
            }
        }

        return out;
    }

}



