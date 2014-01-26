 (function() {
  var View = autom8.mvc.View;

  function elementToDevice(e) {
    var $el = $(e);
    var index = $el.closest('li')[0].dataset.index;
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

      'touch .device-row .save': function (e) {
        if (!running(this) && this.isEditting) {
          var view = this.findViewFromEvent(e);

          if (view) {
            view.save();
            this.isEditting = false;
          }
        }
      },

      'touch .device-row .edit': function (e) {
        if (!running(this) && !this.isEditting) {
          var view = this.findViewFromEvent(e);

          if (view) {
            view.edit();
            this.isEditting = true;
          }
        }
      },

      'touch .header .create': function(e) {
        if (!running(this)) {
          this.trigger('create:clicked');
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

      if (this.isEditting) {
        this.isEditting = false;
      }

      this.clearChildren();
      $list.empty();

      if (!deviceList || !deviceList.length) {
        $add.addClass('visible');
        return;
      }

      $add.removeClass('visible');

      for (var i = 0; i < deviceList.length; i++) {
        var row = new autom8.view.DeviceRow({ model: deviceList.at(i), index: i });
        row.$el.addClass(i % 2 === 0 ? 'even' : 'odd');
        this.addChild(row, {appendToElement: $list});
      }
    },

    enable: function(enabled) {
      enabled = enabled || (enabled === undefined);
      this.$('.content').toggleClass('disabled', !enabled);
      this.$('.header').toggleClass('disabled', !enabled);
    },

    findViewFromEvent: function (e) {
      var d = elementToDevice.call(this, e.currentTarget);
      return this.views.filter(function (view) {
        return view.model.cid === d.cid;
      })[0];
    }
  });

  namespace("autom8.view").DeviceListView = DeviceListView;
}());
