(function() {
  exports.requests = {
    authenticate: "autom8://request/authenticate",
    get_device_list: "autom8://request/get_device_list",
    ping: "autom8://request/ping"
  };

  exports.responses = {
    authenticated: "autom8://response/authenticated",
    authenticate_failed: "autom8://response/authenticate_failed",
    pong: "autom8://response/pong"
  };
}());

