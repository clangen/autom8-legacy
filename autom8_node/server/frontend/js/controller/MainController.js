namespace("autom8.controller").MainController = (function() {
  var View = autom8.mvc.View;
  var t2e = _.bind(View.elementFromTemplateId, View); /* template2element */

  function updateServerStatus(context, rpc) {
    rpc = rpc || { };

    context.serverInfoView.$el.empty().append(t2e(
      'autom8-View-ServerInfo', {
        controller: rpc.system_description || rpc.system_id,
        fingerprint: rpc.fingerprint,
        port: rpc.port,
        version: rpc.version
      }
    ).children());
  }

  function updateDevices(context, rpc) {
    rpc = rpc || { };

    var $devices = t2e('autom8-View-Devices');

    if (rpc.devices) {
      var $list = $("<ul></ul>");

      for (var i = 0; i < rpc.devices.length; i++) {
        var $row = $("<li>" + JSON.stringify(rpc.devices[i]) + "</li>");
        $list.append($row);
      }

      $devices.append($list);
    }

    context.devicesView.$el.empty().append($devices.children());
  }

  return autom8.mvc.Controller.extend({
    mixins: [
      autom8.mvc.mixins.ControllerContainer
    ],

    onCreate: function(options) {
      this.$devices = $('.devices');
      this.$buttons = $('.bottom-buttons');
      this.$buttons.append(t2e('autom8-View-ButtonRow').children());

      this.view = new autom8.view.MainView({ el: $('.main-content-left') });
      this.serverInfoView = new View({el: $('.server-info')});
      this.devicesView = new View({el: $('.devices')});
      this.buttonsView = new View({el: $('.bottom-buttons')});

      updateServerStatus(this);
      updateDevices(this);

      var self = this;

      this.view.on('start:clicked', function() {
        autom8.client.rpc.send({
          component: "server", command: "start", options: { }
        });
      });

      this.view.on('stop:clicked', function() {
        autom8.client.rpc.send({
          component: "server", command: "stop", options: { }
        });
      });

      autom8.client.on('connected', this.onConnected, this);
      autom8.client.on('disconnected', this.onDisconnected, this);
      autom8.client.on('expired', this.onDisconnected, this);
      autom8.client.on('state:changed', this.onClientStateChanged, this);

      /* get auth cookie. after we have the auth cookie we can connect */
      autom8.client.authenticate("empty");
    },

    onDestroy: function() {
      autom8.client.off('connected', this.onConnected, this);
      autom8.client.off('disconnected', this.onDisconnected, this);
      autom8.client.off('expired', this.onDisconnected, this);
      autom8.client.pff('state:changed', this.onClientStateChanged, this);
    },

    onConnected: function() {
      $('.connection').css('background-color', 'green');

      var self = this;

      autom8.client.rpc.send({
        component: "server", command: "status", options: { }
      })
      .then(function(result) {
        updateServerStatus(self, result);
      });

      autom8.client.rpc.send({
        component: "system", command: "list_devices", options: { }
      })
      .then(function(result) {
        updateDevices(self, result);
      });
    },

    onDisconnected: function() {
      $('.connection').css('background-color', 'red');
    },

    onClientStateChanged: function(state) {
      if (state === "authenticated") {
        autom8.client.connect();
      }
    }
  });
}());