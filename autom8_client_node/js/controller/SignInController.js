autom8.Controller.SignIn = (function() {
  var spinner;
  var loadingTimeout;

  function setState(state) {
    var $passwordRow = $('.password-row');
    var $loadingRow = $('#loading-row');
    var $errorText = $("#sign-in-error");

    function cancelLoadingTimeout() {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
    }

    switch (state) {
      case "loading":
        $errorText.hide();
        $loadingRow.show();
        $passwordRow.hide();
        spinner.start();
        break;

      case "error":
        cancelLoadingTimeout();
        $errorText.html("failed to sign in. check your password and try again").show();
        $loadingRow.hide();
        $passwordRow.show();
        spinner.stop();
        break;

      default:
        $errorText.hide();
        $loadingRow.hide();
        $passwordRow.show();
        $("#password").focus();
        spinner.stop();
        break;
    }
  }

  $(document).ready(function() {
    function signIn() {
      loadingTimeout = setTimeout(function() {
        setState("loading");
      }, 500);

      var hash = Crypto.util.bytesToHex(
          Crypto.SHA1($("#password").val(), { asBytes: true }));

      $.ajax({
        url: 'signin.action',
        type: 'POST',
        data: {
          password: hash
        },
        success: function(data) {
          window.location = "/";
        },
        error: function (xhr, status, error) {
          setState("error");
        }
      });
    }

    spinner = autom8.Spinner.create("loading-spinner");

    autom8.Touchable.add('.password-row', '#signInButton', function(e) {
      signIn();
    });

    /* enter press attempts to sign in */
    $('body').bind("keydown", function(e) {
      if (e.keyCode == 13) {
        signIn();
      }
    });

    setState("initialized");
  });

  return {
  };
}());