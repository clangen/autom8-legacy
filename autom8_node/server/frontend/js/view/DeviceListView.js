 (function() {
  var View = autom8.mvc.View;

  function elementToDevice(e) {
    var index = $(e).parents('.device-row').attr('data-index');
    if (index) {
      index = parseInt(index, 10);
      return this.systemModel.get('deviceList').at(index);
    }
  }

  var DeviceListView = View.extend({
    template: 'autom8-View-Devices',

    events: {
      'touch .device-row .delete': function(e) {
        var d = elementToDevice.call(this, e.currentTarget);
        this.trigger('delete:clicked', d);
      },

      'touch .device-row.add-device': function(e) {
        this.trigger('add:clicked');
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
      var deviceList = this.systemModel.get('deviceList');

      this.clearChildren();
      $list.empty();

      this.addChild(new autom8.view.AddDeviceRow(), {appendToElement: $list});

      if (!deviceList || !deviceList.length) {
        return;
      }

      for (var i = 0; i < deviceList.length; i++) {
        var row = new autom8.view.DeviceRow({ model: deviceList.at(i) });
        row.$el.addClass(i % 2 === 0 ? 'even' : 'odd');
        row.$el.find('.device-row').attr('data-index', i);
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
