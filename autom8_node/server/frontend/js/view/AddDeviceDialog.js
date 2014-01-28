 (function() {
  var show = function() {
    var device = new autom8.model.Device();

    var deviceRowView = new autom8.view.DeviceRow({
      model: device,
      disableKeyboardHandler: true,
      initialMode: 'edit',
      templateOverrides: {
        editTemplate: 'autom8-View-AddDeviceRow'
      }
    });

    var device; /* populated during validation */

    autom8.util.Dialog.show({
      title: 'add new device',
      view: deviceRowView,
      viewContainerClass: 'devices',

      validateCallback: function() {
        device = deviceRowView.validate();
        return device;
      },

      buttons: [
        {
          caption: "ok",
          positive: true,
          callback: function() {
            autom8.client.rpc.send({
              component: "system",
              command: "add_device",
              options: device
            })

            .then(function() {
              autom8.model.SystemModel.fetch();
            });
          }
        },
        {
          caption: "cancel",
          positive: false,
          callback: function() {
          }
        }
      ]
    });
  };

  namespace("autom8.view").AddDeviceDialog = {show: show};
}());
