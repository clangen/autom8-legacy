if (!autom8) {
  alert("Error: autom8 namespace doesn't exist yet!");
}

autom8.Util.Dialog = (function() {
  var dialogTemplate = $("#autom8-Dialog").html();
  var dialogButtonTemplate = $("#autom8-Dialog-Button").html();
  var viewUtil = autom8.View.Util;
  var nextId = 0;
  var visibleCount = 0;

  return {
    show: function(params) {
      params = params || { };
      if (!params.buttons || !params.buttons.length) {
        return;
      }

      var dialogId = "dialog-" + (nextId++);
      var $dialog = viewUtil.elementFromTemplate(dialogTemplate, params);
      var $buttonContainer = $dialog.find('.dialog-buttons');
      var cancelCallback;

      $dialog.attr("id", dialogId);

      function showDialog() {
        $('body').append($dialog);
        addTouchEvents();
        ++visibleCount;
        $('#main-content').addClass('dialog-overlay-blur');
      }

      function closeDialog() {
        removeTouchEvents();
        $dialog.remove();
        --visibleCount;

        if (visibleCount === 0) {
          $('#main-content').removeClass('dialog-overlay-blur');
        }
      }

      function addTouchEvents() {
        autom8.Touchable.add('#' + dialogId, '.dialog-button', buttonHandler);
        autom8.Touchable.add('body', '#' + dialogId + '.dialog-overlay', cancelHandler);
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

      showDialog();
    }
  };
}());

autom8.Util.Dialog.Icon = {
  Question: "question",
  Information: "information",
  Warning: "warning",
  Critical: "critical"
};