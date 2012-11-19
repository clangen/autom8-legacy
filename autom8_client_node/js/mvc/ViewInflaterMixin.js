(function() {
  namespace("autom8.mvc.mixins").ViewInflater = {
    'class': {
      htmlFromTemplate: function(template, params) {
        var compiled = Handlebars.compile(template);
        return compiled(params || {});
      },

      htmlFromTemplateId: function(templateId, params) {
        if (templateId[0] !== '#') {
          templateId = '#' + templateId;
        }

        var template = $(templateId).html();
        return $(this.htmlFromTemplate(template, params));
      },

      elementFromTemplate: function(template, params) {
        return $(this.htmlFromTemplate(template, params));
      },

      elementFromTemplateId: function(templateId, params) {
        return $(this.htmlFromTemplateId(templateId, params));        
      }
    }
  };
}());