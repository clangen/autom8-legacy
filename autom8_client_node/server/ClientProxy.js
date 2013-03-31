/*
 * The autom8 client! This thing connects to the remote autom8 server
 * and does physical sending and receiving of autom8:// messages. The
 * exposed "connect" method should be called *after* the https server
 * has been started (i.e. after autom8.server.start() has been called).
 */
(function() {
  var tls = require('tls');

  var constants = require('./Constants.js');
  var config = require('./Config.js').get();
  var sessions = require('./Sessions.js');

  var socketStream = null;
  var lastBuffer = null;
  var connected = false;
  var connecting = false;

  /* ping server every 20 seconds when connected */
  (function sendPing() {
    if (connected) {
      send(constants.requests.ping, { });
    }

    setTimeout(sendPing, 20000);
  }());

  function reconnect(err) {
    if (connecting) {
      console.log("reconnect() called but already connecting.");
      return;
    }

    console.log("attempting to reconnect...");
    disconnect();

    setTimeout(function() {
      if (!connected) {
        connect();
      }
    }, 5000);
  }

  function connect() {
    if (connected) {
      console.log('connect() called, but already connected. bailing...');
      return;
    }

    var cfg = config.client;

    var connectOptions = {
      host: cfg.host,
      port: cfg.port,
      rejectUnauthorized: !config.allowSelfSignedCerts
    };

    socketStream = tls.connect(connectOptions, function() {
      if (socketStream !== this) {
        /* some other reconnect attempt won */
        disconnect(this);
      }
      else {
        /* successful connection, authenticate */
        console.log('connected to autom8 server');
        connecting = false;
        connected = true;

        send(
          constants.requests.authenticate, {
            password: cfg.password
          }
        );
      }
    });

    socketStream.on('error', reconnect);
    socketStream.on('end', reconnect);
    socketStream.on('data', dispatchReceivedMessage);
  }

  function disconnect(stream) {
    console.log('disconnecting...');

    stream = stream || socketStream;

    if (stream) {
      stream.removeAllListeners('error');
      stream.removeAllListeners('end');
      stream.removeAllListeners('data');

      try {
        stream.destroy();
      }
      catch (e) {
        console.log('socket.destroy() threw');
      }
    }

    lastBuffer = null;
    connected = connecting = false;
    if (stream === socketStream) {
      socketStream = null;
    }

    console.log('disconnected.');
  }

  function send(uri, body) {
    if (!socketStream) {
      return;
    }

    body = (body || {});

    if (typeof(body) === 'object') {
      body = JSON.stringify(body);
    }

    var plainText = uri + "\r\n" + body;
    var b64 = new Buffer(plainText).toString('base64') + "\0";
    socketStream.write(b64);
  }

  function dispatchReceivedMessage(data) {
    var message = parseMessage(data);

    if (message) {
      /*
       * The only message we special case is the failed authentication
       * response, because it's a critical error. Everything other type
       * of error is retried until the the user exists the process.
       */
      if (message.uri === constants.responses.authenticate_failed) {
        console.log("connection failed: password rejected.");
        process.exit(-99);
      }
      /*
       * If we just connected, send a get_device_list, this is a cheap way
       * to cause all connected webclients to "refresh"
       */
      else if (message.uri === constants.responses.authenticated) {
        send(constants.requests.get_device_list);
      }

      sessions.broadcast(message);
    }
  }

  function parseMessage(data) {
    /* if there was a left-over buffer, construct a new buffer and
       concat it with the new one */
    if (lastBuffer) {
      var newData = new Buffer(lastBuffer.length + data.length);
      lastBuffer.copy(newData, 0, lastBuffer);
      data.copy(newData, lastBuffer.length, data);
      data = newData;
      lastBuffer = null;
    }

    /* find the null terminator in the buffer, this is EOM */
    var terminator;
    for (var i = 0; i < data.length; i++) {
      if (data[i] === 0) {
        terminator = i;
        break;
      }
    }

    /* split the buffer, if necessary */
    if (terminator) {
      if (terminator < (data.length - 1)) {
        console.log("input message will be sliced at " + terminator);
        lastBuffer = data.slice(terminator);
      }

      /* convert base64 message to plaintext */
      var plainText = new Buffer(data.toString(), 'base64').toString('utf8');
      var parts = plainText.split("\r\n");

      /* parse the payload */
      if (parts.length === 2) {
        var message = null;

        try {
          message = {
            uri: parts[0],
            body: JSON.parse(parts[1])
          };
        }
        catch (parseError) {
          console.log("ERROR: message parsed failed, reconnecting...");
          lastBuffer = null;
          reconnect();
        }

        if (config.debug) {
          console.log("server said: " + JSON.stringify(message));
        }

        return message;
      }
    }

    console.log("unable to parse message");
    return null;
  }

  /* ClientProxy public API */
  exports.connect = connect;
  exports.disconnect = disconnect;
  exports.send = send;
}());