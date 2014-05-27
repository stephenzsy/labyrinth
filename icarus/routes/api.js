'use strict';

var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var Config = require('../config/config');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');

function getEc2() {
    return  new AWS.EC2({
        endpoint: new AWS.Endpoint(Config['aws']['ec2']['endpoint']),
        region: Config['aws']['region'],
        credentials: new AWS.Credentials(Config['aws']['credentials']['accessKeyId'], Config['aws']['credentials']['secretAccessKey'])
    });
}

function getS3() {
    return  new AWS.S3({
        endpoint: new AWS.Endpoint(Config['aws']['s3']['endpoint']),
        region: Config['aws']['region'],
        credentials: new AWS.Credentials(Config['aws']['credentials']['accessKeyId'], Config['aws']['credentials']['secretAccessKey'])
    });
}

router.post('/ec2/describeInstances', function (req, res) {
    var instanceIds = req.body.InstanceIds;
    var ec2 = getEc2();
    ec2.describeInstances({'InstanceIds': instanceIds}, function (err, data) {
        if (err) {
            res.send(400, err);
            return;
        }
        res.send(data);
    });
});

function parseFilename(appId, filename) {
    if (filename.substring(0, appId.length) != appId) {
        return null;
    }
    var rest = filename.substring(appId.length, filename.length);
    var m = rest.match(/^-([0-9a-f]+)-([0-9TZ]+)\.tar\.gz$/);
    if (m == null) {
        return m;
    }
    return {
        commitId: m[1],
        timestamp: m[2]
    }
}

router.post('/artifact/local/delete', function (req, res) {
    var appId = req.body.appId;
    var filename = req.body.filename;
    if (!Config['apps'][appId]) {
        res.send(400, "Invalid appId: " + appId);
        return;
    }
    var artifactConfig = Config['apps'][appId]['artifact'];
    var parsed = parseFilename(appId, filename);
    if (parsed == null) {
        res.send(400, "Invalid filename (" + filename + ") for appId(" + appId + ")")
    }
    fs.unlink(path.join(artifactConfig['artifactDirectory'], filename), function (err) {
        if (err) {
            res.send(500, err);
            return;
        }
        res.send(200);
    });
});

function ValidationException(message) {
    this.message = message;
}

function validateAppId(req, res) {
    var appId = req.body.appId;
    if (!Config['apps'][appId]) {
        throw new ValidationException("Invalid appId: " + appId);
        return null;
    }
    return appId;
}

router.post('/artifact/local', function (req, res) {
    var appId = validateAppId(req, res);
    if (appId == null) return;
    var artifactConfig = Config['apps'][appId]['artifact'];
    var files = fs.readdir(artifactConfig['artifactDirectory'], function (err, files) {
        var results = files.map(function (filename) {
            var f = parseFilename(appId, filename);
            f['filename'] = filename;
            return f;
        });
        results.sort(function (a, b) {
            if (a.timestamp > b.timestamp) {
                return -1;
            } else {
                return 1;
            }
        });
        res.send({localArtifacts: results});
    });
});

function validateCommitId(req, res) {
    var commitId = req.body.commitId;
    if (!commitId || !commitId.match(/^[0-9a-f]+$/)) {
        res.send(400, "Invalid Commit ID: " + commitId);
        return null;
    }
    return commitId;
}

router.post('/artifact/remote', function (req, res) {
    var appId = validateAppId(req, res);
    if (appId == null) return;
    var commitId = validateCommitId(req, res);
    if (commitId == null) return;
    var artifactConfig = Config['apps'][appId]['artifact'];
    var s3 = getS3();
    s3.listObjects({
        Bucket: artifactConfig.s3Bucket,
        Prefix: artifactConfig.s3Prefix + appId + '-' + commitId
    }, function (err, data) {
        if (err) {
            console.warn(err);
            res.send(500, err);
            return;
        }
        var result = data['Contents'].map(function (s3Object) {
            return {key: s3Object.Key.substring(artifactConfig.s3Prefix.length, s3Object.Key.length)};
        });
        res.send({remoteArtifacts: result});
    });
});

router.post('/artifact/remote/upload', function (req, res) {
    var appId = validateAppId(req, res);
    if (appId == null) return;
    var filename = req.body.filename;
    var parsed = parseFilename(appId, filename);
    if (parsed == null) {
        res.send(400, "Invalid Filename: " + req.body.filename);
        return;
    }
    var artifactConfig = Config['apps'][appId]['artifact'];
    var s3 = getS3();
    var localArtifactPath = path.join(artifactConfig.artifactDirectory, filename);
    var stream = fs.createReadStream(localArtifactPath);
    s3.putObject({
        Bucket: artifactConfig.s3Bucket,
        Key: artifactConfig.s3Prefix + filename,
        Body: stream
    }, function (err, data) {
        if (err) {
            console.warn(err);
            res.send(500, err);
            return;
        }
        res.send(200);
    });
});

function formatDate(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z/, 'Z');
}

router.post('/artifact/build', function (req, res) {
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
            res.send(prefix)
        }
    });
});

// ssh - BEGIN

var Connection = require('ssh2');

function getSSHConnection(command, stdout, stderr, complete) {
    var c = new Connection();
    c.on('ready', function () {
        console.log('Connection :: ready');
        c.exec(command, function (err, stream) {
            if (err) throw err;
            stream.on('data', function (data, extended) {
                if (extended === 'stderr') {
                    // stderr
                    stderr(data);
                } else {
                    //stdout
                    stdout(data);
                }
            });
            stream.on('end', function () {
                complete();
            });
            stream.on('close', function () {
                console.log('Stream :: close');
            });
            stream.on('exit', function (code, signal) {
                console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
                c.end();
            });
        });
    });
    c.on('error', function (err) {
        console.log('Connection :: error :: ' + err);
    });
    c.on('end', function () {
        console.log('Connection :: end');
    });
    c.on('close', function (had_error) {
        console.log('Connection :: close');
    });
    return c;
}

router.post('/ec2/metadata', function (req, res) {
    var server = req.body.dnsName;
    console.log(server);
    var stdout = '';
    var conn = getSSHConnection('ec2-metadata', function (out) {
        stdout += out;
    }, function (err) {
    }, function () {
        res.send(stdout);
    });

    conn.connect({
        host: server,
        port: 22,
        username: 'ec2-user',
        privateKey: fs.readFileSync(Config.aws.ec2.keyPath)
    });
});

router.post('/bootstrap/download', function (req, res) {
    try {
        var server = req.body.dnsName;
        var appId = validateAppId();
        var artifactKey = req.body.artifactKey;
        res.send({server: server, appId: appId, artifactKey: artifactKey});
    } catch (e) {
        if (e instanceof ValidationException) {
            res.send(400, e.message)
        } else {
            throw e;
        }
    }
});

// example output:
// Connection :: connect
// Connection :: ready
// STDOUT:  17:41:15 up 22 days, 18:09,  1 user,  load average: 0.00, 0.01, 0.05
//
// Stream :: exit :: code: 0, signal: undefined
// Connection :: end
// Connection :: close

module.exports = router;
