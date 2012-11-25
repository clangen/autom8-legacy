namespace("autom8").client = (function () {
  function onSocketDisconnected(context, data) {
    context.socket = null;
    context.connected = false;
    context.connecting = false;
    context.trigger('disconnected', 0);
  }

  function onSocketConnected(context, newSocket, data) {
    context.socket = newSocket;
    context.connected = true;
    context.connecting = false;
    context.trigger('connected');
  }

  function stopPinging(context) {
    if (context.pingInterval) {
      clearInterval(context.pingInterval);
      context.pingInterval = null;
    }
  }

  function startPinging(context) {
    stopPinging(context);

    var sendPing = _.bind(function() {
      if (this.connected) {
        this.send("autom8://request/ping", { });
      }
    }, context);

    context.pingInterval = setInterval(sendPing, 20000);
  }

  function Client() {
    this.socket = null;
    this.pinging = false;
    this.connected = false, connecting = false;
  }

  _.extend(Client.prototype, Backbone.Events, {
    connect: function() {
      if (this.connected || this.connecting) {
        return;
      }

      this.connected = false;
      this.connecting = true;
      this.trigger('connecting');

      var href = document.location.href;
      var host = href.substring(0, href.indexOf('/', 'https://'.length));

      var newSocket = io.connect(host, {
        'reconnect': true,
        'reconnection delay': 2000
      });

      var self = this;

      newSocket.on('connect', function(data) {
        startPinging(self);
        onSocketConnected(self, newSocket, data);
      });

      newSocket.on('disconnect', function(data) {
        stopPinging(self);
        onSocketDisconnected(self, data);
      });

      newSocket.on('error', function(data) {
        onSocketDisconnected(self, data);
      });

      newSocket.on('connect_failed', function(data) {
        onSocketDisconnected(self, data);
      });

      newSocket.on('recvMessage', function(data) {
        var uri = data.uri;
        if (uri.indexOf("autom8://request") === 0) {
          self.trigger('requestReceived', data.uri, JSON.stringify(data.body));
        }
        else if (uri.indexOf("autom8://response") === 0) {
          self.trigger('responseReceived', data.uri, JSON.stringify(data.body));
        }
        else {
          console.log("unknown message schema");
        }
      });
    },

    send: function(uri, body) {
      if (this.socket) {
        this.socket.emit('sendMessage', { "uri": uri, "body": body });
      }
    },

    isConnected: function() {
      return this.connected;
    },

    authenticate: function(password) {
      this.trigger("authenticating");

      var self = this;
      $.ajax({
        url: 'signin.action',
        type: 'POST',
        data: {
          password: Crypto.util.bytesToHex(
            Crypto.SHA1(password, { asBytes: true }))
        },
        success: function(data) {
          self.trigger("authenticated");
        },
        error: function (xhr, status, error) {
          self.trigger("disconnected", -99);
        }
      });
    }
  });

  return new Client();
}());
