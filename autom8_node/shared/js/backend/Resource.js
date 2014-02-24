var fs = require('fs');
var path = require('path');
var log = require('./Logger.js');

var TAG = "[resource loader]".green;

var TYPE_TO_PATH_LIST = {
    'bin': [
        '{{PREFIX}}/bin',
        '/usr/bin',
        '/usr/local/bin'
    ],

    'lib': [
        '.',
        '{{PREFIX}}/lib',
        '/usr/lib',
        '/usr/local/lib'
    ],

    'conf': [
        '/etc/autom8',
        '{{PREFIX}}/share/autom8',
        '{{PREFIX}}/share/autom8'
    ]
};

TYPE_TO_PATH_LIST.bin = TYPE_TO_PATH_LIST.bin.concat((process.env.PATH || '').split(':'));
TYPE_TO_PATH_LIST.lib = TYPE_TO_PATH_LIST.lib.concat((process.env.LD_LIBRARY_PATH || '').split(':'));

function resolve(type, name, paths) {
    /* caller can also pass in a list of search paths. these will
    take precedence over the default ones */
    if (typeof paths === "string") {
        paths = [paths];
    }

    var defaultPaths = TYPE_TO_PATH_LIST[type] || [];
    paths = (paths || []).slice(0).concat(defaultPaths);

    // log.info(JSON.stringify(paths).blue);

    var fullName;
    for (var i = 0; i < paths.length; i++) {
        fullName = path.resolve(paths[i] + '/' + name);

        if (fs.existsSync(fullName)) {
            log.info(TAG, "found".grey, fullName);
            return fullName;
        }
        else {
            // log.info(TAG, "testing:".grey, fullName.grey);
        }
    }

    return null;
}

exports = module.exports = {
    resolve: resolve
};