var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var nicknames = [];


//users are stored with their nick names as keys 
//and respectivesockets as their values
var users  = {};
var msgs = [];

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

//when the user points to the browser connection event handler gets called
io.on('connection', function(socket){
	console.log("a user connected to the chat app");

	//event handler when the user exists the browser
	socket.on('disconnect', function(){
		//remove user from the users list
		delete users[socket.nickname];
		console.log('user disconnected');

		//when user disconnects delete all his msgs
		for (var i = msgs.length - 1; i >= 0; i--) {
			var message = msgs[i];
			var sender = message.split('$')[0];
			var receiver = message.split('$')[1];
			if(sender === socket.nickname || receiver === socket.nickname)
				msgs.splice(i, 1);
		};
  	});

	//event handler when the user clicks on the submit button --> chat message
  	socket.on('chat message', function(msg){
  		//when chat is received check if the user is available
  		//if he is send him the message or else store the message

  		var receiver = msg.split('$')[1];
  		var sender = msg.split('$')[0];
  		socket.emit('chat message', {msg: msg.split('$')[2], nick: sender});
  		if (receiver in users) {
  			console.log("sending msg to specified user"+receiver);
  			users[receiver].emit('chat message', {msg: msg.split('$')[2], nick: sender});

  		}else{
  			msgs.push(msg);	
  		}
    	console.log('message: ' + msg);
    	//io.emit('chat message', {msg: msg, nick: socket.nickname});
    	
  	});

  	socket.on('new user', function(username){

  		socket.nickname = username;

  		//user socket stored
  		users[socket.nickname] = socket;
  		console.log("new user: "+username);
  		nicknames.push(socket.nickname);

  		//when a user connects using a nickname
  		//get all his msgs and emit
  		console.log("retrieveing msgs for:"+socket.nickname);
  		for (var i = msgs.length - 1; i >= 0; i--) {
  			var message = msgs[i];
  			console.log(msgs[i]);
  			var receiver = message.split('$')[1];
  			if(receiver === socket.nickname)
  				//send message from msgs and the sender's nickname
  				io.emit('chat message', {msg : message.split('$')[2], nick: message.split('$')[0]});
  		};
  	});
});

http.listen(3000, function(){
	console.log("listening on port 3000! ---> Point Browser to localhost:3000");
});