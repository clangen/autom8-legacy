 (function() {
  var View = autom8.mvc.View;

  // namespace("autom8").DeviceType = {
  //   Unknown: -1,
  //   Lamp: 0,
  //   Appliance: 1,
  //   SecuritySensor: 2
  // };

  // namespace("autom8").CommandType = {
  //   PowerLine: 0,
  //   RadioFrequency: 1
  // };

  // namespace("autom8").DeviceStatus = {
  //   Unknown: 1,
  //   Off: 0,
  //   On: 1
  // };

  var typeToString = {
    '-1': 'unknown',
    '0': 'lamp',
    '1': 'appliance',
    '2': 'security sensor'
  };

  var statusToString = {
    '-1': 'unknown',
    '0': 'off',
    '1': 'on'
  };

  var DeviceListView = View.extend({
    template: 'autom8-View-Devices',

    events: {
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
        for (var i = 0; i < model.devices.length; i++) {
          var d = model.devices[i];

          var normalized = {
            'label': d.label || "unnamed",
            'address': d.address,
            'groups': (d.groups || []).join(", ") || "none",
            'status': statusToString[d.status === undefined ? -1 : d.status],
            'type': typeToString[d.type === undefined ? -1 : d.type]
          };

          if (d.type === 2) {
            if (d.status === 3) {
              normalized.status = "ALERT!";
            }
            else {
              normalized.status = (d.attributes.armed) ? "armed" : "disarmed";
            }
          }

          var row = new View({
            className: i % 2 === 0 ? 'even' : 'odd',
            tagName: 'li',
            template: 'autom8-View-DeviceRow',
            templateParams: normalized
          });

          this.addChild(row, {appendToElement: $list});
        }
      }
    }
  });

  namespace("autom8.view").DeviceListView = DeviceListView;
}());
