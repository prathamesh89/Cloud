var Bing = require('node-bing-api')({ accKey: "pMz/2T37XnJYyQnmcayThsInbBqqVPKP7Jp+QiG23F8" });
var express = require('express');
var app = express();
var path = require('path');
var appDir = path.dirname(require.main.filename);

app.get('/', function (req, res) {
  res.sendFile(appDir+'/public/fbindex.html');
});


app.use(express.static('public'));

/*app.get('/', function (req, res) {
  res.sendFile(appDir+'/public/index.html');
});*/

console.log("sdfsf: "+appDir);
var server = app.listen(process.env.PORT || 8083, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

app.get('/:keyword', function (req, res) {

  var myText = req.params.keyword;
  console.log(myText);
  var body;

  Bing.web(myText, {
    top: 10,  // Number of results (max 50) 
    skip: 0,   // Skip first 3 results 
  }, function(error, resp, body){
        for(i = 0; i<10; i++){
        console.log(body.d.results[i].Title);
        console.log(body.d.results[i].Url);
        console.log(body.d.results[i].Description);
        console.log(" ");
     }   
      res.send(body.d);    
  });
   
  //fetch from database
  
  // res.send json
});
/*Bing.web("indian restaurants", {
    top: 10,  // Number of results (max 50) 
    skip: 0,   // Skip first 3 results 
  }, function(error, res, body){
 
    // body has more useful information, but for this example we are just 
    // printing the first two results 
    for(i = 0; i<10; i++){
    	console.log(body.d.results[i].Title);
    	console.log(body.d.results[i].Url);
    	console.log(body.d.results[i].Description);
    	console.log(" ");
    }
    //console.log(body.d.results[0].Url);
    //console.log(body.d.results[1].Url);
  });*/