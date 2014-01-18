 (function() {
  var RPC_REQUEST_TIMEOUT_MILLIS = 5000;
  var PREFIX = "autom8-server-ui-";
  var DEBUG = true;
  var TAG = "[ClientRpc]";
  var nextId = 0;
  var pending = { };

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
          /* TODO FIXME  HACK SHOULDN'T MODIFY DOM HERE. reaise
          and event, or something. */
          $('.console').append($(body.html));
        }
        if (uri === "autom8://response/libautom8/rpc") {
          var deferred = pending[body.id];
          delete pending[body.id];
          if (deferred) {
            body.message.id = body.id;

            if (DEBUG) {
              console.log(TAG, "recv", body.message);
            }

            deferred.resolve(body.message);
          }
        }
      }
    };

    autom8.client.rpc.init();
  }

  namespace("autom8.util.ClientRpc").init = addRpcInterfaceToClient;
}());
