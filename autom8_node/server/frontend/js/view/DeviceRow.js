 (function() {
  var View = autom8.mvc.View;

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

  var DeviceRow = View.extend({
    template: 'autom8-View-DeviceRow',
    tagName: 'li',

    events: {
    },

    onCreate: function(options) {
      this.model = options.model;
      this.render();
      this.model.on('change', this.render, this);
    },

    onDestroy: function() {
      this.model.off('change', this.render, this);
    },

    render: function() {
      var d = (this.model && this.model.toJSON()) || { };

      var normalized = {
        'label': d.label || "unnamed",
        'address': d.address,
        'groups': (d.groups || []).join(", ") || "none",
        'status': statusToString[d.status === undefined ? -1 : d.status],
        'type': typeToString[d.type === undefined ? -1 : d.type]
      };

      if (d.type === 2) { /* security sensor */
        if (d.status === 3) { /* tripped */
          normalized.status = "ALERT!";
        }
        else {
          normalized.status = (d.attrs.armed) ? "armed" : "disarmed";
        }
      }

      this.inflate(this.template, normalized);
    }
  });

  namespace("autom8.view").DeviceRow = DeviceRow;
}());
