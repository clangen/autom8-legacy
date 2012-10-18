if (!autom8) {
  alert("Error: autom8 namespace doesn't exist yet!");
}

autom8.Util.Dialog = (function() {
  return {
    show: function(dialogParams) {
      autom8.Util.Dialog.Mobile.showDialog(dialogParams);
    }
  };
}()); // autom8.Util.Dialog

autom8.Util.Dialog.Mobile = (function() {
  var dialogTemplate = $("#autom8-Dialog").html();
  var dialogButtonTemplate = $("#autom8-Dialog-Button").html();
  var viewUtil = autom8.View.Util;

  return {
    showDialog: function(params) {
      var $dialog = viewUtil.elementFromTemplate(dialogTemplate, params);
      var $buttonContainer = $dialog.find('.dialog-buttons');

      function buttonHandler(event) {
        autom8.Touchable.remove('.dialog-buttons', '.dialog-button');
        $dialog.remove();

        var id = parseInt($(event.target).attr('data-id'), 10);
        var callback = params.buttons[id].callback;
        eval(callback); // eep, dangerous! TODO FIXME
      }

      _.each(params.buttons, function(button, index) {
        var $button = viewUtil.elementFromTemplate(dialogButtonTemplate, {
          caption: button.caption,
          id: index
        });

        $buttonContainer.append($button);
      });

      $('body').append($dialog);

      autom8.Touchable.add('.dialog-buttons', '.dialog-button', buttonHandler);
    }
  };
}());

autom8.Util.Dialog.Icon = {
  Question: "question",
  Information: "information",
  Warning: "warning",
  Critical: "critical"
};