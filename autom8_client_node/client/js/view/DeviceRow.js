namespace("autom8.view").DeviceRow = (function() {
  var View = autom8.mvc.View;

  var deviceRow = View.extend({
    onCreate: function(options) {
      options = options || { };
      this.spinnerOptions = options.spinnerOptions;
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
        /* re-use existing spinner if it already exists */
        this.removeChild(this.spinner, {
          destroy: false,
          pause: false
        });
      }
      else {
        options = _.extend({ }, this.spinnerOptions, options);
        this.spinner = autom8.view.DeviceRow.createSpinner(options);
      }

      this.addChild(this.spinner, { appendAfterElement: '.device-row-info' });
    }
  });

  deviceRow.createSpinner = function(options) {
    return new autom8.view.SpinnerView({
      el: $('<div class="row-spinner-container"></div>'),
      spinnerSelector: null,
      spinnerOptions: {
        radius: options.radius || 8,
        className: 'row-spinner'
      }
    });
  };

  return deviceRow;
}());
