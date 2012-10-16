autom8.Controller.SignIn = (function() {
  var spinner;

  function setState(state) {
    var $passwordRow = $('.password-row');
    var $loadingRow = $('#loading-row');
    var $errorText = $("#sign-in-error");

    switch (state) {
      case "loading":
        $errorText.hide();
        $loadingRow.show();
        $passwordRow.hide();
        spinner.start();
        break;

      case "error":
        $errorText.html("could not sign in. please re-enter your password").show();
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
      setState("loading");

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