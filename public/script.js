$(document).ready(function(){
	
	var config = {
		siteURL		: 'tutorialzine.com',	// Change this to your site
		searchSite	: true,
		type		: 'web',
		append		: false,
		perPage		: 10,			// A maximum of 8 is allowed by Google
		page		: 0				// The start page
	}
	
	// The small arrow that marks the active search icon:
	var arrow = $('<span>',{className:'arrow'}).appendTo('ul.icons');
	var socket = null;
	var receipient = "";
	var sender = "";
	var myUsername = "";
	
	$('ul.icons li').click(function(){
		var el = $(this);
		
		if(el.hasClass('active')){
			// The icon is already active, exit
			return false;
		}
		
		el.siblings().removeClass('active');
		el.addClass('active');
		
		// Move the arrow below this icon
		arrow.stop().animate({
			left		: el.position().left,
			marginLeft	: (el.width()/2)-4
		});
		
		// Set the search type
		config.type = el.attr('data-searchType');
		$('#more').fadeOut();
	});
	
	// Adding the site domain as a label for the first radio button:
	$('#siteNameLabel').append(' '+config.siteURL);
	
	// Marking the Search tutorialzine.com radio as active:
	$('#searchSite').click();	
	
	// Marking the web search icon as active:
	$('li.web').click();
	
	// Focusing the input text box:
	$('#s').focus();

	$('#searchForm').submit(function(){
		var temp = document.getElementById("s").value;
		//alert(temp);
		var pageContainer = $('<div>',{className:'pageContainer'});

		googleSearch();
		return false;
	});


	/*$("document").live("click", "div.webResult",function(){
    	alert("yay!!!");
	});*/

	$(document.body).on('click', 'button', function() {
    	//alert ('button ' + this.id + ' clicked');
    	var clicked = this.id;

    	if(clicked.substring(0,3) == "fri"){
    		var frnd = document.getElementById(clicked).innerHTML;
    		console.log("RECEIEVER SELECTED: "+frnd);
    		console.log("SENDER SELECTED: "+myUsername);
    		receipient = frnd;
    	}
    	else if(clicked == "click2chat"){
    		socket = io();
    		console.log("initialized socket");
    		socket.on('chat message', function(msg){
    			console.log("MESSAGE RECEIVED FROM SERVER: "+msg);
    			var _sender = msg.split('$')[0];
    			var _msg = msg.split('$')[2];
    			//if new sender then set sender as new sender and create a button
    			if(_sender!=myUsername && _sender!=sender){
    				var buttons = '<button id="friends|'+_sender+'">'+_sender+'</button><br/>';
					$("#button_frnd").append(buttons); 
					sender = _sender;   			
				}
	         	$('#messages').append($('<li>').text(_sender+" : "+_msg));
	     
	        });
			
	        socket.on("set username", function(user){
	        	
	        		console.log("YOUR USERNAME SET TO: "+ user);
	        		myUsername = user;
	        		//socket.emit("new user", user);
	        });
    	}

    	/*if(clicked ){
	    	var temp = clicked.substring(5,clicked.length);
	    	//salert(temp);
	    	var link = ""
	    	link = document.getElementById("urlid"+temp).innerText;
	    	//link = link.substring(8,link.length);
	    	alert(link);

	    	var data = {"url1":link};
	    	console.log(JSON.stringify(data));
	    	$.post( "/geturl", { url: link });
    	}*/
    	// $.getJSON(link,function(r){
    	// 	console.log("Here");
    	// 	console.log(JSON.stringify(r));
    	// });

 //    	$.ajax({
 //            type: 'GET',
 //            data: JSON.stringify({"key":"value"}),
  
 //            contentType: "application/json",
 //            //contentType: "application/x-www-form-urlencoded",
 //            dataType:'json',
 //            url: 'http://facebooktest.com:8083/notifications',                      
 //            success: function(data) {
 //                console.log('success');
 //                console.log(JSON.stringify(data));                               
 //            },
 //            error: function(error) {
 //                console.log("some error in fetching the notifications");
 //                console.log(JSON.stringify(error));
 //             }

 //        });
    	
	});
	
	$('#searchSite,#searchWeb').change(function(){
		// Listening for a click on one of the radio buttons.
		// config.searchSite is either true or false.
		
		config.searchSite = this.id == 'searchSite';
	});

	 $('#chat').click(function(){

          var msg = myUsername+"$"+receipient+"$"+$('#m').val();
          console.log("CHAT SENT: "+msg);
          socket.emit('chat message', msg);
          $('#m').val('');
          return false;
     });
	
	
	function googleSearch(settings){
		
		// If no parameters are supplied to the function,
		// it takes its defaults from the config object above:
		
		settings = $.extend({},config,settings);
		settings.term = settings.term || $('#s').val();
		
		if(settings.searchSite){
			// Using the Google site:example.com to limit the search to a
			// specific domain:
			settings.term = 'site:'+settings.siteURL+' '+settings.term;
		}
		
		// URL of Google's AJAX search API
		var apiURL = 'http://ajax.googleapis.com/ajax/services/search/'+settings.type+'?v=1.0&callback=?';
		var resultsDiv = $('#resultsDiv');

		var temp = document.getElementById("s").value;
		//alert(temp);

		console.log("here...");
		
		$.getJSON(temp,function(r){

			/*for(i=0;i<10;i++){
				//pageContainer.append(new result(result.results[i]) + '');

				console.log(r.results[i].Url);
				//letters += "<li id = 'tilte'>"  + result.results[i].Title + "</li>" + "<a href=" + result.results[i].Url+ ">"+ result.results[i].Url + "</a>"  + "<br>" + "<p>" + result.results[i].Description + "</p>" + "<br>";
			 }*/
			console.log("R is:"+ JSON.stringify(r));
			var results = r.bing;
			var friends = r.friends;

			displayFriends(friends);
			
			$('#more').remove();
			
			if(results.length){
				
				// If results were returned, add them to a pageContainer div,
				// after which append them to the #resultsDiv:
				
				var pageContainer = $('<div>',{className:'pageContainer'});
				
				for(var i=0;i<results.length;i++){
					// Creating a new result object and firing its toString method:
					console.log("Results are: "+result(results[i]),i);
					pageContainer.append(new result(results[i], i) + '');
				}
				
				if(!settings.append){
					// This is executed when running a new search, 
					// instead of clicking on the More button:
					resultsDiv.empty();
				}
				
				pageContainer.append('<div class="clear"></div>')
							 .hide().appendTo(resultsDiv)
							 .fadeIn('slow');
				
			/*	var cursor = r.responseData.cursor;
				
				// Checking if there are more pages with results, 
				// and deciding whether to show the More button:
				
				if( +cursor.estimatedResultCount > (settings.page+1)*settings.perPage){
					$('<div>',{id:'more'}).appendTo(resultsDiv).click(function(){
						googleSearch({append:true,page:settings.page+1});
						$(this).fadeOut();
					});
				}*/
			}
			else {
				
				// No results were found for this search.
				
				resultsDiv.empty();
				$('<p>',{className:'notFound',html:'No Results Were Found!'}).hide().appendTo(resultsDiv).fadeIn();
			}
		});
	}
	
	function result(r,num){
		
		// This is class definition. Object of this class are created for
		// each result. The markup is generated by the .toString() method.
		var Check = 'Check'
		var arr = [];
		arr = [
					'<div class="webResult">',
					'<h2><a href="',r.Url,'" target="_blank">',r.Title,'</a></h2>',
					'<p>',r.Description,'</p>',
					'<a id=urlid'+num+ ' href="',r.Url,'" target="_blank">',r.Url,'</a>',
					'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<button class="hem" id="check'+num+'">Check</button>',
					'</div>'
				];
		
		// The toString method.
		this.toString = function(){
			return arr.join('');
		}
	}

	function displayFriends(friends){

		var buttons ="";

		for(var i =0; i< friends.length; i++){
			buttons += '<button id="friends|'+ friends[i].name+'">'+friends[i].name+'</button><br/>';

		}
		$("#button_frnd").html(buttons);

	}

	function selectReceipient(friend){
        receipient = friend;
    }


	
	
});
