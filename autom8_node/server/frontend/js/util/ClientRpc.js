 (function() {
  var RPC_REQUEST_TIMEOUT_MILLIS = 5000;
  var PREFIX = "autom8-server-ui-";
  var DEBUG = false;
  var TAG = "[ClientRpc]";
  var nextId = 0;
  var pending = { };

  var STATUS = {
    AUTOM8_OK: 1,
    AUTOM8_TRUE: 1,
    AUTOM8_FALSE: 0,
    AUTOM8_UNKNOWN: -1,
    AUTOM8_INVALID_ARGUMENT: -2,
    AUTOM8_ERROR_SERVER_RUNNING: -3,
    AUTOM8_ERROR_SERVER_STOPPED: -4,
    AUTOM8_INVALID_COMMAND: -5,
    AUTOM8_ALREADY_INITIALIZED: -6,
    AUTOM8_NOT_INITIALIZED: -7,
    AUTOM8_PARSE_ERROR: -8,
    AUTOM8_DEVICE_NOT_FOUND: -9,
    AUTOM8_DEVICE_ALREADY_EXISTS: -10,
    AUTOM8_SERVER_ALREADY_RUNNING: -11,
    AUTOM8_SERVER_NOT_RUNNING: -12,
    AUTOM8_INVALID_SYSTEM: -13
  };

  function addRpcInterfaceToClient() {
    autom8.client.rpc = {
      init: function() {
        autom8.client.on('responseReceived', this.recv);
      },

      deinit: function() {
        autom8.client.off('responseReceived', this.recv);
      },

      send: function(options) {
        var id = options.id = (PREFIX + nextId++);
        var deferred = Q.defer();
        pending[id] = deferred;

        if (DEBUG) {
          console.log(TAG, "send", options);
        }

        autom8.client.send("autom8://request/libautom8/rpc", options);

        setTimeout(function() {
          if (pending[id]) {
            if (DEBUG) {
              console.log(TAG, "rpc timeout for", id);
            }

            delete pending[id];
            deferred.reject();
          }
        }, RPC_REQUEST_TIMEOUT_MILLIS);

        return deferred.promise;
      },

      recv: function(uri, body) {
        body = JSON.parse(body);

        if (uri === "autom8://response/libautom8/log") {
          autom8.client.trigger('log', body.html);
        }
        else if (uri === "autom8://response/libautom8/rpc") {
          var deferred = pending[body.id];
          delete pending[body.id];
          if (deferred) {
            if (typeof body.message === 'string') {
              body.message = {message: body.message};
            }

            body.message.ID = body.id;
            body.message.STATUS = body.status;

            if (DEBUG) {
              console.log(TAG, "recv", body.message);
            }

            deferred.resolve(body.message);
          }
        }
        else if (uri === "autom8://response/libautom8/resync") {
          autom8.client.trigger('resync', body);
        }
      },

      STATUS: STATUS
    };

    autom8.client.rpc.init();
  }

  namespace("autom8.util.ClientRpc").init = addRpcInterfaceToClient;
}());
