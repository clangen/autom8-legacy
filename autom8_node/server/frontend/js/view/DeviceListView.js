 (function() {
  var View = autom8.mvc.View;

  var DeviceListView = View.extend({
    template: 'autom8-View-Devices',

    events: {
      'touch .device-row.add-device': function(e) {
        console.log("ADD NEW DEVICE!");
      },

      'touch .device-row': function(e) {
        console.log("EDIT DEVICE!");
      }
    },

    onCreate: function(options) {
      this.update(this);
    },

    update: function(model) {
      var $list = this.$el.find('.list');

      if (!model) {
        $list.empty();
        this.model = null;
        return;
      }

      this.model = model;

      if (model.devices) {
        this.clearChildren();
        this.addChild(new autom8.view.AddDeviceRow(), {appendToElement: $list});

        for (var i = 0; i < model.devices.length; i++) {
          var row = new autom8.view.DeviceRow({ model: model.devices[i] });
          row.$el.addClass(i % 2 === 0 ? 'even' : 'odd');
          this.addChild(row, {appendToElement: $list});
        }
      }
    }
  });

  namespace("autom8.view").DeviceListView = DeviceListView;
}());
