var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var Config = require('../config/config');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var Connection = require('ssh2');
var log4js = require('log4js');

(function () {
    'use strict';

    var logger = log4js.getLogger();

    router.get('/:instanceId', function (req, res) {
        var instanceId = req.params['instanceId'];
        res.render('bootstrap', { instanceId: instanceId});
    });

    function formatDate(date) {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z/, 'Z');
    }

    function validateAppId(appId) {
        if (!appId || !Config.apps[appId])
            throw new ValidationException("Null AppID");
    }

    function exec_ssh_cmds(server, cmds) {
        var cmd = cmds.map(function (cmd) {
            return cmd.join(" ");
        }).join(";\n");
        return new Q.Promise(function (resolve, reject, notify) {
            var c = new Connection();
            c.on('ready', function () {
                logger.debug('Connection :: ready');
                c.exec(cmd, function (err, stream) {
                    if (err) throw err;
                    stream.on('data', function (data, extended) {
                        if (extended === 'stderr') {
                            notify({stderr: data.toString()});
                        }
                        else {
                            notify({stdout: data.toString()});
                        }
                    });
                    stream.on('end', function () {
                        logger.debug('Stream :: EOF');
                    });
                    stream.on('close', function () {
                        logger.debug('Stream :: close');
                    });
                    stream.on('exit', function (code, signal) {
                        logger.debug('Stream :: exit :: code: ' + code + ', signal: ' + signal);
                        c.end();
                    });
                });
            });
            c.on('error', function (err) {
                logger.debug('Connection :: error :: ' + err);
                reject(err);
            });
            c.on('end', function () {
                logger.debug('Connection :: end');
            });
            c.on('close', function (had_error) {
                logger.debug('Connection :: close');
                resolve();
            });
            c.connect({
                host: server,
                port: 22,
                username: 'ec2-user',
                privateKey: fs.readFileSync(Config.aws.ec2.keyPath)
            });
        });
    }

    function bootstrap(server, p) {
        console.log('Bootstrap server: ' + server);
        return new Q.Promise(function (resolve, reject, notify) {
            return exec_ssh_cmds(server, [
                ['mkdir' , '-p', p.remoteArtifactDirectory],
                ['aws', '--region', p.region, 's3api', 'get-object', '--bucket', p.s3Bucket, '--key', p.s3Key, p.remoteArtifactPath], // download
                ['mkdir', '-p', p.remoteApplicationPath],
            ]).then(function () {
                notify({status: "Download Completed"});
                return exec_ssh_cmds(server, [
                    ['cd', p.remoteApplicationPath ],
                    ['tar', 'xzvf', p.remoteArtifactPath], // unpack
                    ['mkdir', '-p', p.appDirectoryParent],
                    ['ln', '-snf', p.remoteApplicationPath, p.appDirectory],
                ]);
            }).then(function () {
                notify({status: "Flip completed"});
                return exec_ssh_cmds(server, [
                    ['cd', p.appDirectory],
                    ['npm', 'update'], // update packages
                    ['mkdir', '-p', p.configDirectories.nginx] // nginx conf
                ]);
            }).then(function () {
                notify({status: "Package update completed"});
                resolve();
            }, reject, notify);
        });
        return exec_ssh_cmds(server,
            [
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
            ]);
    }

    router.post('/api/start/:instanceId', function (req, res) {
        try {
            var appId = req.body.appId;
            validateAppId(appId);
            var server = req.body.server;
            var key = req.body.key;
            var artifactConfig = Config.apps[appId].artifact;
            var deployId = formatDate(new Date()) + '+' + Math.floor(Math.random() * 10000.0).toString();
            res.writeHead(200);

            bootstrap(server, {
                region: Config.aws.region,
                s3Endpoint: 'https://' + Config.aws.s3.endpoint,
                s3Bucket: artifactConfig.s3Bucket,
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
                res.end();
            }, function () {
            }, function (notification) {
                res.write(JSON.stringify(notification));
                res.write("\n")
            });
        } catch (e) {
            console.warn(e);
            res.send(500, e);
        }
    });


    module.exports = router;
})();