 (function() {
  var View = autom8.mvc.View;

  var COMMANDS = {
    ADD: 'add_device',
    EDIT: 'edit_device'
  };

  var EditDeviceView = View.extend({
    template: 'autom8-View-EditDevice',
    tagName: 'div',

    events: {
    },

    onCreate: function(options) {
      if (options.device) {
        var normalized = options.device.toJSON();
        normalized.areas = normalized.groups.join(', ');
        this.inflate(this.template, normalized);
      }
    },

    onDestroy: function() {
    },

    render: function() {

    }
  });

  EditDeviceView.show = function(device) {
    var title = '';
    var options;
    var operation;

    if (!device) {
      title = 'add new device';
      operation = COMMANDS.ADD;
    } else {
      title = 'edit device';
      operation = COMMANDS.EDIT;
    }

    autom8.util.Dialog.show({
      title: title,
      view: new EditDeviceView({device: device}),
      buttons: [
        {
          caption: "ok",
          positive: true,
          callback: function(results) {
            if (!results) {
              return;
            }

            var device = {};
            var options;

            for (var i = 0; i < results.length; i++) {
              var key = results[i].name;
              var val = results[i].value;
              device[key] = val;
            }

            device.groups = device.groups.split(', ');
            device.type = parseInt(device.type, 10);

            if (operation === COMMANDS.ADD) {
              options = device;
            }
            else {
              options = {
                address: device.address,
                device: device
              };
            }

            debugger;

            autom8.client.rpc.send({
              component: "system",
              command: operation,
              options: options
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

  namespace("autom8.view").EditDeviceView = EditDeviceView;
}());
