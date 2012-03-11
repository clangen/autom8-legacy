if ( ! autom8) {
  alert("Error: autom8 namespace doesn't exist yet!");
}

$(document).ready(function() {
  var prefs = autom8.Prefs;
  var ls = localStorage;
  var pw = null;

  /* indicates whether or not a dummy password is set in the
     password field. If a dummy is set, that means that the
     field's value will not be rehashed and saved on close */
  var placeholderPw = false;

  function save() {
    var name = $('#name').val();
    var host = $('#host').val();
    var port = $('#port').val();
    pw = $("#password").val();

    if (name && host && port && pw) {
      ls[prefs.ConnectionName] = name;
      ls[prefs.ConnectionHost] = host;
      ls[prefs.ConnectionPort] = port;

      if ( ! placeholderPw) {
        ls[prefs.ConnectionPw] = autom8.Ui.Settings.sha1(pw);
      }

      ls[prefs.ConnectionDirty] = true;
      window.history.back();
    }
    else {
      alert("Invalid information entered");
    }
  }

  $('#save').click(function() {
    save();
  });

  $('#name').val(ls[prefs.ConnectionName]);
  $('#host').val(ls[prefs.ConnectionHost]);
  $('#port').val(ls[prefs.ConnectionPort]);

  pw = ls[prefs.ConnectionPw];
  if (pw && pw.length) {
    /* dummy, default password. real password is a long hash */
    $("#password").val("0123456789");
    placeholderPw = true;
  }

  /* if the password field gains focus, and there is a placeholder
     (dummy) password set, clear it for the user to enter a new one */
  $("#password").bind("focus", function() {
    if (placeholderPw) {
      $("#password").val("");
    }
  });

  /* if the password field loses focus, and the user didn't change
     the password, reset it to the placeholder */
  $("#password").bind("blur", function() {
    if (placeholderPw) {
      $("#password").val("0123456789");
    }
  });

  /* if the user types in the password field, flag the password as
     changed so it gets re-hashed on close */
  $("#password").bind("keypress paste propertychanged input", function() {
    placeholderPw = false;
  });

  /* why is this necessary? if we don't do it the background
     color won't show up the first time the page loads... */
  $('body').width("100%");
  $('body').bind("keydown", function(e) {
    if (e.keyCode == 13) {
      save();
    }
  });
});

autom8.Environment.init = function() {
  autom8.Ui.Settings.init();
}

autom8.Ui.Settings = function() {
   /*
    * public api
    */
  return {
    init: function() {
    },

    sha1: function(str) {
      return Crypto.util.bytesToHex(
        Crypto.SHA1(str, { asBytes: true }));
    }
  }
}(); // autom8.Ui.Settings