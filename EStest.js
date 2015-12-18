//Creating an elastic search client 
var es = require('elasticsearch');
var es_client = new es.Client({
	host: 'search-test-query-search-kp6zggedhbrtlzu67mewtgnsaa.us-east-1.es.amazonaws.com',
	log: 'trace'
});

//ec2-54-172-15-51.compute-1.amazonaws.com

//Checking is ES instance is alive
/*es_client.ping({
	requestTimeout: 30000,
	hello: "elasticsearch"
}, function(error){
	if(error){
		console.log('error thrown');
	}else{
		console.log('All is Well!');
	}
});*/


//Adding Document to Elastic search
es_client.index({
	index: 'sample',
	type: 'document',
	id: '6',
	body: {
		queries: "how to cook" 
	}
}, function(error, response){
	if (error) console.log('error');
	else console.log(response);
});

/*es_client.search({
	index: 'sample',
	type: 'document',
	body:{
		query: {
			query_string:{
				query: "java"
			}
		}
	}
}, function(error, response){
	if (error) console.log("ERROR MOTHERFUCKER ERROR!");
	else console.log("WOOOOOOHOOOOO:" + JSON.stringify(response));
});*/