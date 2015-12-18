var result_from_server;
$(document).ready(function(){
	$("button").click(function(){
		var temp = document.getElementById("searchtext").value;
		$.getJSON(temp, function(result){
			result_from_server = result;
			var letters = "";
			for(i=0;i<10;i++){
				console.log(result.results[i].Url);
				letters += "<li id = 'tilte'>"  + result.results[i].Title + "</li>" + "<a href=" + result.results[i].Url+ ">"+ result.results[i].Url + "</a>"  + "<br>" + "<h3>" + result.results[i].Description + "</h3>" + "<br>";
			 }
			 document.getElementById("itemList").innerHTML = letters;

		});
	});
});