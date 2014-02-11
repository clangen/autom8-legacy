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
var PID_FILE = path.resolve("./pid");
var PASSWORD_REJECTED = 99;

/* [hh:mm:ss MM/DD/YYYY] */
var CHILD_LOG_REGEX = /(\[\d{2}:\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}\]) (.*)/;

var child = null;
var killing = false;
var reconnecting = false;

function writePidFile() {
    if (child && !child.dead && child.pid) {
        fs.writeFileSync(PID_FILE, [child.pid, process.pid].join(" "));
    }
}

function killPreviousInstance() {
    var deferred = Q.defer();

    /* alright, see if the last time we ran we left a file behind that
    noted the child's PID */
    if (fs.existsSync(PID_FILE)) {
        /* great, it's there. it should be a file with two numbers separated
        by a space: pid (child pid) and ppid (previous server process id) */
        var contents = fs.readFileSync(PID_FILE).toString().split(" ");
        var pid = contents[0], ppid = contents[1];

        if (pid && ppid) {
            /* kill extraneous whitespace (including trailing newline) */
            pid = pid.trim();
            ppid = ppid.trim();

            /* if the client-server process is still running (i.e. the there
            is a pid with the corresponding ppid)... */
            child_process.exec("ps -j -p" + pid, function(err, stdout, stderr) {
                if (!err && stdout.toString().indexOf(ppid) !== -1) {
                    /* try to kill it... this is the best we can do... */
                    child_process.exec("kill -9 " + pid, function() {
                        log.info(TAG, "killed orphaned process");
                        deferred.resolve();
                    });
                }
                else {
                    log.info(TAG, "previous instance not running");
                    deferred.resolve();
                }
            });
        }
        else {
            log.info(TAG, "pid file has invalid format");
            deferred.resolve();
        }
    }
    else {
        log.info(TAG, "no pid file to cleanup");
        deferred.resolve();
    }

    return deferred.promise;
}

function kill(callback) {
    var deferred = Q.defer();

    callback = callback || function() { };

    if (child && !child.dead) {
        child.on('exit', function(code, signal) {
            log.info(TAG, "stopped");
            child = null;
            killing = false;
            reconnecting = false;
            callback();
            deferred.resolve();
        });

        log.info(TAG, "stopping...");
        killing = true;
        child.kill('SIGTERM');
    }
    else {
        deferred.resolve();
        callback();
    }

    return deferred.promise;
}

function restart() {
    var deferred = Q.defer();

    if (killing || reconnecting) {
        deferred.reject({message: 'already restarting'});
        return;
    }

    exports.kill(function() {
        log.info(TAG, "connecting...");

        var options = {
            cwd: SERVER_DIR,
            env: process.env
        };

        var args = [
            'main.js',
            '--headless',
            '--listen', config.get().client.webClientPort,
            '--clienthost', '127.0.0.1',
            '--clientport', config.get().client.port
        ];

        if (config.get().debug) {
            args.push('--debug');
        }

        child = child_process.spawn('node', args, options);
        writePidFile();

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
                    console.log(TAG, data);
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
            log.error(TAG, "child process generated an error", err);
        });

        deferred.resolve();
    });

    return deferred.promise;
}

exports.init = killPreviousInstance;
exports.kill = kill;
exports.restart = restart;
