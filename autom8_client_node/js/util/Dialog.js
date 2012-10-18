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
  var nextId = 0;

  return {
    showDialog: function(params) {
      var dialogId = "dialog-" + (nextId++);
      var $dialog = viewUtil.elementFromTemplate(dialogTemplate, params);
      $dialog.attr("id", dialogId);
      var cancelCallback;

      var $buttonContainer = $dialog.find('.dialog-buttons');

      function closeDialog() {
        removeTouchEvents();
        $dialog.remove();
      }

      function addTouchEvents() {
        autom8.Touchable.add('#' + dialogId, '.dialog-button', buttonHandler);
        
        if (cancelCallback) {
          autom8.Touchable.add('body', '#' + dialogId + '.dialog-overlay', cancelHandler);
        }
      }

      function removeTouchEvents() {
        autom8.Touchable.remove('#' + dialogId, '.dialog-button');
        autom8.Touchable.remove('body', '#' + dialogId + '.dialog-overlay');
      }

      function cancelHandler(event) {
        if (cancelCallback) {
          closeDialog();
          cancelCallback();
        }
      }

      function buttonHandler(event) {
        closeDialog();

        var id = parseInt($(event.target).attr('data-id'), 10);
        var callback = params.buttons[id].callback;

        if (callback) {
          callback();
        }
      }

      _.each(params.buttons, function(button, index) {
        var $button = viewUtil.elementFromTemplate(dialogButtonTemplate, {
          caption: button.caption,
          id: index
        });

        if (button.cancel) {
          cancelCallback = button.callback || function() { };
        }

        $buttonContainer.append($button);
      });

      $('body').append($dialog);

      addTouchEvents();
    }
  };
}());

autom8.Util.Dialog.Icon = {
  Question: "question",
  Information: "information",
  Warning: "warning",
  Critical: "critical"
};