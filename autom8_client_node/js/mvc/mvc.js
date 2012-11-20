function namespace(ns, context) {
  var result = context || window;
  var parts = (ns || "").split(".");
  _.each(parts, function(part) {
    result[part] = (result[part] || { });
    result = result[part];
  });
  return result;
}

namespace("autom8");
namespace("autom8.mvc");
namespace("autom8.mvc.mixins");
