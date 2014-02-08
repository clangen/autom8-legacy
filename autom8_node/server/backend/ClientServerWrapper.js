var shared = "./../../shared/js/backend/";

var path = require('path');
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
var killing = false;
var reconnecting = false;

function kill(callback) {
    callback = callback || function() { };

    if (child && !child.dead) {
        child.on('exit', function(code, signal) {
            log.info(TAG, "stopped");
            child = null;
            killing = false;
            reconnecting = false;
            callback();
        });

        log.info(TAG, "stopping...");
        killing = true;
        child.kill('SIGTERM');
    }
    else {
        callback();
    }
}

function restart() {
    if (killing || reconnecting) {
        console.log("please kill me".rainbow);
        return;
    }

    exports.kill(function() {
        log.info(TAG, "connecting...");
        child = child_process.spawn(
            'node',
            [
                'main.js',
                '--headless', 1,
                '--listen', config.get().client.webClientPort,
                '--clienthost', '127.0.0.1',
                '--clientport', config.get().client.port
            ],
            {
                cwd: SERVER_DIR,
                env: process.env
            }
        );

        child.stdout.on('data', function (data) {
            data = data.toString();
            var output = stripcolors(data).trim();

            /* we feed the password to an input prompt so it doesn't show
            up in the process list */
            if (output === 'autom8: password:') {
                child.stdin.write(config.get().client.password + '\n');
                log.info(TAG, "connected".green);
            }
            else {
                var match = data.match(CHILD_LOG_REGEX);

                /* if we're starting with a timestamp, prettify the output by
                ensuring it remains the first parameter */
                if (match && match.length === 3) {
                    log.dump(match[1], TAG, match[2]);
                }
                else {
                    log.dump(TAG, data);
                }
            }
        });

        child.on('exit', function(code) {
            child.dead = true; /* in case we die before kill() runs */

            if (code === PASSWORD_REJECTED) {
                log.error(TAG, "password rejected!".red, "no auto-reconnect. restart the server.");
            }
            else if (!killing) {
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
            console.log(TAG, err);
        });
    });
}

exports.kill = kill;
exports.restart = restart;
