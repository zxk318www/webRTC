var userPeerConnectionMap = new Map();//用户名和peerConnection对应关系
var username;//登录用户唯一凭证
var userOnlineList;//在线用户
var socket;//websocket链接
var msg;//需要发送的消息
//本地视频流
var locatStream=null;
//webrtc连接通道
var localPeerConnection=null;
//穿透服务器
var config = {
	'iceServers': [
		//{ 'urls': 'stun:stun.xten.com:3478' },
		//{ 'urls': 'stun:stun.voxgratia.org:3478' },
		{ 'url': 'stun:stun.l.google.com:19302' }
	]
};
config = {
	iceServers: [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
	],
	//sdpSemantics: 'unified-plan'
};
//流连接通道
var PeerConnection = (window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.RTCPeerConnection || undefined);
//RTC信令
var RTCSessionDescription = (window.webkitRTCSessionDescription || window.mozRTCSessionDescription || window.RTCSessionDescription || undefined);
//摄像头对象
navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

$.ajax({//需要后台请求获取登录用户名
	url:'/webrtc/login/get_login_user_info_data',
	type:'POST',
	dataType:'Json',
	success:function(data){
		username=data.name;
		//建立websocket链接
		// socket = new WebSocket("wss://"+document.location.host+"/websocket/"+username);
		socket = new WebSocket("ws://127.0.0.1:8080/webrtc/websocket2/"+username);
		init();//在确认登录用户后初始化
	}
})

//初始化
function init(){
//显示摄像头画面
	navigator.getUserMedia({
		"audio": true,
		"video": true
	},function success(stream){
		document.getElementById("localVideo").src = window.URL.createObjectURL(stream);//本地画面投影
		locatStream=stream;//保存流通道
		readyToConnection();//准备向在线用户发送连接请求
	},function error(error){
		console.log(error);
	}
	);
	
	//准备向在线用户发送连接请求
	function readyToConnection(){
		//向socket服务器发送请求得到在线用户
		msg=JSON.stringify({
			'type':'getOnlineUserName'
		});
		socket.send(msg);
		//回复消息onmessage type:userOnlineList
		//1.回复消息时初始化Video框
		//2.初始化username和peerConnection对应关系
		//3.初始化peerConnection绑定视频流addStream
		//4.遍历peerConnection发送Offer
	}
	
	//收到消息
	socket.onmessage=function(Message){
		var jsonObj = JSON.parse(Message.data);
		var type=jsonObj.type;
		var data=jsonObj.data;
		switch (type) {
		case "offer":
			console.log('type offer')
			localPeerConnection=userPeerConnectionMap.get(jsonObj.sendBy);
			var rtcs = new RTCSessionDescription(data);
			localPeerConnection.setRemoteDescription(rtcs);
			
			localPeerConnection.addStream(locatStream);
			
			localPeerConnection.createAnswer(
					function(desc){
						localPeerConnection.setLocalDescription(desc);
						msg=JSON.stringify({
							'sendBy':username,
							'sendTo':jsonObj.sendBy,
							'type' : "answer",
							'data' : desc,
						});
						socket.send(msg);
					},function(error){
			});
			
			localPeerConnection.onicecandidate=function(event){
				console.log("onicecandidate");
				msg=JSON.stringify({
					'sendBy':username,
					'sendTo':jsonObj.sendBy,
					'type':'candidate',
					'data' : event.candidate,
				});
				socket.send(msg);
			}
			
			localPeerConnection.onaddstream = function(event) {
				var src = window.URL.createObjectURL(event.stream);
				$("#"+jsonObj.sendBy+"Video").attr('src', src);
				console.log("被动接受时的onaddstream");
			}
			break;
			
		case "answer":
			console.log('type answer')
			var rtcs = new RTCSessionDescription(data);
			userPeerConnectionMap.get(jsonObj.sendBy).setRemoteDescription(rtcs);
			break;
			
		case "candidate":
			console.log('type candidate')
			userPeerConnectionMap.get(jsonObj.sendBy).addIceCandidate(new RTCIceCandidate(data));
//			localPeerConnection.addIceCandidate(new RTCIceCandidate(data));
			break;
		
		case "userOnlineList":
			userOnlineList=data;
			for(var i=0;i<data.length;i++){
				if(data[i]!=username){
					//初始化videoLabel
					var video = $("<video autoplay id="+data[i]+"Video"+" style='width: 100%;height: 100%;' />")
					var videoContainer=$("<li class='left'/>").append(video);
					$("#videoList").append(videoContainer);
					//初始化username和peerConnection对应关系
					localPeerConnection=new PeerConnection(config);
					userPeerConnectionMap.set(data[i],localPeerConnection);
				}
			}
			//遍历peerConnectionMap
			userPeerConnectionMap.forEach(function (value, key, map) {
				//遍历除自己以外的peerConnection
				if(key!=username){
					value.addStream(locatStream);//初始化绑定本地视频流
					//发送offer
					value.createOffer(
							function(offer){
								value.setLocalDescription(offer);
								msg=JSON.stringify({
									'sendBy':username,
									'sendTo':key,
									'type':'offer',
									'data':offer
								});
								socket.send(msg);
								console.log("发送Offer");
							},
							function(error){}
					)
					//绑定onicecandidate事件
					value.onicecandidate=function(event){
						console.log("发送candidate");
						msg=JSON.stringify({
							'sendBy':username,
							'sendTo':key,
							'type':'candidate',
							'data' : event.candidate,
						});
						socket.send(msg);
					}
					//绑定onaddstream事件
					value.onaddstream = function(event) {
						var src = window.URL.createObjectURL(event.stream);
						$("#"+key+"Video").attr('src', src);
						console.log("主动发起时的onaddstream")
					}
				}
			});
			break;
		
		case "userConnection":
			console.log("新增加视频用户:"+data)
			//新增videoLabel
			var video = $("<video autoplay id="+data+"Video"+" style='width: 100%;height: 100%;' />")
			var videoContainer=$("<li class='left'/>").append(video);
			$("#videoList").append(videoContainer);
			//新增username和peerConnection对应关系
			localPeerConnection=new PeerConnection(config);
			userPeerConnectionMap.set(data,localPeerConnection);
			break;
			
		case "userClose":
			console.log(data+"下线");
			//删除videoLabel
			$("#"+data+"Video").parent().remove();
			//删除username和peerConnection对应关系
			userPeerConnectionMap.delete(data);
			break;
			
		default:
			console.log("default");
		}
	}
}

function deleteVideo(stream){
//locatStream.getVideoTracks()[0].stop();
}
