namespace("autom8.model").Device = Backbone.Model.extend({
  on: function() {
    return this.get('status') == autom8.DeviceStatus.On;
  },

  tripped: function() {
    return this.get('attrs').tripped;
  },

  armed: function() {
    return this.get('attrs').armed;
  },

  address: function() {
    return this.get('address');
  }
});

namespace("autom8.model").DeviceList = Backbone.Collection.extend({
  model: autom8.model.Device,
});
