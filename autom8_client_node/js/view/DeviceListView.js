namespace("autom8.view").DeviceListView = (function() {
  function getDisconnectMessage(reason) {
    switch(reason) {
      case 1: return "Could not connect to server.";
      case 2: return "SSL handshake failed.";
      case 3: return "Invalid username or password.";
      case 4: return "Server sent an invalid message.";
      case 5: return "Read failed.";
      case 6: return "Write failed.";
      default: return "Connection timeout.";
    }
  }

  var View = autom8.mvc.View.extend({
    events: {
      "touch .device-row": function(e) {
        var $el = $(e.currentTarget);
        var index = parseInt($el.attr("data-index"), 10);
        this.trigger('devicerow:clicked', this.deviceList.at(index));
      },

      "touch #signout": function(e) {
        this.trigger('signout:clicked');
      }
    },

    onCreate: function(options) {
      this.deviceList = null;
      this.loadingSpinner = null;
      this.$loadingRow = null;
      this.currentState = null;
      this.setState("loading"); /* init default view */
    },

    render: function() {
      var container = $('#device-list');
      container.empty();

      if ((!this.deviceList) || (_.size(this.deviceList) < 1)) {
        return;
      }

      this.deviceList.each(function(device, index) {
        var $el = autom8.view.DeviceRowFactory.create(device);
        $el.attr("data-index", index);
        container.append($el);
      });
    },

    setDeviceList: function(deviceList) {
      this.deviceList = deviceList;
      this.render();
    },

    setState: function(state, options) {
      if (state === this.currentState) {
        return;
      }

      options = options || { };
      this.currentState = state;

      switch(state) {
        case "loaded":
          $('#status').html('connected');
          $('.header-host-separator').html('@');
          $('#hostname').html(localStorage[autom8.Prefs.ConnectionName]);

          var loading = (!this.deviceList || !this.deviceList.length);
          this.showLoadingSpinner(loading);

          if (this.errorDialog) {
            this.errorDialog.close();
          }
          break;

        case "loading":
          $('#status').html("refreshing...");
          $('.header-host-separator').html('');
          $('#hostname').html('');
          $('#device-list').empty();
          this.showLoadingSpinner();

          if (this.errorDialog) {
            this.errorDialog.close();
          }
          break;

        case "disconnected":
          $('#status').html("disconnected");
          $('.header-host-separator').html('');
          $('#hostname').empty();
          $('#device-list').empty();
          this.showLoadingSpinner(false);

          if (!this.errorDialog) {
            var self = this;
            this.errorDialog = autom8.util.Dialog.show({
              title: "Disconnected",
              message: getDisconnectMessage(options.errorCode),
              icon: autom8.util.Dialog.Icon.Information,
              buttons: [{
                  caption: "reconnect",
                  callback: function() {
                    self.trigger('signin:clicked');
                  },
                  positive: true,
                  negative: true
              }],
              onClosed: function() {
                self.errorDialog = null;
              }
            });
          }
          break;
      }
    },

    showLoadingSpinner: function(show) {
      show = (show !== undefined) ? show : true;

      if (!this.loadingSpinner) {
        this.loadingSpinner = autom8.util.Spinner.create("loading-spinner");
        this.$loadingRow = $("#loading-row");
      }

      if (show) {
        this.$loadingRow.show();
        this.loadingSpinner.start();
      }
      else {
        this.$loadingRow.hide();
        this.loadingSpinner.stop();
      }
    }
  });

  return View;
}());
