/*
 * autom8Client interface for Node.js
 */
var autom8Client = (function () {
  var socket;
  var pinging = false;
  var connected = false, connecting = false;

  /* Constructor for QT-like signal object */
  function Signal() {
    var cbs = [ ];

    this.connect = function(callback) {
      cbs[cbs.length] = callback;
    };

    this.disconnect = function(callback) {
      for (var i = 0; i < cbs.length; i++) {
        if (cbs[i] === callback) {
          cbs = cbs.splice(i);
          return;
        }
      }
    };

    this.raise = function() {
      for (var i = 0; i < cbs.length; i++) {
        cbs[i].apply(null, arguments);
      }
    };
  }

  var connectedSignal = new Signal();
  var connectingSignal = new Signal();
  var disconnectedSignal = new Signal();
  var requestReceivedSignal = new Signal();
  var responseReceivedSignal = new Signal();

  function connect(host, port, pw) {
    if (connected || connecting) {
      return;
    }

    connected = false;
    
    connecting = true;
    connectingSignal.raise();

    var href = document.location.href;
    host = href.substring(0, href.indexOf('/', 'https://'.length));

    var newSocket = io.connect(host, {
      'reconnect': true,
      'reconnection delay': 2000
    });

    function onSocketDisconnected(data) {
      socket = null;
      connected = false;
      connecting = false;
      disconnectedSignal.raise(0);
    }

    function onSocketConnected(data) {
      socket = newSocket;
      connected = true;
      connecting = false;
      connectedSignal.raise();
    }

    newSocket.on('connect', function(data) {
      onSocketConnected(data);
    });

    newSocket.on('disconnect', function(data) {
      onSocketDisconnected(data);
    });

    newSocket.on('error', function(data) {
      onSocketDisconnected(data);
    });

    newSocket.on('connect_failed', function(data) {
      onSocketDisconnected(data);
    });

    newSocket.on('recvMessage', function(data) {
      var uri = data.uri;
      if (uri.indexOf("autom8://request") === 0) {
        requestReceivedSignal.raise(
          data.uri, JSON.stringify(data.body));
      }
      else if (uri.indexOf("autom8://response") === 0) {
        responseReceivedSignal.raise(
          data.uri, JSON.stringify(data.body));
      }
      else {
        console.log("unknown message schema");
      }
    });
  }

  /* ping the server periodically to test connectivity */
  function sendPing() {
    if (autom8Client && connected) {
      autom8Client.send("autom8://request/ping", { });
    }

    setTimeout(sendPing, 20000);
  }

  if (!pinging) {
    sendPing();
    pinging = true;
  }

  function send(uri, body) {
    if (socket) {
      socket.emit('sendMessage', { "uri": uri, "body": body });
    }
  }

  function isConnected() {
    return connected;
  }

  var hostname = "node.js proxy";
  var hostRegex = /(.*\/\/)(.*)/;
  var match = hostRegex.exec(window.location);

  /* it's too late and i'm too tired to do the regex */
  if (match && match.length > 2) {
    var str = match[2];
    var endPos = str.indexOf(':');
    if (endPos === -1) {
      endPos = str.indexOf('/');
    }

    hostname = (endPos == -1) ? str : str.substr(0, endPos);
  }

  /* values are all stubbed! */
  localStorage["autom8.pref.connection.name"] = hostname;
  localStorage["autom8.pref.connection.host"] = "node.js";
  localStorage["autom8.pref.connection.port"] = 0;
  localStorage["autom8.pref.connection.dirty"] = false;

  /* public api */
  return {
    "connected": connectedSignal,
    "connecting": connectingSignal,
    "disconnected": disconnectedSignal,
    "requestReceived": requestReceivedSignal,
    "responseReceived": responseReceivedSignal,
    "connect": connect,
    "send": send,
    "isConnected": isConnected,
    "isNode": true
  };
}());
