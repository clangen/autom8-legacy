var EventEmitter = require('events').EventEmitter;

var LEVELS = {
    INFO: '[nfo]'.grey,
    WARN: '[wrn]'.yellow,
    ERROR: '[err]'.red
};

function timestamp() {
    var d = new Date();

    return '[' +
        ('0' + d.getHours()).slice(-2) + ':' +
        ('0' + d.getMinutes()).slice(-2) + ':' +
        ('0' + d.getSeconds()).slice(-2) + ' ' +
        ('0' + (d.getMonth() + 1)).slice(-2) + '/' +
        ('0' + d.getDate()).slice(-2) + '/' +
        d.getFullYear() +
        ']';
}

function log(level, args, options) {
    args = Array.prototype.slice.apply(args);

    if (level) {
        args.unshift(level);
    }

    if (!options || !options.noTimestamp) {
        args.unshift(timestamp());
    }

    console.log(args.join(' '));
    module.exports.emit('log', args);
}

module.exports = new EventEmitter();

module.exports.info = function() {
    log(LEVELS.INFO, arguments);
};

module.exports.warn = function() {
    log(LEVELS.WARN, arguments);
};

module.exports.error = function() {
    log(LEVELS.ERROR, arguments);
};

module.exports.dump = function() {
    log(null, arguments, {noTimestamp: true});
};