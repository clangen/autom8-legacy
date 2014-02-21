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
  var clientProxy = require(shared + 'ClientProxy.js').create();

  prompt.message = "autom8";
  prompt.start();

  function start() {
    config.init(program);

    clientProxy.sessions.on('sendMessage', function(message, socket) {
      clientProxy.send(message.uri, message.body);
    });

    var app = httpServer.create();
    clientProxy.sessions.init(app);
    app.start();

    clientProxy.connect();
  }

  program
    .version("0.6.1")
    .usage('params:')
    .option('--listen <port>', 'port we will listen on', Number, 7902)
    .option('--key <pem>', 'pem file containing the private key used for the https server', String, "../shared/conf/autom8.pem")
    .option('--cert <pem>', 'pem file containing the cert to use for the https server', String, "../shared/conf/autom8.pem")
    .option('--clienthost <hostname>', 'autom8 server to connect to', String, "127.0.0.1")
    .option('--clientport <port>', 'port the autom8 server is listening on', Number, 7901)
    .option('--clientpw <password hash>', 'password for the autom8 server')
    .option('--headless', 'password supplied via stdin is already hashed', Boolean, false)
    .option('--debug', 'enable verbose debug output', Boolean, false)
    .parse(process.argv);

  /* in headless mode we run as a fork'd node node process so we have
  a special communication channel. this channel is used for password
  communication and keep-alive heartbeats */
  if (program.headless) {
    var dieAfterMillis = 7000;
    var heartbeatTimeout = null;

    var dieIfNoHeartbeat = function() {
      console.log("*** FATAL *** controlling program unresponsive, exiting...".red);
      process.exit(101);
    };

    heartbeatTimeout = setTimeout(dieIfNoHeartbeat, dieAfterMillis);

    process.on('message', function(m) {
      switch (m.name) {
        case "password":
          program.clientpw = m.options.value;
          start();
          break;

        case "heartbeat":
          clearTimeout(heartbeatTimeout);
          heartbeatTimeout = setTimeout(dieIfNoHeartbeat, dieAfterMillis);
          break;

        case "die":
          process.exit(102);
          break;
      }
    });
  }
  /* If a password hash wasn't supplied via command-line, read one
  from stdin now, hash it, and cache it. */
  else if (!program.clientpw) {
    var host = program.clienthost;

    var promptOptions = { name: 'password', hidden: true };
    prompt.get(promptOptions, function(error, result) {
      program.clientpw = result.password;
      start();
    });
  }
  /* not headless, password already supplied. we're ready to go! */
  else {
    start();
  }
}());


