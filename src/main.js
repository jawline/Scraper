var Query = require('./qq');

console.log('Querying Registry');

new Query(7).lookingFor('request').lookingFor('hookshot').onHit(function(data) {
	console.log('FOUND: ' + data);
}).done(function(err) {
	console.log(!err ? 'FINISHED NO ISSUE' : 'Error occured');
}).start();