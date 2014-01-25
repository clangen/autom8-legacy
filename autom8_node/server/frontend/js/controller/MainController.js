namespace("autom8.controller").MainController = (function() {
  function refreshStatus() {
    autom8.model.SystemModel.fetch();
  }

  function reconnect(options) {
    var c = autom8.client;
    var s = autom8.client.getState();
    if (!c.connected && !c.connecting && s !== "authenticating") {
      autom8.client.authenticate("empty").fail(function() {
        autom8.client.connect();
      });
    }
  }

  function onStartClicked() {
    var self = this;

    self.systemInfoController.save()

    .then(function() {
      autom8.client.rpc.send({
        component: "server", command: "start", options: { }
      });
    })

    .then(refreshStatus);
  }

  function onStopClicked() {
    autom8.client.rpc.send({
      component: "server", command: "stop", options: { }
    })

    .then(refreshStatus);
  }

  return autom8.mvc.Controller.extend({
    mixins: [
      autom8.mvc.mixins.ControllerContainer
    ],

    onCreate: function(options) {
      this.view = new autom8.view.MainView({ el: $('.main-content-left') });

      this.systemInfoController = this.addChild(
        new autom8.controller.SystemInfoController()
      );

      this.deviceListController = this.addChild(
        new autom8.controller.DeviceListController()
      );

      this.view.serverControlView.on('start:clicked', onStartClicked, this);
      this.view.serverControlView.on('stop:clicked', onStopClicked, this);

      autom8.client.on('connected', this.onConnected, this);
      autom8.client.on('disconnected', this.onDisconnected, this);
      autom8.client.on('expired', this.onDisconnected, this);
      autom8.client.on('state:changed', this.onClientStateChanged, this);

      reconnect();
    },

    onDestroy: function() {
      autom8.client.off('connected', this.onConnected, this);
      autom8.client.off('disconnected', this.onDisconnected, this);
      autom8.client.off('expired', this.onDisconnected, this);
      autom8.client.off('state:changed', this.onClientStateChanged, this);
    },

    onConnected: function() {
      refreshStatus();
    },

    onDisconnected: function() {
      if (!this.reconnectTimeout) {
        this.reconnectTimeout = setTimeout(function() {
          this.reconnectTimeout = null;
          reconnect();
        }.bind(this), 5000);
      }
    },

    onClientStateChanged: function(state) {
      if (state === "authenticated") {
        autom8.client.connect();
      }
    }
  });
}());