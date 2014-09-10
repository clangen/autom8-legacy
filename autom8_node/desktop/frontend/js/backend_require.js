var path = require('path');

/* the desktop frontend client is compiled just like the admin
client and the server client. so when the desktop client requires
backend files we need to break out of the build directory, back to
the autom8_node root dir. right now our current directory is:
  ../autom8_node/desktop/dist/<target>/frontend/js/
*/
var AUTOM8_NODE_ROOT = path.resolve(__dirname + '/../../../../../');

var paths = {
    'shared': path.resolve(AUTOM8_NODE_ROOT + '/shared'),
    'shared-js': path.resolve(AUTOM8_NODE_ROOT + '/shared/js/backend'),
    'server': path.resolve(AUTOM8_NODE_ROOT + '/server'),
    'server-js': path.resolve(AUTOM8_NODE_ROOT + '/server')
};

module.exports = {
    require: function(component, path) {
        return require(module.exports.filepath(component + '-js', path));
    },

    filepath: function(component, path) {
        var base = paths[component];

        if (!base) {
            throw new Error("base path for component " + component + "not found!");
        }

        return (base + "/" + path);
    }
};