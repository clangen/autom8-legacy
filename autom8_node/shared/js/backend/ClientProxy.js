/*
* The autom8 client! This thing connects to the remote autom8 server
* and does physical sending and receiving of autom8:// messages. The
* exposed "connect" method should be called *after* the https server
* has been started (i.e. after autom8.server.start() has been called).
*/
var TAG = "[client proxy]".magenta;

var Q = require('q');
var _ = require('lodash')._;
var tls = require('tls');
var constants = require('./Constants.js');
var log = require('./Logger.js');
var config = require('./Config.js');

var DEBUG_MESSAGES = false;

/* this = ClientProxy instance */
var dispatchReceivedMessage = function(data) {
  var message = parseMessage.call(this, data);

  if (message) {
    /*
     * The only message we special case is the failed authentication
     * response, because it's a critical error. Everything other type
     * of error is retried until the the user exists the process.
     */
    if (message.uri === constants.responses.authenticate_failed) {
      log.error(TAG, "connection failed: password rejected.");

      if (this.invalidPasswordCallback) {
        this.invalidPasswordCallback();
      }
      else {
        process.exit(99);
      }
    }
    /*
     * If we just connected, send a get_device_list, this is a cheap way
     * to cause all connected webclients to "refresh"
     */
    else if (message.uri === constants.responses.authenticated) {
      this.send(constants.requests.get_device_list);
    }

    this.emit('recvMessage', message);
  }
};

/* this = ClientProxy instance */
var parseMessage = function(data) {
  /* may be a multi-part message. only read until a null terminator, then schedule
  the remainder of the message */
  var terminator;
  for (var i = 0; i < data.length; i++) {
    if (data[i] === 0) {
      terminator = i;
      break;
    }
    terminator = data.length;
  }

  /* terminator not found, partial message */
  if (terminator >= data.length) {
    this.partialMessage = new Buffer(data.toString(), 'base64').toString('utf8');
    return null;
  }

  /* schedule remainder... */
  if (terminator > 0 && terminator < (data.length - 1)) {
    var next = data.slice(terminator);
    data = data.slice(0, terminator);

    // var english = new Buffer(next.toString(), 'base64').toString('utf8');
    // console.log(TAG, "multi-part message... scheduling next chunk...", english);

    setTimeout(function() {
      dispatchReceivedMessage.call(this, next);
    }.bind(this));
  }

  /* convert base64 message to plaintext */
  var plainText = new Buffer(data.toString(), 'base64').toString('utf8');

  if (this.partialMessage) {
    plainText = this.partialMessage + plainText;
    this.partialMessage = null;
  }

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
      log.error(TAG, "ERROR: message parsed failed, reconnecting...");
      this.pendingData = plainText;
      this.reconnect();
    }

    if (DEBUG_MESSAGES && message) {
      if (message.uri !== "autom8://response/pong" &&
          message.uri !== "autom8://request/ping")
      {
        console.log(TAG, "server said: " + JSON.stringify(message));
      }
    }

    return message;
  }

  log.error(TAG, "unable to parse message");
  return null;
};

function ClientProxy(options) {
  if (!options || !options.configKey) {
    throw new Error("ClientProxy ctor missing required field");
  }

  this.configKey = options.configKey;
  this.socketStream = null;
  this.lastBuffer = null;
  this.connected = false;
  this.connecting = false;

  /* ping server every 20 seconds when connected */
  this.sendPing = function() {
    if (!this.closed) {
      if (this.connected) {
        this.send(constants.requests.ping, { });
      }

      setTimeout(this.sendPing.bind(this), 20000);
    }
  };

  this.sendPing();
}

require('util').inherits(ClientProxy, require('events').EventEmitter);

_.extend(ClientProxy.prototype, {
  close: function() {
    this.disconnect();
    this.closed = true;
  },

  reconnect: function(options) {
    if (this.connecting) {
      log.warn(TAG, "reconnect() called but already connecting.");
      return;
    }

    var proceed = true;
    if (options instanceof Error) {
      switch(Error.code) {
        case "ECONNRESET":
          break;

        default:
          proceed = false;
          break;
      }

      log.warn(
        TAG, "error sent to ClientProxy.reconnect():".red,
        this.configKey,
        options.message,
        options.code,
        proceed ? "(reconnect not attempted)".yellow : '(proceeding)'.green);

      return;
    }

    log.info(TAG, "attempting to reconnect...");
    this.disconnect();

    var delay = (options && options.delay) || 5000;

    setTimeout(function() {
      if (!this.connected) {
        this.connect();
      }
    }.bind(this), delay);
  },

  connect: function() {
    if (this.connected) {
      log.warn(TAG, 'connect() called, but already connected. bailing...');
      return;
    }

    var proxyConfig = config.get(this.configKey);
    if (!proxyConfig.host || !proxyConfig.port || !proxyConfig.password) {
      throw new Error("specified config key has incomplete values", this.configKey);
    }

    var connectOptions = {
      host: proxyConfig.host,
      port: proxyConfig.port,
      rejectUnauthorized: !proxyConfig.allowSelfSignedCerts
    };

    var socketStream = tls.connect(connectOptions, function() {
      if (this.socketStream && this.socketStream !== socketStream) {
        /* some other reconnect attempt won */
        this.disconnect(socketStream);
      }
      else {
        /* successful connection, authenticate */
        log.info(TAG, 'connected to autom8 server');
        this.connecting = false;
        this.connected = true;
        this.socketStream = socketStream;

        this.send(constants.requests.authenticate, {
          password: proxyConfig.password
        });
      }
    }.bind(this));

    socketStream.on('error', this.reconnect.bind(this));
    socketStream.on('end', this.reconnect.bind(this));
    socketStream.on('data', dispatchReceivedMessage.bind(this));
  },

  disconnect: function(stream) {
    var deferred = Q.defer();

    log.info(TAG, 'disconnecting...');

    stream = stream || this.socketStream;

    if (stream) {
      stream.removeAllListeners('error');
      stream.removeAllListeners('end');
      stream.removeAllListeners('data');

      try {
        stream.end();
        stream.destroy();
      }
      catch (e) {
        log.error(TAG, 'socket.destroy() threw');
      }

      log.info(TAG, 'ssl socket closed');
    }

    this.lastBuffer = null;
    this.connected = this.connecting = false;
    if (stream === this.socketStream) {
      this.socketStream = null;
    }

    log.info(TAG, 'disconnected.');

    deferred.resolve();
    return deferred.promise;
  },

  send: function(uri, body) {
    if (!this.socketStream) {
      return;
    }

    body = (body || {});
    if (typeof(body) === 'object') {
      body = JSON.stringify(body);
    }

    var plainText = uri + "\r\n" + body;
    var b64 = new Buffer(plainText).toString('base64') + "\0";
    this.socketStream.write(b64);
  },

  setInvalidPasswordCallback: function(cb) {
    this.invalidPasswordCallback = cb;
  }
});

exports = module.exports = {
  create: function(options) {
    return new ClientProxy(options);
  }
};
