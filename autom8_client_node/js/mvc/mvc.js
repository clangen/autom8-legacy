function namespace(ns, context) {
  var result = context || window;
  var parts = (ns || "").split(".");
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    result[part] = result[part] || { };
    result = result[part];
  }
  return result;
}

namespace("autom8");
namespace("autom8.mvc");
namespace("autom8.mvc.mixins");