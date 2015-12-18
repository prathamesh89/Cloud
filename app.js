var express           =     require('express')
  , passport          =     require('passport')
  , util              =     require('util')
  , FacebookStrategy  =     require('passport-facebook').Strategy
  , session           =     require('express-session')
  , cookieParser      =     require('cookie-parser')
  , bodyParser        =     require('body-parser')
  , config            =     require('./configuration/config')
  , app               =     express()
  ,FB                 =     require('fb')
  ,Bing               =     require('node-bing-api')({ accKey: "pMz/2T37XnJYyQnmcayThsInbBqqVPKP7Jp+QiG23F8" })
  ,path               =     require('path')
  ,appDir             =     path.dirname(require.main.filename)
  ,AWS                =     require("aws-sdk")
  ,es                 =     require('elasticsearch')
  ,moment             =     require('moment');

var http = require('http').Server(app);
var io = require('socket.io')(http);

var nicknames = [];
var username = "";

//users are stored with their nick names as keys 
//and respectivesockets as their values
var users  = {};
var msgs = [];

app.get('/chat', function(req, res){
  res.sendFile(__dirname + '/chat/index.html');
});

//CHAT CODE
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
      msg = username + msg;
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
      socket.emit("set username",username);
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
//CHAT CODE

AWS.config.update({
  region: "us-east-1",
  endpoint: "http://dynamodb.us-east-1.amazonaws.com",
  logger: "process.stdout"
});

var es_client = new es.Client({
  host: 'search-test-query-search-kp6zggedhbrtlzu67mewtgnsaa.us-east-1.es.amazonaws.com',
  log: 'trace'
});

///app.use(express.bodyParser());

var dynamodb = new AWS.DynamoDB();
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();
var table = 'User_Table';
var id = 0;
var curr_time = "";
//app.use(express.static('public'));

// Passport session setup.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the FacebookStrategy within Passport.

