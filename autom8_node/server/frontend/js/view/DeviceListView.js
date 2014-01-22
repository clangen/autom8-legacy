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
      this.systemModel = autom8.model.SystemModel;
      this.systemModel.on('change', this.redraw, this);
      this.redraw();
    },

    onDestroy: function() {
      this.systemModel.off('change', this.redraw, this);
    },

    redraw: function() {
      var $list = this.$el.find('.list');
      var devices = this.systemModel.get('devices');

      this.clearChildren();
      $list.empty();

      if (!devices || !devices.length) {
        return;
      }

      this.addChild(new autom8.view.AddDeviceRow(), {appendToElement: $list});

      for (var i = 0; i < devices.length; i++) {
        var row = new autom8.view.DeviceRow({ model: devices[i] });
        row.$el.addClass(i % 2 === 0 ? 'even' : 'odd');
        this.addChild(row, {appendToElement: $list});
      }

      this.enable(!this.systemModel.get('running'));
    },

    enable: function(enabled) {
      enabled = enabled || (enabled === undefined);
      this.$('.content').toggleClass('disabled', !enabled);
    }
  });

  namespace("autom8.view").DeviceListView = DeviceListView;
}());
