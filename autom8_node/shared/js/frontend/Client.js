namespace("autom8").client = (function () {
  function setState(context, state, options) {
    if (context.state === state) {
      return;
    }

    context.state = state;
    context.trigger(state, options);
    context.trigger('state:changed', state, options);
  }

  function onSocketExpired(context, options) {
    if (context.socket) {
      context.socket.removeAllListeners();
      context.socket.disconnect();
    }

    onSocketDisconnected(context, "expired", options);
  }

  function onSocketDisconnected(context, data, options) {
    checkSignedIn(context);
    stopPinging(context);

    context.socket = null;
    context.connected = false;
    context.connecting = false;

    /* if we're expired don't raise a disconnect signal because
    it will just be confusing for the user */
    if (data === "handshake error" || data === "expired") {
      setState(context, 'expired', options);
    }
    else {
      setState(context, 'disconnected', options || {errorCode: 0});
    }
  }

  function onSocketConnected(context, newSocket, data) {
    startPinging(context);

    context.socket = newSocket;
    context.expired = false;
    context.connected = true;
    context.connecting = false;

    setState(context, 'connected');
  }

  function checkSignedIn(context) {
    if (context.checkingSignIn) {
      return;
    }

    context.checkingSignIn = true;

    $.ajax({
      url: 'signedin.action',
      type: 'GET',
      success: function(data) {
        context.checkingSignIn = false;
      },
      error: function (xhr, status, error) {
        context.checkingSignIn = false;

        if (xhr.status === 401) {
          setState(context, 'expired', {silent: true});
        }
      }
    });
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
    connect: function(options) {
      if (this.connected || this.connecting) {
        return;
      }

      if (this.state === "expired") {
        return;
      }

      options = options || { };
      this.connected = false;
      this.connecting = true;
      setState(this, 'connecting');

      var href = document.location.href;
      var host = href.substring(0, href.indexOf('/', 'https://'.length));

      var newSocket = io.connect(host, {
        'reconnect': false,
        'transports': autom8.Config.connection.transports,
        /* internal socket.io socket may already be created and
        cached with old session cookie. when we set this flag we
        force recreation of the internal socket so connection can
        succeed */
        'force new connection': true
      });

      var self = this;

      newSocket.on('connect', function(data) {
        /* we set this to false because if we get disconnected after
        we've connected, we *do* want to display an error dialog; we
        don't want to display an error dialog if the connection attempt
        itself fails. */
        options.silent = false;

        onSocketConnected(self, newSocket, data);
      });

      newSocket.on('disconnect', function(data) {
        onSocketDisconnected(self, data, options);
      });

      newSocket.on('error', function(data) {
        onSocketDisconnected(self, data, options);
      });

      newSocket.on('connect_failed', function(data) {
        onSocketDisconnected(self, data, options);
      });

      newSocket.on('reconnect_failed', function(data) {
        onSocketDisconnected(self, data, options);
      });

      newSocket.on('reconnecting', function(data) {
        onSocketDisconnected(self, data, options);
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

    getState: function() {
      return this.state;
    },

    signOut: function() {
      setState(this, 'expiring');

      var self = this;
      $.ajax({
        url: 'signout.action',
        type: 'POST',
        success: function(data) {
          onSocketExpired(self, {silent: true});
        },
        error: function (xhr, status, error) {
      }});
    },

    authenticate: function(password) {
      setState(this, 'authenticating');
      var deferred = Q.defer();

      if (this.state === "connected" || this.state === "authenticated") {
        deferred.resolve();
        return deferred.promise();
      }

      var self = this;
      $.ajax({
        url: 'signin.action',
        type: 'POST',
        data: {
          password: CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex)
        },
        success: function(data) {
          setState(self, 'authenticated');
          deferred.resolve();
        },
        error: function (xhr, status, error) {
          if (xhr.status === 400 || xhr.status === 401) {
            setState(self, 'expired');
          }
          else {
            setState(self, 'disconnected', {errorCode: -99});
          }

          deferred.reject();
        }
      });

      return deferred.promise;
    }
  });

  return new Client();
}());
