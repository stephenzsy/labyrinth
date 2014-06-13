'use strict';

var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var Config = require('../config/config');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var log4js = require('log4js');

if (Config.roles.icarus.admin) {
    (function () {

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

        function validateAppIdInRequest(req, res) {
            var appId = req.body.appId;
            if (!Config['apps'][appId]) {
                throw new ValidationException("Invalid appId: " + appId);
                return null;
            }
            return appId;
        }

        function validateAppId(appId) {
            if (!appId || !Config.apps[appId])
                throw new ValidationException("Null AppID");
        }

        router.post('/artifact/local', function (req, res) {
            var appId = validateAppIdInRequest(req, res);
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
            var appId = validateAppIdInRequest(req, res);
            if (appId == null) return;
            var commitId = validateCommitId(req, res);
            if (commitId == null) return;
            var artifactConfig = Config['apps'][appId]['artifact'];
            var s3 = getS3();
            s3.listObjects({
                Bucket: artifactConfig.bucket,
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
            var appId = validateAppIdInRequest(req, res);
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
                Bucket: artifactConfig.bucket,
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



// ssh - BEGIN

        var Connection = require('ssh2');

        function sftpConnection(handle, complete, error) {
            var c = new Connection();
            c.on('ready', function () {
                c.sftp(function (err, sftp) {
                    if (err) {
                        error(err);
                    }
                    sftp.on('end', function () {
                        complete();
                    });
                    handle(sftp);
                });
            });
            return c;
        }

        function sshConnection(command, stdout, stderr, complete, error) {
            var c = new Connection();
            c.on('ready', function () {
                //console.log('Connection :: ready');
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
                        // console.debug('Stream :: close');
                    });
                    stream.on('exit', function (code, signal) {
                        //console.debug('Stream :: exit :: code: ' + code + ', signal: ' + signal);
                        c.end();
                    });
                });
            });
            c.on('error', function (err) {
                error(err);
                //console.log('Connection :: error :: ' + err);
            });
            c.on('end', function () {
                //console.log('Connection :: end');
            });
            c.on('close', function (had_error) {
                //console.log('Connection :: close');
            });
            return c;
        }

        function bootstrapNginxConfig(server, callback) {
            var sftpConn = sftpConnection(function (sftp) {
                var writeStream = sftp.createWriteStream(Config.nginx.remotePath);
                var stanza = printStanza(Config.nginx.stanza, 0, []);
                writeStream.write(stanza.join("\n"));
                writeStream.end("\n");
            }, function () {
                callback();
            }, function (err) {
                callback(err);
            });

            sftpConn.connect({
                host: server,
                port: 22,
                username: 'ec2-user',
                privateKey: fs.readFileSync(Config.aws.ec2.keyPath)
            });
        }

        router.post('/ec2/metadata', function (req, res) {
            var server = req.body.dnsName;
            console.log(server);
//    var stdout = '';
//    var conn = sshConnection('ec2-metadata', function (out) {
//        stdout += out;
//    }, function (err) {
//    }, function () {
//        res.send(stdout);
//    });
//
//    conn.connect({
//        host: server,
//        port: 22,
//        username: 'ec2-user',
//        privateKey: fs.readFileSync(Config.aws.ec2.keyPath)
//    });

            res.send("");
        });


        function ssh_connect() {
            var c = new Connection();
            c.on('ready', function () {
                console.log('Connection :: ready');
                c.exec('uptime', function (err, stream) {
                    if (err) throw err;
                    stream.on('data', function (data, extended) {
                        console.log((extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ')
                            + data);
                    });
                    stream.on('end', function () {
                        console.log('Stream :: EOF');
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
            c.connect({
                host: '192.168.100.100',
                port: 22,
                username: 'frylock',
                privateKey: require('fs').readFileSync('/here/is/my/key')
            });

// example output:
        }

        function exec_ssh_cmds(server, cmds) {
        }


        router.post('/bootstrap/download', function (req, res) {
            try {
                var appId = req.body.appId;
                validateAppId(appId);
                var server = req.body.server;
                var key = req.body.key;
                var artifactConfig = Config.apps[appId].artifact;
                var deployId = formatDate(new Date()) + '+' + Math.floor(Math.random() * 10000.0).toString();

                bootstrap(server, {
                    region: Config.aws.region,
                    s3Endpoint: 'https://' + Config.aws.s3.endpoint,
                    bucket: artifactConfig.s3Bucket,
                    s3Key: artifactConfig.s3Prefix + key,
                    remoteArtifactDirectory: path.join('/home/ec2-user/deploy/artifacts', appId),
                    remoteArtifactPath: path.join('/home/ec2-user/deploy/artifacts', appId, key),
                    remoteApplicationPath: path.join('/home/ec2-user/deploy', appId, deployId),
                    appDirectoryParent: '/home/ec2-user/app',
                    appDirectory: path.join('/home/ec2-user/app', appId),
                    configDirectories: {
                        nginx: path.join('/home/ec2-user/config/nginx')
                    }
                }).then(function () {
                    res.send(200);
                });
            } catch (e) {
                console.warn(e);
                res.send(500, e);
            }
            return;
            try {
                var appId = validateAppIdInRequest(req);
                var key = req.body.key;
                var artifactConfig = Config.apps[appId].artifact;
                var deployId = formatDate(new Date()) + '+' + Math.floor(Math.random() * 10000.0).toString();

                var p = {
                    region: Config.aws.region,
                    s3Endpoint: 'https://' + Config.aws.s3.endpoint,
                    bucket: artifactConfig.s3Bucket,
                    s3Key: artifactConfig.s3Prefix + key,
                    remoteArtifactDirectory: path.join('/home/ec2-user/deploy/artifacts', appId),
                    remoteArtifactPath: path.join('/home/ec2-user/deploy/artifacts', appId, key),
                    remoteApplicationPath: path.join('/home/ec2-user/deploy', appId, deployId),
                    appDirectoryParent: '/home/ec2-user/app',
                    appDirectory: path.join('/home/ec2-user/app', appId),
                    configDirectories: {
                        nginx: path.join('/home/ec2-user/config/nginx')
                    }
                };

                // compose command
                var cmds = [
                    ['mkdir' , '-p', p.remoteArtifactDirectory],
                    ['aws', '--region', p.region, 's3api', 'get-object', '--bucket', p.s3Bucket, '--key', p.s3Key, p.remoteArtifactPath], // download
                    ['mkdir', '-p', p.remoteApplicationPath],
                    ['cd', p.remoteApplicationPath ],
                    ['tar', 'xzvf', p.remoteArtifactPath], // unpack
                    ['mkdir', '-p', p.appDirectoryParent],
                    ['ln', '-snf', p.remoteApplicationPath, p.appDirectory],
                    ['cd', p.appDirectory],
                    ['npm', 'link'], // update packages
                    ['mkdir', '-p', p.configDirectories.nginx] // nginx conf
                ];

                var execCmds = cmds.map(function (cmd) {
                    return cmd.join(" ")
                }).join(";\n");

                var stdout = '';
                var stderr = '';
                var conn = sshConnection(execCmds, function (data) {
                    stdout += data;
                }, function (data) {
                    stderr += data;
                }, function () {
                    console.log(stdout);
                    console.warn(stderr);
                    bootstrapNginxConfig(server, function (err) {
                        if (err) {
                            res.send(400, err);
                            return;
                        }
                        var c = sshConnection(['sudo', 'ln', '-snf', Config.nginx.remotePath, '/opt/nginx/conf/nginx.conf'].join(" "), function (data) {
                            stdout += data;
                        }, function (data) {
                            stderr += data;
                        }, function () {
                            console.log(stdout);
                            console.warn(stderr);
                            res.send(stdout);
                        }, function (err) {
                            res.send(500, err);
                        });
                        console.log("PRE");
                        c.connect({
                            host: server,
                            port: 22,
                            username: 'ec2-user',
                            privateKey: fs.readFileSync(Config.aws.ec2.keyPath)
                        });
                    });
                }, function (err) {
                    res.send(500, err);
                });

                //console.log(execCmds);
                conn.connect({
                    host: server,
                    port: 22,
                    username: 'ec2-user',
                    privateKey: fs.readFileSync(Config.aws.ec2.keyPath)
                });
            } catch (e) {
                if (e instanceof ValidationException) {
                    res.send(400, e.message);
                } else {
                    throw e;
                }
            }


        });
    })();
}

module.exports = router;

