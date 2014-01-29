 (function() {
  var View = autom8.mvc.View;

  function elementToDevice(e) {
    var $el = $(e);
    var index = $el.closest('li')[0].dataset.index;
    if (index === '-1') {
      return;
    }

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

      'touch .device-row .save': function(e) {
        if (!running(this)) {
          var view = this.findViewFromEvent(e);

          if (view) {
            view.save();
          }
        }
      },

      'touch .device-row .edit': function(e) {
        if (!running(this)) {
          var view = this.findViewFromEvent(e);

          if (view) {
            view.edit();
          }
        }
      },

      'touch .device-row .cancel': function(e) {
        var view = this.findViewFromEvent(e);
        if (view.editing()) {
          view.render({reset: true});
        }
        else if (view.adding()) {
          this.removeChild(view);
          this.onAddEnded();
        }
      },

      'touch .header .add': function(e) {
        this.startAdd(e);
      },

      'touch .add-device': function(e) {
        this.startAdd(e);
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

    startAdd: function(e) {
      if (!running(this)) {
        var row = new autom8.view.DeviceRow({
          model: new autom8.model.Device(),
          initialMode: 'add',
          index: -1,
          templateOverrides: {
            addTemplate: 'autom8-View-EditDeviceRow'
          }
        });

        row.once('add:canceled', function() {
          this.removeChild(row);
          this.onAddEnded();
        }.bind(this));

        row.once('add:completed', function(rowView, deviceModel) {
          var deviceList = this.systemModel.get('deviceList');

          /* after the device has been added we need to make sure it's
          data-index property has the right model index, otherwise delete
          and edit operations will not work */
          for (var i = 0; i < deviceList.length; i++) {
            if (deviceList.at(i).get('address') === deviceModel.get('address')) {
              rowView.el.dataset.index = i;
              break;
            }
          }

          this.onAddEnded();
        }.bind(this));

        this.onAddStarted();

        this.addChild(row, {
          prependToElement: this.$el.find('.list')
        });
      }
    },

    onAddStarted: function() {
        this.$('.add-device').removeClass('visible');
    },

    onAddEnded: function() {
      if (this.systemModel.get('deviceList').length === 0) {
        this.$('.add-device').addClass('visible');
      }
    },

    redraw: function() {
      this.enable(!this.systemModel.get('running'));

      var $list = this.$el.find('.list');
      var $add = this.$el.find('.add-device');
      var deviceList = this.systemModel.get('deviceList');

      this.clearChildren();
      $list.empty();

      if (!deviceList || !deviceList.length) {
        /* the first time we redraw the model may not be completely
        initialized yet. if that's the case, don't flash the "add new
        device..." pseudo-row */
        if (this.systemModel.get('initialized')) {
          $add.addClass('visible');
        }

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
        if (!d) {
          return view.el.dataset.index === '-1';
        }

        return view.model.cid === d.cid;
      })[0];
    }
  });

  namespace("autom8.view").DeviceListView = DeviceListView;
}());
