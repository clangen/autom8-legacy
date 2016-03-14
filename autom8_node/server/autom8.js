var server = require('./program.js').init();

server.start()

.then(function() {
    console.log("server web-app server up and running!".green);
})

.fail(function() {
  console.log("failed to start server!".red, error);
  process.exit(255);
});