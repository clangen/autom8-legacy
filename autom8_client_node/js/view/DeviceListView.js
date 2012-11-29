namespace("autom8.view").DeviceListView = (function() {
  var View = autom8.mvc.View;

  return View.extend({
    events: {
      "touch .device-row": function(e) {
        var $el = $(e.currentTarget);
        var index = parseInt($el.attr("data-index"), 10);
        this.trigger('devicerow:clicked', this.deviceList.at(index));
      },
    },

    onCreate: function(options) {
      this.listView = this.addChild(
        new autom8.mvc.View({el: $('<div class="device-list"></div>')}));

      this.spinnerView = this.addChild(new autom8.view.SpinnerView());

      this.deviceList = null;
      this.currentState = null;

      this.setState("loading"); /* init default view */
    },

    onRender: function() {
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
      options = options || { };
      this.currentState = state;

      switch(state) {
        case "loaded":
          var loading = (!this.deviceList || !this.deviceList.length);
          loading ? this.spinnerView.start() : this.spinnerView.stop();
          break;

        case "loading":
          this.listView.clearChildren();
          this.spinnerView.start();
          break;

        case "disconnected":
          this.listView.clearChildren();
          this.spinnerView.stop();
          break;
      }
    }
  });
}());
