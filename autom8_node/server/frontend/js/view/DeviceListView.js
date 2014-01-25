 (function() {
  var View = autom8.mvc.View;

  function elementToDevice(e) {
    var $el = $(e);
    $el = $el.hasClass('device-row') ? $el : $el.parents('.device-row');

    var index = $el.attr('data-index');
    if (index) {
      index = parseInt(index, 10);
      return this.systemModel.get('deviceList').at(index);
    }
  }

  function running(c) {
    return c.systemModel.get('running');
  }

  var DeviceListView = View.extend({
    template: 'autom8-View-Devices',

    events: {
      'touch .device-row .delete': function(e) {
        if (!running(this)) {
          var d = elementToDevice.call(this, e.currentTarget);
          this.trigger('delete:clicked', d);
        }
      },

      'touch .header .create': function(e) {
        if (!running(this)) {
          this.trigger('create:clicked');
        }
      },

      'touch .device-row': function(e) {
        if (!running(this)) {
          var d = elementToDevice.call(this, e.currentTarget);
          this.trigger('edit:clicked', d);
        }
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
      this.enable(!this.systemModel.get('running'));

      var $list = this.$el.find('.list');
      var $add = this.$el.find('.add-device');
      var deviceList = this.systemModel.get('deviceList');

      this.clearChildren();
      $list.empty();

      if (!deviceList || !deviceList.length) {
        $add.addClass('visible');
        return;
      }

      $add.removeClass('visible');

      for (var i = 0; i < deviceList.length; i++) {
        var row = new autom8.view.DeviceRow({ model: deviceList.at(i) });
        row.$el.addClass(i % 2 === 0 ? 'even' : 'odd');
        row.$el.find('.device-row').attr('data-index', i);
        this.addChild(row, {appendToElement: $list});
      }
    },

    enable: function(enabled) {
      enabled = enabled || (enabled === undefined);
      this.$('.content').toggleClass('disabled', !enabled);
      this.$('.header').toggleClass('disabled', !enabled);
    }
  });

  namespace("autom8.view").DeviceListView = DeviceListView;
}());
