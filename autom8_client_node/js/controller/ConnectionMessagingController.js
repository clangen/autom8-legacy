namespace("autom8.controller").ConnectionMessagingController = (function() {
  function getDisconnectMessage(reason) {
    switch(reason) {
      case 1: return "Could not connect to server.";
      case 2: return "SSL handshake failed.";
      case 3: return "Invalid username or password.";
      case 4: return "Server sent an invalid message.";
      case 5: return "Read failed.";
      case 6: return "Write failed.";
      case -1: return "Session expired, please sign in again.";
      case -99: return "Failed to sign in. Please check your password and try again.";
      default: return "Connection timeout.";
    }
  }

  function stopTryingToReconnect(context) {
    context.backoff = 1000;
    if (context.timeout) {
      clearTimeout(context.timeout);
      context.timeout = null;
    }
  }

  return autom8.mvc.Controller.extend({
    onCreate: function(options) {
      this.backoff = 1000;
      this.timeout = null;
    },

    onResume: function(options) {
      autom8.client.on('state:changed', this.onStateChanged, this);
    },

    onPause: function() {
      autom8.client.off('connected', this.onStateChanged, this);
    },

    onStateChanged: function(state, options) {
      options = options || { };

      switch (state) {
        case 'disconnected':
          if (!options.silent) {
            this.showDisconnectedDialog(options);
          }

          if (!this.timeout) {
            var self = this;
            this.timeout = setTimeout(function() {
              autom8.client.connect({silent: true});
              self.backoff *= 2;
              self.timeout = null;
            }, this.backoff);
          }
          break;

        case 'expired':
          stopTryingToReconnect(this);

          if (!options.silent) {
            this.showDisconnectedDialog({errorCode: -99});
          }
          break;

        case 'connected':
        case 'authenticated':
          stopTryingToReconnect(this);

          if (this.errorDialog) {
            this.errorDialog.close();
            this.errorDialog = null;
          }
          break;
      }
    },

    showDisconnectedDialog: function(options) {
      if (this.errorDialog) {
        this.errorDialog.close();
      }

      var invalidPassword = (options.errorCode === -99);
      var title = invalidPassword ? "Sign in failed" : "Disconnected";
      var event = invalidPassword ? "signin:clicked" : "reconnect:clicked";
      var button = invalidPassword ? "ok" : "reconnect";

      var self = this;
      this.trigger('dialog:opened');

      this.errorDialog = autom8.util.Dialog.show({
        title: title,
        message: getDisconnectMessage(options.errorCode),
        icon: autom8.util.Dialog.Icon.Information,
        buttons: [{
            caption: button,
            callback: function() {
              if (!invalidPassword) {
                autom8.client.connect();
              }
            },
            positive: true,
            negative: true
        }],
        onClosed: function() {
          self.errorDialog = null;
          self.trigger('dialog:closed');
        }
      });
    }
  });
}());