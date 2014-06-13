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

if (Config.roles.icarus.bootstrap) {

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

        function ssh_connect(server, onReady, onError, onClose) {
            var c = new Connection();
            c.on('ready', function () {
                logger.debug('Connection :: ready');
                onReady(c);
            });
            c.on('error', function (err) {
                logger.debug('Connection :: error :: ' + err);
                onError(err);
            });
            c.on('end', function () {
                logger.debug('Connection :: end');
            });
            c.on('close', function (had_error) {
                logger.debug('Connection :: close');
                onClose();
            });
            c.connect({
                host: server,
                port: 22,
                username: 'ec2-user',
                privateKey: fs.readFileSync(Config.aws.ec2.keyPath)
            });
        }

        function exec_ssh_cmds(server, cmds, options) {
            var cmd = cmds.map(function (cmd) {
                return cmd.join(" ");
            }).join(";\n");
            return new Q.Promise(function (resolve, reject, notify) {
                ssh_connect(server, function (c) {
                    c.exec(cmd, options, function (err, stream) {
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
                }, reject, resolve);
            });
        }

        function expandIndent(indent) {
            var whitespace = '';
            for (var i = 0; i < indent; ++i) {
                whitespace += '  ';
            }
            return whitespace;
        }

        function printStanza(stanza, indent, lines) {
            for (var key in stanza) {
                var value = stanza[key];
                if (typeof(value) === 'object') {
                    lines.push(expandIndent(indent) + key + " {");
                    printStanza(value, indent + 1, lines);
                    lines.push(expandIndent(indent) + "}");
                } else {
                    lines.push(expandIndent(indent) + key + ' ' + value + ";");
                }
            }
            return lines;
        }

        function sftp_write_file(server, path, content) {
            return new Q.Promise(function (resolve, reject, notify) {
                ssh_connect(server, function (conn) {
                    conn.sftp(function (err, sftp) {
                        if (err) throw err;
                        var writer = sftp.createWriteStream(path);
                        writer.on('error', reject);
                        writer.end(content, null, function () {
                            logger.debug('SFTP :: SFTP write ended');
                            conn.end();
                        });
                    });
                }, reject, resolve);
            });
        }

        function printConfig() {
            var c = {roles: {icarus: {app: true}}};
            return "'use strict';\n" + "module.exports = " + JSON.stringify(c, null, 2) + ";";
        }

        function bootstrap(server, p) {
            logger.info('Bootstrap server: ' + server);
            return new Q.Promise(function (resolve, reject, notify) {
                return exec_ssh_cmds(server, [
                    ['mkdir' , '-p', p.remoteArtifactDirectory],
                    ['aws', '--region', p.region, 's3api', 'get-object', '--bucket', p.s3Bucket, '--key', p.s3Key, p.remoteArtifactPath], // download
                    ['mkdir', '-p', p.remoteApplicationPath]
                ]).then(function () {
                    logger.info('Download completed');
                    notify({status: "Download completed"});
                    return exec_ssh_cmds(server, [
                        ['cd', p.remoteApplicationPath ],
                        ['tar', 'xzvf', p.remoteArtifactPath], // unpack
                        ['mkdir', '-p', p.appDirectoryParent],
                        ['ln', '-snf', p.remoteApplicationPath, p.appDirectory]
                    ]);
                }).then(function () {
                    logger.info('Flip completed');
                    notify({status: "Flip completed"});
                    return exec_ssh_cmds(server, [
                        ['cd', p.appDirectory],
                        ['mkdir', '-p', p.nodeModulesPath],
                        ['ln', '-snf', p.nodeModulesPath, path.join(p.appDirectory, 'node_modules')],
                        ['npm', 'install'], // update packages
                        ['mkdir', '-p', p.nginx.directory], // nginx conf
                        ['mkdir', '-p', path.join(p.appDirectory, 'config')]
                    ]);
                }).then(function () {
                    logger.info("Package update completed");
                    notify({status: "Package update completed"});
                    return sftp_write_file(server, path.join(p.appDirectory, 'config', 'config.js'), printConfig() + "\n");
                }).then(function () {
                    logger.info("Config deployed");
                    notify({status: "Config deployed"});
                    return sftp_write_file(server, p.nginx.path, printStanza(Config.nginx.stanza, 0, []).join("\n") + "\n");
                }).then(function () {
                    logger.info('Nginx config pushed');
                    notify({status: 'Nginx config pushed'});
                    return exec_ssh_cmds(server, [
                        ['sudo', 'ln', '-sf', p.nginx.path, '/opt/nginx/conf/nginx.conf'],
                        ['sudo', 'service', 'nginx', 'restart']
                    ], {pty: true});
                }).then(function () {
                    logger.info('Nginx started');
                    notify({status: 'Nginx started'});
                    resolve();
                }, reject, notify);
            });
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
                    bucket: artifactConfig.s3Bucket,
                    s3Key: artifactConfig.s3Prefix + key,
                    remoteArtifactDirectory: path.join('/home/ec2-user/deploy/artifacts', appId),
                    remoteArtifactPath: path.join('/home/ec2-user/deploy/artifacts', appId, key),
                    remoteApplicationPath: path.join('/home/ec2-user/deploy', appId, deployId),
                    nodeModulesPath: path.join('/home/ec2-user/deploy', appId, 'node_modules'),
                    appDirectoryParent: '/home/ec2-user/app',
                    appDirectory: path.join('/home/ec2-user/app', appId),
                    nginx: {
                        directory: '/home/ec2-user/config/nginx',
                        path: path.join('/home/ec2-user/config/nginx', 'nginx.conf')
                    }
                }).then(function () {
                    res.end();
                }, function () {
                }, function (notification) {
                    res.write(JSON.stringify(notification) + "\n");
                });
            } catch (e) {
                console.warn(e);
                res.send(500, e);
            }
        });
    })();
}

module.exports = router;
