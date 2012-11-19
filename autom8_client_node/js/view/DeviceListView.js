namespace("autom8.view").DeviceListView = (function() {
  var View = autom8.mvc.View;

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

  var DeviceListView = View.extend({
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
      this.listView = this.addChild(
        new autom8.mvc.View({el: $('#device-list')}));

      this.spinnerView = this.addChild(new autom8.view.SpinnerView());

      this.deviceList = null;
      this.currentState = null;

      this.setState("loading"); /* init default view */
    },

    render: function() {
      this.listView.clearChildren();

      if ((!this.deviceList) || (_.size(this.deviceList) < 1)) {
        return;
      }

      var self = this;
      this.deviceList.each(function(device, index) {
        var deviceRow = autom8.view.DeviceRowFactory.create(device);
        deviceRow.$el.attr("data-index", index);
        self.listView.addChild(deviceRow);
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
          loading ? this.spinnerView.start() : this.spinnerView.stop();

          if (this.errorDialog) {
            this.errorDialog.close();
          }
          break;

        case "loading":
          $('#status').html("refreshing...");
          $('.header-host-separator').html('');
          $('#hostname').html('');
          $('#device-list').empty();
          this.spinnerView.start();

          if (this.errorDialog) {
            this.errorDialog.close();
          }
          break;

        case "disconnected":
          $('#status').html("disconnected");
          $('.header-host-separator').html('');
          $('#hostname').empty();
          $('#device-list').empty();
          this.spinnerView.stop();

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
    }
  });

  return DeviceListView;
}());
