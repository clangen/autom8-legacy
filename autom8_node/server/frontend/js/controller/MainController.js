namespace("autom8.controller").MainController = (function() {
  var View = autom8.mvc.View;

  function renderServerStatus(view, rpcResult) {
    debugger;
    view.addChild(View.fromTemplateId('autom8-View-SettingRow', {
      key: 'fingerprint',
      value: rpcResult.fingerprint
    }));

    view.addChild(View.fromTemplateId('autom8-View-SettingRow', {
      key: 'system',
      value: rpcResult.system_id
    }));

    view.addChild(View.fromTemplateId('autom8-View-SettingRow', {
      key: 'version',
      value: rpcResult.version
    }));

    view.addChild(View.fromTemplateId('autom8-View-SettingRow', {
      key: 'running',
      value: (!!rpcResult.running).toString()
    }));
  }

  return autom8.mvc.Controller.extend({
    mixins: [
      autom8.mvc.mixins.ControllerContainer
    ],

    onCreate: function(options) {
      this.view = new autom8.view.MainView({ el: $('.main-content-left') });

      var self = this;
      this.view.on('restartClicked', function() {
          Q.all([
            autom8.client.rpc.send({
              component: "server", command: "status", options: { }
            }),

            autom8.client.rpc.send({
              component: "system", command: "list_devices", options: { }
            })
          ])

          .spread(function(status, devices) {
            renderServerStatus(self.view, status);
          })
      });

      autom8.client.on('connected', this.onConnected, this);
      autom8.client.on('disconnected', this.onDisconnected, this);
      autom8.client.on('expired', this.onDisconnected, this);
      autom8.client.authenticate("empty");

      setTimeout(function() { /* wait for auth. fixme */
        autom8.client.connect();
      }, 2000);
    },

    onDestroy: function() {
      autom8.client.off('connected', this.onConnected, this);
      autom8.client.off('disconnected', this.onDisconnected, this);
      autom8.client.off('expired', this.onDisconnected, this);
    },

    onConnected: function() {
    },

    onDisconnected: function() {
    }
  });
}());