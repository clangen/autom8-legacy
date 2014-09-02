var server = require('./program').init();

server.start()

.then(function() {
  console.log("client web-app server up and running!".green);

  // setTimeout(function() {
  // 	debugger;
  // 	server.stop().then(function() {
  // 		setTimeout(function() {
  // 			debugger;
  // 			server.start();
  // 		}, 10000);
  // 	})
  // }, 2500);
})

.fail(function(error) {
  console.log("failed to start server!".red, error);
  process.exit(255);
});