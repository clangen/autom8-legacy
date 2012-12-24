namespace("autom8.view").DeviceRowFactory = (function() {
  var factory = {
    create: function(device, options) {
      options = options || { };
      var result = $("<div/>");

      var rowView = null;
      var spinnerRadius = 6;

      if (device && device.name && device.deviceList) {
        /* we found a group! */
        spinnerRadius = 8;
        rowView = new autom8.view.GroupRow(options);
      }
      else {
        switch (device.get('type')) {
          case autom8.DeviceType.Lamp:
          case autom8.DeviceType.Appliance:
            rowView = new autom8.view.ApplianceRow(options);
            break;

          case autom8.DeviceType.SecuritySensor:
            rowView = new autom8.view.SecuritySensorRow(options);
            break;

          default:
            console.log('unknown device type! ' + device.get('type'));
            return new autom8.mvc.View();
        }

        _.each(options.attrs, function(value, key) {
          rowView.$el.attr('data-' + key, value);
        });
      }

      rowView.setDevice(device);
      return rowView;
    }
  };

  return factory;
}());
