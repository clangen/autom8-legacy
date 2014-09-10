var server = require('./program').init();

server.start()

.then(function() {
  console.log("client web-app server up and running!".green);
})

.fail(function(error) {
  console.log("failed to start server!".red, error);
  process.exit(255);
});