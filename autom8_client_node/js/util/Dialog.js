if (!autom8) {
  alert("Error: autom8 namespace doesn't exist yet!");
}

autom8.Util.Dialog = (function() {
  return {
    show: function(dialogParams) {
      if (autom8Client.isNode) {
        autom8.Util.Dialog.Node(dialogParams);
      }
      else {
        DialogHelper.showDialog(JSON.stringify(dialogParams));
      }
    }
  };
}()); // autom8.Util.Dialog

autom8.Util.Dialog.Node = (function() {
  var closed = true;

  var showDialog = function(params) {
    var dialogButtons = { };
    for (var i = 0; i < params.buttons.length; i++) {
      var b = params.buttons[i];
      dialogButtons[b.caption] = (function(message) {
        return function() {
          if (message) {
            eval(message); // eep, dangerous!
          }
    
          $(this).dialog("close");
        };
      }(b.callback));
    }

    var dialog = $('#dialog')
      .html(params.message)
      .dialog({
        autoOpen: true,
        title: params.title,
        buttons: dialogButtons,
        modal: true,
        close: function() {
          closed = true;
        }
      });

    closed = false;
  };

  $(window).resize(function() {
    if ( ! closed) {
      $("#dialog").dialog({ position: "center"});
    }
  });

  return showDialog;
}()); // autom8.Util.Dialog.Node

autom8.Util.Dialog.Icon = {
  Question: "question",
  Information: "information",
  Warning: "warning",
  Critical: "critical"
};