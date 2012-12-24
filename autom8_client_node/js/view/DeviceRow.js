namespace("autom8.view").DeviceRow = (function() {
  var View = autom8.mvc.View;

  var deviceRow = View.extend({
    onCreate: function() {
    },

    onDestroy: function(options) {
      if (this.device) {
        this.device.off('change', this.onDeviceChange, this);
      }

      this.device = null;
    },

    setDevice: function(device) {
      if (device === this.device) {
        return;
      }

      if (this.device) {
        this.device.off('change', this.onDeviceChange, this);
      }

      this.device = device;

      if (device) {
        device.on('change', this.onDeviceChange, this);
      }

      if (device.get('updating') && this.spinner) {
        this.spinner.start();
      }

      this.render();
    },

    onDeviceChange: function() {
      this.render({change: true});

      if (this.spinner && this.device) {
        if (this.device.get('updating')) {
          this.spinner.start();
        }
        else {
          this.spinner.stop();
        }
      }
    },

    appendSpinner: function(options) {
      if (this.spinner) {
        this.destroyChild(this.spinner);
      }

      this.spinner = autom8.view.DeviceRow.createSpinner(options);
      this.addChild(this.spinner, { appendAfterElement: '.device-row-info' });
    }
  });

  deviceRow.createSpinner = function(options) {
    options = options || { };

    return new autom8.view.SpinnerView({
      el: $('<div class="row-spinner-container"></div>'),
      spinnerSelector: null,
      spinnerOptions: {
        radius: options.radius || 6,
        className: 'row-spinner'
      }
    });
  };

  return deviceRow;
}());
