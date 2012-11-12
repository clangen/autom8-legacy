(function() {
  autom8.mvc.mixins.ViewInflater = {
    'class': {
      htmlFromTemplate: function(template, params) {
        var compiled = Handlebars.compile(template);
        return compiled(params || {});
      },

      elementFromTemplate: function(template, params) {
        return $(this.htmlFromTemplate(template, params));
      }
    }
  };
}());