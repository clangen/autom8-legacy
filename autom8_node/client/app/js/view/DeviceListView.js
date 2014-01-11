namespace("autom8.view").DeviceListView = (function() {
  var View = autom8.mvc.View;

  return View.extend({
    events: {
      "touch .device-row": function(e) {
        var $el = $(e.currentTarget);
        var index = Number($el.attr("data-index"));
        this.trigger('devicerow:clicked', this.deviceList.at(index));
      },

      "touch .device-row .extras": function(e) {
          var device = this.deviceFromElement($(e.currentTarget));
          this.trigger('extras:clicked', device);
      }
    },

    onCreate: function(options) {
      this.listView = this.addChild(new autom8.mvc.View({
        className: 'device-list',
        tagName: 'ul'
      }));

      this.spinnerView = this.addChild(new autom8.view.SpinnerView({
        template: '#autom8-View-LoadingRow',
        spinnerSelector: '.loading-spinner'
      }));

      this.deviceList = null;
      this.groupedDeviceList = {};
      this.currentState = null;

      this.setState("loading"); /* init default view */
    },

    onResume: function() {
      if (this.dirty) {
        this.dirty = false;
        this.render();
      }
    },

    onRender: function() {
      if (this.paused) {
        this.dirty = true;
        return;
      }

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

    resort: function() {
      if (this.deviceList) {
        this.deviceList.sort();
        this.render();
      }
    },

    setDeviceList: function(deviceList) {
      if (this.deviceList === deviceList) {
        return;
      }

      this.deviceList = deviceList;
      this.render();
    },

    setState: function(state, options) {
      options = options || { };
      this.currentState = state;

      switch(state) {
        case "loaded":
          var loading = (!this.deviceList || !this.deviceList.length);
          this.spinnerView[loading ? 'start' : 'stop']();
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
    },

    deviceFromElement: function($el) {
      var $root = $el.parents('.device-row');
      if ($root) {
        var index = $root.attr('data-index');
        if (index) {
          return this.deviceList.at(Number(index));
        }
      }
      return null;
    }
  });
}());
