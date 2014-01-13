// npm install commander express socket.io socket.io-client less closurecompiler clean-css prompt
// node.exe main.js --listen 7902 --creds ../shared/conf/autom8.pem --clienthost 127.0.0.1 --clientport 7901 --debug

(function() {
  var program = require('commander');
  var prompt = require('prompt');
  require('colors');

  var shared = "./../shared/js/backend/";
  var config = require(shared + 'Config.js');
  var httpServer = require(shared + 'HttpServer.js');
  var util = require(shared + 'Util.js');
  var sessions = require(shared + 'Sessions.js');

  var clientProxy = require('./backend/ClientProxy.js');

  prompt.message = "autom8";
  prompt.start();

  function start() {
    config.init(program);

    sessions.on('sendMessage', function(message, socket) {
      clientProxy.send(message.uri, message.body);
    });

    var app = httpServer.create();
    sessions.init(app);
    app.start();

    clientProxy.connect();
  }

  program
    .version("0.3.2")
    .usage('params:')
    .option('--listen <port>', 'port we will listen on')
    .option('--creds <pem>', 'pem file containing both cert and private key')
    .option('--clienthost <hostname>', 'autom8 server to connect to')
    .option('--clientport <port>', 'port the autom8 server is listening on')
    .option('--clientpw <password hash>', 'password for the autom8 server')
    .option('--debug', 'enable verbose debug output', Boolean, false)
    .parse(process.argv);

  /* If a password hash wasn't supplied via command-line, read one
  from stdin now, hash it, and cache it. */
  if (!program.clientpw) {
    var host = program.clienthost;

    var promptOptions = { name: 'password', hidden: true };
    prompt.get(promptOptions, function(error, result) {
      program.clientpw = util.sha256(result.password);
      start();
    });
  }
  /* start it up */
  else {
    start();
  }
}());


