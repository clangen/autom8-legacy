var EventEmitter = require('events').EventEmitter;
var _ = require('lodash')._;
var stripcolorcodes = require('stripcolorcodes');

var LEVELS = {
    INFO: '[nfo]'.grey,
    WARN: '[wrn]'.yellow,
    ERROR: '[err]'.red
};

var CONFIG = {
    stripColorCodes: false
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

    module.exports.emit('log', args);

    if (CONFIG.stripColorCodes) {
        args = _.map(args, function(a) {
            return (_.isString(a)) ? stripcolorcodes(a) : a;
        });
    }

    console.log(args.join(' '));
}

module.exports = new EventEmitter();

_.extend(module.exports, {
    info: function() {
        log(LEVELS.INFO, arguments);
    },

    warn: function() {
        log(LEVELS.WARN, arguments);
    },

    error: function() {
        log(LEVELS.ERROR, arguments);
    },

    dump: function() {
        log(null, arguments, {noTimestamp: true});
    },

    configure: function() {
        if (arguments.length === 2) {
            CONFIG[arguments[0]] = arguments[1];
        }
        else if (arguments.length === 1) {
            _.merge(CONFIG, arguments[0]);
        }
    }
});