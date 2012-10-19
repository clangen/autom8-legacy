autom8.View.DeviceListView = (function() {
  var View = Backbone.View.extend({
    initialize: function(options) {
      Backbone.View.prototype.initialize.call(this, options);

      this.deviceList = null;
      this.loadingSpinner = null;
      this.$loadingRow = null;
      this.currentState = null;

      var self = this;

      autom8.Touchable.add('#device-list', '.device-row', function(e) {
        var $el = $(e.currentTarget);
        var index = parseInt($el.attr("data-index"), 10);
        self.trigger('devicerow:clicked', self.deviceList.at(index));
      });

      autom8.Touchable.add('#header', '#signout', function(e) {
        self.trigger('signout:clicked');
      });

      this.setState("loading"); /* init state machine */
    },

    render: function() {
      var container = $('#device-list');
      container.empty();

      if ((!this.deviceList) || (_.size(this.deviceList) < 1)) {
        return;
      }

      this.deviceList.each(function(device, index) {
        var $el = autom8.View.DeviceRowFactory.create(device);
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
          $('#status').html('connected<span style="font-size: 85%;"> @</span>');
          $('#hostname').html(localStorage[autom8.Prefs.ConnectionName]);

          var loading = (!this.deviceList || !this.deviceList.length);
          this.showLoadingSpinner(loading);

          if (this.errorDialog) {
            this.errorDialog.close();
          }
          break;

        case "loading":
          $('#status').html("refreshing...");
          $('#hostname').empty();
          $('#device-list').empty();
          this.showLoadingSpinner();

          if (this.errorDialog) {
            this.errorDialog.close();
          }
          break;

        case "disconnected":
          $('#status').html("disconnected");
          $('#hostname').empty();
          $('#device-list').empty();
          this.showLoadingSpinner(false);

          if (!this.errorDialog) {
            var self = this;
            this.errorDialog = autom8.Util.Dialog.show({
              title: "Disconnected",
              message: options.errorMessage,
              icon: autom8.Util.Dialog.Icon.Information,
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
        this.loadingSpinner = autom8.Spinner.create("loading-spinner");
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
}()); /* autom8.Controller.DeviceListView */
