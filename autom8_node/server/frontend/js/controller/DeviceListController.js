namespace("autom8.controller").DeviceListController = (function() {
  function deleteDevice(device) {
    if (device) {
      autom8.util.Dialog.show({
        title: "confirm delete",
        message: 'are you sure you want to delete the device "' +
          device.get('label') + '" at address "' + device.get('address') + '"?',
        buttons: [
          {
            caption: "yes",
            positive: true,
            callback: function() {
              autom8.client.rpc.send({
                component: "system",
                command: "delete_device",
                options: {
                  address: device.get('address')
                }
              })

              .then(function() {
                autom8.model.SystemModel.fetch();
              });
            }
          },
          {
            caption: "no",
            positive: false
          }
        ]
      });
    }
  }

  function addDevice() {
    autom8.view.EditDeviceView.show();
  }

  function editDevice(device) {
    autom8.view.EditDeviceView.show(device);
  }

  return autom8.mvc.Controller.extend({
    onCreate: function(options) {
      this.view = new autom8.view.DeviceListView({ el: $('.devices') });
      this.view.on('delete:clicked', deleteDevice, this);
      this.view.on('create:clicked', addDevice, this);
      this.view.on('edit:clicked', editDevice, this);
    },

    onDestroy: function(options) {
    }
  });
}());