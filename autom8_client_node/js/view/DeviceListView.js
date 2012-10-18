autom8.View.DeviceListView = (function() {
  var View = Backbone.View.extend({
    initialize: function(options) {
      Backbone.View.prototype.initialize.call(this, options);

      this.deviceList = null;
      this.loadingSpinner = null;
      this.$loadingRow = null;
      this.currentState = {state: "loading"};

      var self = this;

      autom8.Touchable.add('#device-list', '.device-row', function(e) {
        var $el = $(e.currentTarget);
        var index = parseInt($el.attr("data-index"), 10);
        self.trigger('devicerow:clicked', self.deviceList.at(index));
      });

      autom8.Touchable.add('#header', '#signout', function(e) {
        self.trigger('signout:clicked');
      });

      autom8.Touchable.add('#error', '.sign-in-button', function(e) {
        self.trigger('signin:clicked');
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
      if (!state && !options && this.currentState) {
        state = this.currentState.state;
        options = this.currentState.options;
      }
      else {
        options = options || { };
      }

      this.currentState = {state: state, options: options};

      switch(state) {
        case "loaded":
          $('#status').html('connected<span style="font-size: 85%;"> @</span>');
          $('#hostname').html(localStorage[autom8.Prefs.ConnectionName]);
          $('#error').hide();

          var loading = (!this.deviceList || !this.deviceList.length);
          this.showLoadingSpinner(loading);
          break;

        case "loading":
          $('#status').html("refreshing...");
          $('#hostname').empty();
          $('#error').hide();
          $('#device-list').empty();
          this.showLoadingSpinner();
          break;

        case "disconnected":
          $('#status').html("disconnected");
          $('#hostname').empty();
          $('#device-list').empty();
          $('#error').show();
          this.showLoadingSpinner(false);

          if (options.errorMessage) {
            $("#error-text").show().html(options.errorMessage);
          }
          else {
            $("#error-text").hide();
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
