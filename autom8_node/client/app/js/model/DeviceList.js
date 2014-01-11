namespace("autom8.model").DeviceList = (function() {
  return Backbone.Collection.extend({
    model: autom8.model.Device
  });
}());
