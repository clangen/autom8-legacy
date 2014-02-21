var shared = "./../../shared/js/backend/";

var Q = require('q');
var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var stripcolors = require('stripcolorcodes');
var config = require(shared + 'Config.js');
var log = require(shared + 'Logger.js');

var TAG = "[client-server]".yellow;
var SERVER_DIR = path.resolve(__dirname + "/../../client/");
var SERVER_EXE = path.resolve(SERVER_DIR + "/main.js");
var PASSWORD_REJECTED = 99;

/* [hh:mm:ss MM/DD/YYYY] */
var CHILD_LOG_REGEX = /(\[\d{2}:\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}\]) (.*)/;

var child = null;
var stopping = false;
var reconnecting = false;

/* when we have a child process we need to send a heartbeat
every couple seconds so it stays alive */
setInterval(function() {
    if (child && !child.dead) {
        child.send({name: 'heartbeat'});
    }
}, 2000);

function stop(callback) {
    var deferred = Q.defer();

    callback = callback || function() { };

    if (child && !child.dead) {
        log.info(TAG, "stopping...");
        stopping = true;

        /* we'll ask nicely first... */
        var forceKillTimeout = setTimeout(function() {
            child.kill('SIGTERM');
        }, 2000);

        child.on('exit', function(code, signal) {
            log.info(TAG, "stopped");
            child = null;
            stopping = false;
            reconnecting = false;
            clearTimeout(forceKillTimeout);
            callback();
            deferred.resolve();
        });

        child.send({name: 'die'});
    }
    else {
        deferred.resolve();
        callback();
    }

    return deferred.promise;
}

function restart() {
    var deferred = Q.defer();

    if (stopping || reconnecting) {
        deferred.reject({message: 'already restarting'});
        return;
    }

    exports.stop(function() {
        log.info(TAG, "connecting...");

        var options = {
            cwd: SERVER_DIR,
            env: process.env,
            silent: true /* process keeps its own stdin/stdout */
        };

        var args = [
            '--headless',
            '--listen', config.get().clientProxy.webClientPort,
            '--clienthost', '127.0.0.1',
            '--clientport', config.get().clientProxy.port
        ];

        if (config.get().debug) {
            args.push('--debug');
        }

        child = child_process.fork('main.js', args, options);

        child.send({
            name: 'password',
            options: { value: config.get().clientProxy.password }
        });

        child.stdout.on('data', function (data) {
            data = data.toString();
            var output = stripcolors(data).trim();
            var match = data.match(CHILD_LOG_REGEX);

            /* if we're starting with a timestamp, prettify the output by
            ensuring it remains the first parameter */
            if (match && match.length === 3) {
                log.dump(match[1], TAG, match[2]);
            }
            else {
                console.log(TAG, data);
            }
        });

        child.on('exit', function(code) {
            child.dead = true; /* in case we die before stop() runs */

            if (code === PASSWORD_REJECTED) {
                log.error(TAG, "password rejected!".red, "no auto-reconnect. restart the server.");
            }
            else if (!stopping) {
                log.error(TAG, "process died!".red, "scheduling restart in 5 seconds...");
                reconnecting = true;

                setTimeout(function() {
                    if (reconnecting) {
                        reconnecting = false;
                        restart();
                    }
                }, 5000);
            }
        });

        child.on('error', function(err) {
            log.error(TAG, "child process generated an error", err);
        });

        deferred.resolve();
    });

    return deferred.promise;
}

exports.stop = stop;
exports.restart = restart;