passport.use(new FacebookStrategy({
    clientID: config.facebook_api_key,
    clientSecret:config.facebook_api_secret ,
    callbackURL: config.callback_url
  },
  function(accessToken, refreshToken, profile, done) {

    process.nextTick(function () {
      //Check whether the User exists or not using profile.id
      //console.log("profile: "+ accessToken);
      FB.setAccessToken(accessToken);
      FB.api('/me/friends',  { locale: 'en_US', fields: 'name, email'}, function(response) {
         //console.log(JSON.stringify(response)+"\n");
           id = profile.id;
           var name = profile.displayName;
           username = name;
           var friends = [];

           for(var i=0; i<response.data.length;i++)
           {
              console.log("Data is: "+JSON.stringify(response.data[i]));
              friends.push(response.data[i].id);
           }
           //console.log(profile.id+" "+profile.displayName);
           console.log("profile is:  "+JSON.stringify(profile));
           var pars={
              TableName:"User_Table",
              Item:{
                "id": id,
                "name": name,
                "friends":friends
              }
           };

          console.log("Adding a new item...");
          dynamodbDoc.put(pars, function(err, data) {
            console.log("weeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
              if (err) {
                  console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
              } else {
                  console.log("Added item:", JSON.stringify(data));
              }
          });

        });
        return done(null, profile);
    });
  }
));


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'keyboard cat', key: 'sid',resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('demo', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/auth/facebook', passport.authenticate('facebook',{scope:'public_profile,email,user_friends'}));


app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect : '/', failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function (req, res){
  req.logout();
  res.redirect('/');
});

app.get('/favicon.ico', function (req,res){

});



app.post('/geturl', function (req, res) {
      //console.log("hhuuiii");
      console.log("The URL::");
      console.log(req.body.url);
      console.log("In GETURL time is "+ curr_time);

      //res.send("OK");
});


app.get('/:keyword', function (req, res) {

/*  var inp = req.params.keyword;
  var start4 = */

  var myText = req.params.keyword;
  console.log(myText);
  var body;
  var q = myText;
  curr_time = moment().format();
  curr_time = id + '|'+curr_time;
  var matches = {};
  var frnds = {};
  var searches =[];
  var toSend = {};


  console.log("curr time is "+ curr_time);

  //code from here removed for dynamo db
  es_client.index({
                index: 'queries',
                type: 'document',
                id: curr_time,
                body: {
                  queries: q 
                }
            }, function(error, response){
              if (error) console.log('error');
              //else console.log(response);
            });


  Bing.web(myText, {
    top: 10,  // Number of results (max 50) 
    skip: 0,   // Skip first 3 results 
  }, function(error, resp, body){
      for(i = 0; i<10; i++){
        var temp ={
          "Title": body.d.results[i].Title,
          "Url" : body.d.results[i].Url,
          "Description" : body.d.results[i].Description
        }
        searches.push(temp);


     } 
     console.log("Search Results: "+JSON.stringify(body.d));
     console.log("length of Searches is: "+searches.length);
     console.log("***********************************");

     for(var i=0; i<10;i++){
        console.log("URL: "+searches[i].Url);
     }

      es_client.search({
      index: 'queries',
      type: 'document',
      body:{
        query: {
          query_string:{
            query: q
          }
        }
      }
    }, function(error, response){
      if (error) console.log("ERROR!");
      else {
        //console.log("WOOOOOOHOOOOO:" + JSON.stringify(response));
            var hit =  response.hits.hits;
            if(response.hits.total == 0){
              toSend = {
                  "bing": searches,
                  "friends": {}
                };
                console.log("Im in total = 0");
                res.send(toSend);
            }
            else{
                  //sdfgdg
            var matches = {};
            for(var i =0; i<hit.length; i++){
              console.log(hit[i]._id);
              var match = hit[i]._id.split("|")[0];
              console.log("Match is: "+match);
              matches[match] = "";
              console.log("------");

            }


            console.log("------------------------------------------------------------------------");
            //svvdfgvfg
            var tempid = id+"";
            var params = {
                TableName : "User_Table",
                KeyConditionExpression: "#id = :id",
                ExpressionAttributeNames:{
                    "#id": "id"
                },
                ExpressionAttributeValues: {
                    ":id":id
                }
            };

            dynamodbDoc.query(params, function(err, data) {
                if (err) {
                    console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Query succeeded.");
                    data.Items.forEach(function(item) {
                        console.log(" -", item.id);
                        for(var i =0 ; i<item.friends.length;i++)
                        {
                            console.log("friend: "+item.friends[i]);
                            frnds[item.friends[i]] = "";
                        }

                    });

                    //Code to get matching friends...
                    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
                    matching_friends = [];
                    for(var key in matches){
                        console.log("In KEY MATCHES...  " +  key);
                        if(key in frnds){
                            console.log("IN KEY FRIENDS..." + key);
                            matching_friends.push(key);
                        }
                    }

                    //Code to get details of friends from DB....
                    var friendz = [];
                    if(matching_friends.length!=0){
                      //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
                      
                      //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
                        for (var i = 0 ; i< matching_friends.length; i++){
                        var temp = matching_friends[i];
                        //adasd
                        var params = {
                          TableName : "User_Table",
                          KeyConditionExpression: "#id = :id",
                          ExpressionAttributeNames:{
                              "#id": "id"
                          },
                          ExpressionAttributeValues: {
                              ":id":temp
                          }
                        };

                        dynamodbDoc.query(params, function(err, data){
                            if(err){
                                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                            }else{
                                data.Items.forEach(function(item){
                                    var temp = {
                                      "id": item.id,
                                      "name": item.name,
                                      "url": "url"
                                    };
                                    console.log("Pushing FRIEND... "+item.id+" NAME : "+item.name);
                                    friendz.push(temp);
                                    if(friendz.length==matching_friends.length){
                                      toSend = {
                                          "bing": searches,
                                          "friends": friendz
                                        };
                                        console.log("Im in total = 1");
                                        res.send(toSend);
                                    }

                                });
                                //res.send(toSend);
                            }

                        });

                          //asdasd
                      }

                    }
                    else{
                      toSend = {
                                  "bing": searches,
                                  "friends": {}
                                };
                                console.log("Im in total = 2");
                                res.send(toSend);
                    }
                    
                }
            });
            //sdfsdfsd

                  //sdfdsf
            }

      }
  });
      //res.send(body.d);
  });
   
  //fetch from database
  
  // res.send json

});


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated())
  {
    console.log("In in ensureAuthenticated"); 
    return next(); 
  }
  res.redirect('/login')
}

//app.listen(8083);
http.listen(8083, function(){
  console.log("listening on port 8083! ---> Point Browser to localhost:8083");
});
// Code to get profile picture of user.
/*FB.api("/me/picture?width=180&height=180",  function(response) {
 
        var profileImage = response.data.url.split('https://')[1], //remove https to avoid any cert issues
            randomNumber = Math.floor(Math.random()*256);
 
       //remove if there and add image element to dom to show without refresh
       if( $fbPhoto.length ){
           $fbPhoto.remove();
       }
         //add random number to reduce the frequency of cached images showing
       $photo.append('<img class=\"fb-photo img-polaroid\" src=\"http://' + profileImage + '?' + randomNumber + '\">');
        $btn.addClass('hide');
    });*/

//---------------------REMOVED DYNAMODB CODE---------------------------------------
