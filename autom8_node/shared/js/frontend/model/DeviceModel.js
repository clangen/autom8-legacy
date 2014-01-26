namespace("autom8.model").Device = Backbone.Model.extend({
  TYPE: {
    '-1': 'unknown',
    '0': 'lamp',
    '1': 'appliance',
    '2': 'security sensor'
  },

  STATUS: {
    '-1': 'unknown',
    '0': 'off',
    '1': 'on'
  },

  isOn: function() {
    return this.get('status') == autom8.DeviceStatus.On;
  },

  isTripped: function() {
    return this.get('attrs').tripped;
  },

  isArmed: function() {
    return this.get('attrs').armed;
  },

  address: function() {
    return this.get('address');
  },

  toNormalizedJSON: function(options) {
    options = options || {};
    var type = this.get('type');

    if (!options.editing) {
      type = this.TYPE[type === undefined ? -1 : type];
    }

    var normalized = {
      'label': this.get('label') || "unnamed",
      'address': this.get('address'),
      'groups': (this.get('groups') || []).join(", ") || "none",
      'status': this.STATUS[this.get('status') === undefined ? -1 : this.get('status')],
      'type': type
    };

    if (this.get('type') === 2) { /* security sensor */
      if (this.get('status') === 3) { /* tripped */
        normalized.status = "ALERT!";
      }
      else {
        normalized.status = (options.armed) ? "armed" : "disarmed";
      }
    }

    return normalized;
  }
});
