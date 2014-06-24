var Config = require('../../config/config');
var express = require('express');
var router = express.Router();
var log = require('log4js').getLogger('Icarus');
var IcarusUtil = require('../../lib/util');
var child_process = require('child_process');
var https = require('https');
var Q = require('q');
var jsdom = require('jsdom');
var AWS = require('aws-sdk');
var path = require('path');
var fs = require('fs');
var packageRepo = new (require('../../lib/package-repository'))();
var Connection = require('ssh2');
var PackageUtil = require('./package-util');

(function () {
    'use strict';

    var ImporterRetriever = {
        angular: {
            retrieveVersion: function (version) {
                return Q.Promise(function (c, e, p) {
                    https.get('https://code.angularjs.org/' + version + '/angular-' + version + '.zip');
                });
            }
        }
    };

    // skip registration if role not configured
    if (!Config.roles.icarus.admin) {
        return;
    }

    function getS3() {
        return new AWS.S3({
            endpoint: new AWS.Endpoint(Config['aws']['s3']['endpoint']),
            region: Config.aws.region,
            credentials: new AWS.Credentials(Config['aws']['credentials']['accessKeyId'], Config['aws']['credentials']['secretAccessKey']),
            logger: process.stdout
        });
    }

    function describePackageVersions(appId) {
        var s3 = getS3();
        return Q.allSettled(Config.packages[appId].versions.map(function (version) {
            var s3Key = Config.aws.s3.deploy.prefix + appId + '/versions/' + version + '.tar.gz';
            return Q.Promise(function (resolve, reject, progress) {
                var result = {Version: version};
                s3.headObject({Bucket: Config.aws.s3.deploy.bucket, Key: s3Key}, function (err, data) {
                    if (err) {
                        if (err.code === 'NotFound') {
                            result['Status'] = 'NotFound';
                            resolve(result);
                            return;
                        }
                        reject(err);
                        return;
                    }
                    result['Status'] = 'Available';
                    resolve(result);
                });
            });
        }));
    }

    function getPackageFilename(appId, commitId) {
        return appId + '-' + commitId + '.tar.gz';
    }

    function getPackageS3Key(appId, commitId) {
        return  Config.aws.s3.deploy.prefix + appId + '/commit/' + getPackageFilename(appId, commitId);
    }

    function describePackageCommits(appId, commits) {
        var s3 = getS3();
        return Q.all(commits.map(function (commit) {
            return Q.Promise(function (resolve, reject, progress) {
                s3.headObject({Bucket: Config.aws.s3.deploy.bucket, Key: getPackageS3Key(appId, commit.commitId)}, function (err, data) {
                    if (err) {
                        if (err.code === 'NotFound') {
                            commit['status'] = 'NotFound';
                            resolve(commit);
                            return;
                        }
                        reject(err);
                        return;
                    }
                    commit['status'] = 'Available';
                    resolve(commit);
                });
            });
        }));
    }

    function spawn(command, args, options) {
        var stdout = '';
        var stderr = '';
        var handle = child_process.spawn(command, args, options);
        handle.stdout.on('data', function (data) {
            stdout += data;
        });
        handle.stderr.on('data', function (data) {
            stderr += data;
        });
        return Q.Promise(function (c, e, p) {
            handle.on('close', function (code) {
                c({code: code, stdout: stdout, stderr: stderr});
            });
            handle.on('error', function (err) {
                e(err);
            })
        });
    }

    function validateCommitId(req, appId) {
        var commitId = req.body.CommitId;
        if (!commitId) {
            throw new IcarusUtil.ValidationException("Null CommitId");
        }
        if (!/^[A-Fa-f0-9]+$/.test(commitId)) {
            throw new IcarusUtil.ValidationException("Invalid CommitId: " + commitId);
        }
        return spawn('git', ['show', '-s', commitId], {cwd: Config.packages[appId].repo.path })
            .then(function (result) {
                if (result.code != 0) {
                    throw new IcarusUtil.ValidationException("Invalid CommitID: " + commitId);
                }
                return commitId;
            });
    }

    function uploadPackageToS3(appId, commitId, localPath) {
        return Q.Promise(function (c, e, p) {
            var s3 = getS3();
            var stream = fs.createReadStream(localPath);
            s3.putObject({
                Bucket: Config.aws.s3.deploy.bucket,
                Key: getPackageS3Key(appId, commitId),
                Body: stream}, function (err, data) {
                if (err) {
                    e(err);
                    return;
                }
                c(data);
            });
        });

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
    }

    // SSH - begin

    function ssh_connect(server, onReady, onError, onClose) {
        var c = new Connection();
        c.on('ready', function () {
            log.debug('Connection :: ready');
            onReady(c);
        });
        c.on('error', function (err) {
            log.debug('Connection :: error :: ' + err);
            onError(err);
        });
        c.on('end', function () {
            log.debug('Connection :: end');
        });
        c.on('close', function (had_error) {
            log.debug('Connection :: close');
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
        log.debug("Commands: " + cmd);
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
                        log.debug('Stream :: EOF');
                    });
                    stream.on('close', function () {
                        log.debug('Stream :: close');
                    });
                    stream.on('exit', function (code, signal) {
                        log.debug('Stream :: exit :: code: ' + code + ', signal: ' + signal);
                        c.end();
                    });
                });
            }, reject, resolve);
        });
    }


    function bootstrap(server, p) {
        log.info('Bootstrap server: ' + server);
        return new Q.Promise(function (resolve, reject, notify) {
            return exec_ssh_cmds(server, [
                ['mkdir' , '-p', p.remotePackageDir],
                ['aws', '--region', p.region, 's3api', 'get-object', '--bucket', p.s3Bucket, '--key', p.s3Key, p.remotePackagePath], // download
                ['mkdir', '-p', p.remoteApplicationPath]
            ]).then(function () {
                log.info('Download completed');
                notify({status: "Download completed"});
                return exec_ssh_cmds(server, [
                    ['cd', p.remoteApplicationPath ],
                    ['tar', 'xzvf', p.remoteArtifactPath], // unpack
                    ['mkdir', '-p', p.appDirectoryParent],
                    ['ln', '-snf', p.remoteApplicationPath, p.appDirectory]
                ]);
            }).then(function () {
                log.info('Flip completed');
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
                log.info("Package update completed");
                notify({status: "Package update completed"});
                return sftp_write_file(server, path.join(p.appDirectory, 'config', 'config.js'), printConfig() + "\n");
            }).then(function () {
                log.info("Config deployed");
                notify({status: "Config deployed"});
                return sftp_write_file(server, p.nginx.path, printStanza(Config.nginx.stanza, 0, []).join("\n") + "\n");
            }).then(function () {
                log.info('Nginx config pushed');
                notify({status: 'Nginx config pushed'});
                return exec_ssh_cmds(server, [
                    ['sudo', 'ln', '-sf', p.nginx.path, '/opt/nginx/conf/nginx.conf'],
                    ['sudo', 'service', 'nginx', 'restart']
                ], {pty: true});
            }).then(function () {
                log.info('Nginx started');
                notify({status: 'Nginx started'});
                resolve();
            }, reject, notify);
        });
    }


    // SSH - end

    var ActionHandlers = {
        BootstrapServer: function (req, callback) {
            var appId = req.body.AppId;
            var commitId = req.body.CommitId;
            bootstrap(req.body.Server, {
                region: Config.aws.region,
                s3Bucket: Config.aws.s3.deploy.bucket,
                s3Key: PackageUtil.getPackageS3Key(appId, commitId),
                remotePackageDir: path.join('/home/ec2-user/deploy/_package', appId),
                remotePackagePath: path.join('/home/ec2-user/deploy/_package', appId, PackageUtil.getPackageFilename(appId, commitId))
            }).done(function (data) {
                callback(data);
            });
        },
        GetBootstrapPackages: function (req, callback) {
            var promises = [];
            for (var appId in Config.packages) {
                var p = Config.packages[appId];
                if (p.bootstrap) {
                    var promise = packageRepo.getPackageRepoCommits(appId)
                        .then(function (versions) {
                            return {
                                appId: appId,
                                config: p,
                                versions: versions.map(function (v) {
                                    v['version'] = v.commitId;
                                    return v;
                                })
                            };
                        });
                    promises.push(promise);
                }
            }
            Q.all(promises)
                .then(function (results) {
                    callback(results);
                });
        },
        ListPackages: function (req, callback) {
            callback(Config.packages);
        },
        ImportPackage: function (req, callback) {
            var appId = IcarusUtil.validateAppId(req);
            var p = Config.packages[appId];
            callback(p);
        },
        GetPackageVersions: function (req, callback) {
            var appId = IcarusUtil.validateAppId(req);
            describePackageVersions(appId).done(function (data) {
                callback(data.map(function (result) {
                    return result.value;
                }));
            });
        },
        ListCommits: function (req, callback, error) {
            var appId = IcarusUtil.validateAppId(req);
            var p = Config.packages[appId];
            spawn('git', ['log', '-5', '--pretty=format:%h,%cd,%s'], {cwd: p.repo.path})
                .then(function (result) {
                    var stdout = result.stdout;
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
                    return commits;
                }).then(function (commits) {
                    return describePackageCommits(appId, commits);
                }).done(function (result) {

                    console.log(result);

                    callback({commits: result});
                }, error);
        },
        BuildPackage: function (req, callback, error) {
            var appId = IcarusUtil.validateAppId(req);
            var outputPath = null;
            var gCommitId = null;
            validateCommitId(req, appId)
                .then(function (commitId) {
                    gCommitId = commitId;
                    outputPath = path.join(Config.build.path, getPackageFilename(appId, commitId));
                    return spawn('git', ['archive', commitId, '--format=tar.gz', '--output', outputPath], {cwd: Config.packages[appId].repo.path});
                }).then(function (result) {
                    if (result.code != 0)
                        throw result;
                    return uploadPackageToS3(appId, gCommitId, outputPath)
                }).then(callback, error);
        }
    };

    router.post('/', function (req, res) {
        log.debug("REQ: " + JSON.stringify(req.body));
        try {
            var handler = IcarusUtil.validateAction(req, ActionHandlers);
            handler(req, function (result) {
                log.debug("RES: " + JSON.stringify(result));
                res.send(result);
            }, function (e) {
                if (e instanceof IcarusUtil.ValidationException) {
                    res.send(400, e.message);
                } else {
                    console.warn(e);
                    res.send(500, e);
                }
            });
        } catch (e) {
            if (e instanceof IcarusUtil.ValidationException) {
                res.send(400, e.message);
            } else {
                console.warn(e);
                res.send(500, e);
            }
        }
    });
})
();

module.exports = router;
