namespace("autom8").AppCache = (function() {
  var appCache = window.applicationCache;

  function checkSwap() {
    if (appCache.status === appCache.UPDATEREADY) {
      console.log("new version of application, reloading...");
      window.location.reload();
    }    
  }

  checkSwap();

  $(document).ready(function() {
    appCache.addEventListener('updateready', function(e) {
      checkSwap();
    });
  });
}());