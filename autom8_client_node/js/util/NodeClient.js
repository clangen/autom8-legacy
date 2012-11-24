var autom8Client = namespace("autom8").client = (function () {
  var socket;
  var pinging = false;
  var connected = false, connecting = false;

  /* legacy cruft, should be replaced by Backbone.Event */
  function Signal() {
    this.cbs = [];
  }

  _.extend(Signal.prototype, {
    connect: function(callback) {
      this.cbs[this.cbs.length] = callback;
    },

    disconnect: function(callback) {
      for (var i = 0; i < this.cbs.length; i++) {
        if (this.cbs[i] === callback) {
          this.cbs = this.cbs.splice(i);
          return;
        }
      }
    },

    raise: function() {
      for (var i = 0; i < this.cbs.length; i++) {
        this.cbs[i].apply(null, arguments);
      }
    }
  });

  var authenticatingSignal = new Signal();
  var authenticatedSignal = new Signal();
  var connectedSignal = new Signal();
  var connectingSignal = new Signal();
  var disconnectedSignal = new Signal();
  var requestReceivedSignal = new Signal();
  var responseReceivedSignal = new Signal();

  function connect() {
    if (connected || connecting) {
      return;
    }

    connected = false;
    connecting = true;
    connectingSignal.raise();

    var href = document.location.href;
    var host = href.substring(0, href.indexOf('/', 'https://'.length));

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

  function authenticate(password) {
    this.authenticating.raise();

    $.ajax({
      url: 'signin.action',
      type: 'POST',
      data: {
        password: Crypto.util.bytesToHex(
          Crypto.SHA1(password, { asBytes: true }))
      },
      success: function(data) {
        authenticatedSignal.raise();
      },
      error: function (xhr, status, error) {
        disconnectedSignal.raise(-99);
      }
    });
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

  /* public api */
  return {
    /* signals */
    "authenticating": authenticatingSignal,
    "authenticated": authenticatedSignal,
    "connecting": connectingSignal,
    "connected": connectedSignal,
    "disconnected": disconnectedSignal,
    "requestReceived": requestReceivedSignal,
    "responseReceived": responseReceivedSignal,
    /* methods */
    "authenticate": authenticate,
    "connect": connect,
    "send": send,
    "isConnected": isConnected
  };
}());
