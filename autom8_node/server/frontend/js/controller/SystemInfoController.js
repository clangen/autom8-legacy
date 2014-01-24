namespace("autom8.controller").SystemInfoController = (function() {
  function saveSystemInfo() {
    var deferred = Q.defer();
    var self = this;

    var onFailed = function() {
      autom8.util.Dialog.show({
        title: "bad settings",
        message: "the specified settings are invalid. please make sure the " +
          "password is non-empty, and the port is a valid number.",
        buttons: [{
            caption: "ok",
            positive: true,
            negative: true
        }],
        onClosed: function() {
          deferred.reject();
        }
      });
    };

    var view = this.view;
    if (view.dirty()) {
      var port = parseInt(view.$('.port-input').val(), 10);
      var pw = view.$('.password-input').val();

      if (!_.isNumber(port) || _.isNaN(port) || port <= 0 || !pw) {
        onFailed();
      }
      else {
        var promises = [];

        if (view.passwordChanged) {
          promises.push(autom8.client.rpc.send({
            component: "server", command: "set_preference", options: {
              key: "password",
              value: CryptoJS.SHA256(pw).toString(CryptoJS.enc.Hex)
            }
          }));
        }

        if (view.portChanged) {
          promises.push(autom8.client.rpc.send({
            component: "server", command: "set_preference", options: {
              key: "port",
              value: port.toString()
            }
          }));
        }

        view.resetDirtyState();
        return Q.all(promises).then(deferred.resolve).fail(onFailed);
      }
    }
    else {
      deferred.resolve();
    }

    return deferred.promise;
  }

  return autom8.mvc.Controller.extend({
    mixins: [
      autom8.mvc.mixins.ControllerContainer
    ],

    onCreate: function(options) {
      this.view = new autom8.view.SystemInfoView({ el: $('.system-info') });
      autom8.client.on('disconnected', this.onDisconnected, this);
    },

    onDestroy: function() {
      autom8.client.off('disconnected', this.onDisconnected, this);
    },

    onDisconnected: function() {
      this.view.render();
    },

    update: function(model) {
      this.view.update(model);
    },

    save: function() {
      return saveSystemInfo.call(this);
    }
  });
}());