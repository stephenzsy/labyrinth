'use strict';

var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var Config = require('../config/config');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');

if (Config.roles.icarus.admin) {
    (function () {
        /* GET home page. */
        router.get('/', function (req, res) {
            res.render('index', { title: 'Icarus' });
        });

        router.get('/instances', function (req, res) {
            var ec2 = new AWS.EC2({
                endpoint: new AWS.Endpoint(Config['aws']['ec2']['endpoint']),
                region: Config['aws']['region'],
                credentials: new AWS.Credentials(Config['aws']['credentials']['accessKeyId'], Config['aws']['credentials']['secretAccessKey'])
            });
            var response = ec2.describeInstances({}, function (err, data) {
                if (err) {
                    res.send(500, err);
                    return;
                }
                var reservations = data['Reservations'];
                var instances = [];
                reservations.forEach(function (reservation) {
                    instances = instances.concat(reservation['Instances']);
                });
                res.send(instances);
            });
        });

        router.get('/vcs', function (req, res) {
            var appId = req.query.appId;
            if (!appId) {
                res.send(404, "appId not specified");
                return;
            }
            var appLocalPath = Config['apps'][appId]['localPath'];
            if (!appLocalPath) {
                res.send(404, "AppId not found: " + appId);
                return;
            }
            child_process.exec('cd ' + appLocalPath + ';  git log -5 --pretty=format:"%h,%cd,%s";', function (error, stdout, stderr) {
                if (error) {
                    console.error(error);
                    res.send('404');
                    return;
                }
                var commits = [];
                stdout.split("\n").forEach(function (line) {
                    var parts = line.trim().split(',');
                    if (parts.length < 3) {
                        return;
                    }
                    var commitId = parts.shift();
                    var date = parts.shift();
                    var releaseNotes = parts.join(',');
                    commits.push({
                        commitId: commitId,
                        date: date,
                        releaseNotes: releaseNotes
                    });
                });
                res.send({commits: commits});
            });
        });

        function formatDate(date) {
            return date.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z/, 'Z');
        }

        function parseDate(dateString) {
            var m = /^(\d{4})$/.match(dateString);
            var date = new Date(0);

            date.setUTCFullYear(m[1]);
            console.log(date);
            return date;
        }

        router.get('/artifact', function (req, res) {
            var appId = req.query.appId;
            if (!Config['apps'][appId]) {
                res.send(400, "Invalid appId: " + appId);
                return;
            }
            var artifactConfig = Config['apps'][appId]['artifact'];
            var files = fs.readdirSync(artifactConfig['artifactDirectory']);


            var debug = {files: files};
            res.send({local: [], remote: [], debug: debug});
        });

        router.post('/build', function (req, res) {
            var params = req.body;
            var type = params['type'];
            if (type != 'artifact') {
                res.send(400, "Invalid Type: " + type);
                return;
            }
            var appId = params['appId'];
            var appConfig = Config['apps'][appId];
            if (!appId || !appConfig) {
                res.send(400, "Malformed appId: " + appId);
                return;
            }
            var commitId = params['commitId'];
            if (!commitId) {
                res.send(400, "No commitId specified");
                return;
            }
            if (!/^[A-Fa-f0-9]+$/.test(commitId)) {
                res.send(400, "Malformed commitId: " + commitId);
                return;
            }
            child_process.exec('cd ' + appConfig['localPath'] + ';  git show -s ' + commitId + ';', function (error, stdout, stderr) {
                if (error) {
                    res.send(404, "Commit ID not found: " + commitId);
                    return;
                }
                else {
                    var date = new Date();
                    var prefix = appId + '-' + commitId + '-' + formatDate(date);
                    var outputPath = appConfig['artifact']['artifactDirectory'] + '/' + prefix + '.tar.gz';
                    var command = 'cd ' + appConfig['localPath'] + ';' + 'git archive ' + commitId + ' --format=tar.gz --prefix \'' + prefix + '/\' --output \'' + outputPath + '\';';
                    console.log(command);
                    child_process.exec(command, function (error, stdout, stderr) {
                        if (error) {
                            res.send(500, error);
                        }
                    });
                    res.send('200', 'prefix')
                }
            });
        });
    })();
} else {
    router.get('/', function (req, res) {
        res.send("Healthy");
    });
}
module.exports = router;
