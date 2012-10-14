autom8.Controller.SignIn = (function() {
  $(document).ready(function() {
    function signIn() {
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
          $('#error').html("Could not sign in. Please re-enter your password.");
        }
      });
    }

    /* why is this necessary? if we don't do it the background
       color won't show up the first time the page loads... */
    $('body').width("100%");

    autom8.Touchable.add('.password-row', '#signInButton', function(e) {
      signIn();
    });

    /* enter press attempts to sign in */
    $('body').bind("keydown", function(e) {
      if (e.keyCode == 13) {
        signIn();
      }
    });

    $("#password").focus();
  });

  return {
  };
}());