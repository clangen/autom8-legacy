namespace("autom8.controller").DeviceListController = (function() {
  var View = autom8.mvc.View;

  var Controller = autom8.mvc.Controller.extend({
    onCreate: function(options) {
      this.view = new autom8.mvc.View({
        el: View.elementFromTemplateId('autom8-View-DevicesView'),
        events: {
          "touch .switch-devices-view": function(e) {
            this.trigger('switchview:clicked');
          }
        }
      });

      this.switcherView = this.view.addChild(new autom8.view.SwitcherView());

      this.views = {
        flat: new autom8.view.DeviceListView(),
        grouped: new autom8.view.GroupedDeviceListView()
      };

      this.setDeviceListView(this.views[this.switcherView.getState()], {bindEvents: false});
    },

    onResume: function() {
      this.listView.on('devicerow:clicked', this.onDeviceRowClicked, this);
      this.listView.on('grouprow:clicked', this.onGroupRowClicked, this);
      this.view.on('switchview:clicked', this.onSwitchViewClicked, this);
      autom8.client.on('responseReceived', this.onResponseReceived, this);
      this.refresh();
    },

    onPause: function() {
      this.listView.off('devicerow:clicked', this.onDeviceRowClicked, this);
      this.listView.off('grouprow:clicked', this.onGroupRowClicked, this);
      this.view.off('switchview:clicked', this.onSwitchViewClicked, this);
      autom8.client.off('responseReceived', this.onResponseReceived, this);
    },

    onDeviceRowClicked: function(device) {
      autom8.util.Device.toggleDeviceStatus(device);
    },

    onGroupRowClicked: function(group) {
      autom8.util.Device.toggleDeviceGroupStatus(group);
    },

    setDeviceListView: function(newView, options) {
      if (this.listView === newView) {
        return;
      }

      if (this.listView) {
        this.view.removeChild(this.listView);
        this.listView.off(null, null, this);
      }

      var grouped = (newView === this.views.grouped);
      this.switcherView.setState(grouped ? "grouped" : "flat");

      this.listView = newView;
      this.view.addChild(this.listView);
      this.refresh();

      options = options || { };
      if (options.bindEvents !== false) {
        this.listView.on('devicerow:clicked', this.onDeviceRowClicked, this);
        this.listView.on('grouprow:clicked', this.onGroupRowClicked, this);
      }
    },

    onSwitchViewClicked: function() {
      if (this.listView === this.views.flat) {
        this.setDeviceListView(this.views.grouped);
      }
      else {
        this.setDeviceListView(this.views.flat);
      }
    },

    refresh: function() {
      this.listView.setState("loading");
      autom8.util.Device.getDeviceList();
    },

    onResponseReceived: function(uri, body) {
      body = JSON.parse(body);

      switch (uri) {
        case "autom8://response/get_device_list":
          this.onGetDeviceListResponse(body);
          break;

        case "autom8://response/device_status_updated":
        case "autom8://response/sensor_status_changed":
          this.onDeviceUpdatedResponse(body);
          break;
      }
    },

    onGetDeviceListResponse: function(body) {
      var devices = body.devices;
      
      /* unfortunate: backbone model has a property name attributes */
      _.each(devices, function(device) {
        device.attrs = device.attributes;
        delete device.attributes;
      });

      var options = {
        comparator: function(device) {
          var address = device.get('address');
          var tripped = autom8.util.Device.deviceIsTrippedSensor(device);
          return (tripped ? "0-" : "1-") + address;
        }
      };

      this.deviceList = new autom8.model.DeviceList(devices, options);
      this.listView.setDeviceList(this.deviceList);
      this.listView.setState("loaded");
    },

    onDeviceUpdatedResponse: function(body) {
      var address = body.address;

      this.deviceList.find(_.bind(function(device) {
        if (device.get('address') === address) {
          device.set({'attrs': body.attributes});
          device.set({'status': body.status});
          this.deviceList.sort();
          this.listView.render();
          return true;
        }

        return false;
      }, this));
    }
  });

  return Controller;
}());
