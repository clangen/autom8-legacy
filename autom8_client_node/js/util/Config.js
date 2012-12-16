namespace("autom8").Config = (function() {
  var config = {
    display: {
      animateCollapse: false
    }
  };

  var ua = navigator.userAgent || "";

  if (/i(Phone|Pod) OS (5|6)/.test(ua) ||
      /Apple-i(Phone|Pod)(5|6)/.test(ua) ||
      /Chrome/.test(ua))
  {
    config.display.animateCollapse = true;
  }

  return config;
}());