var fs = require('fs');
var path = require('path');
var log = require('./Logger.js');

var TAG = "[resource loader]".green;

var ROOT_DIRECTORY;

if (process.versions["atom-shell"]) {
    /* when running within atom-shell, __dirname is always the
    directory name for index.html, so we need to resolve our
    relative root a bit differently... */
    ROOT_DIRECTORY = path.resolve(__dirname + "/../../../");
}
else {
    /* when running under node proper, the __dirname is the
    directory that contains this source unit, i.e.:
    <root>/lib/autom8/shared/js/backend/Resource.js */
    ROOT_DIRECTORY = path.resolve(__dirname + "/../../../../../");
}

var TYPE_TO_PATH_LIST = {
    'bin': [
        '{{PREFIX}}/bin',
        ROOT_DIRECTORY + "/bin/",
        '/usr/bin',
        '/usr/local/bin'
    ],

    'lib': [
        '.',
        '{{PREFIX}}/lib',
        ROOT_DIRECTORY + "/bin",
        '/usr/lib',
        '/usr/local/lib'
    ],

    'conf': [
        '/etc/autom8',
        ROOT_DIRECTORY + "/shared/conf",
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

    var fullName;
    for (var i = 0; i < paths.length; i++) {
        fullName = path.resolve(paths[i] + '/' + name);

        if (fs.existsSync(fullName)) {
            log.info(TAG, "found".grey, fullName);
            return fullName;
        }
        else {
            // log.info(TAG, "not found:".grey, fullName.grey);
        }
    }

    return null;
}

exports = module.exports = {
    resolve: resolve
};