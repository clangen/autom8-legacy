namespace("autom8.model").Device = Backbone.Model.extend({
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
  }
});
