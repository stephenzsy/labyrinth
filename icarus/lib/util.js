'use strict';
var Config = require('../config/config');
var AWS = require('aws-sdk');
var child_process = require('child_process');
var Q = require('q');
var log = require('log4js').getLogger('IcarusUtil');
var Connection = require('ssh2');


function IcarusUtil() {
    'use strict';

    function ValidationException(message) {
        this.message = message;
    }

    this.ValidationException = ValidationException;

    function validateAction(req, mapping) {
        if (!req.body.Action || !mapping[req.body.Action]) {
            throw new ValidationException("Invalid Action: " + req.body.Action);
        }
        return mapping[req.body.Action];
    }

    this.validateAction = validateAction;

    this.validateAppId = function (req) {
        var appId = req.body.AppId;
        if (!appId || !Config.packages[appId]) {
            throw new ValidationException("Invalid AppId: " + appId);
        }
        return appId;
    };

    this.validateMajorVersion = function (req, appId) {
        var majorVersion = req.body.MajorVersion;
        if (!majorVersion || !Config.packages[appId].majorVersions.indexOf(majorVersion) < 0) {
            throw new ValidationException("Invalid MajorVersion: " + majorVersion);
        }
        return majorVersion;
    };

    this.spawnCommand = function spawn(command, args, options) {
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
    };

    this.aws = new (function () {

        function getCredentialsProviderChain() {
            var providers = [];
            if (Config.aws.credentials) {
                providers.push(new AWS.Credentials(Config.aws.credentials['accessKeyId'], Config.aws.credentials['secretAccessKey']));
            }
            providers.push(new AWS.EC2MetadataCredentials());
            return new AWS.CredentialProviderChain(providers);
        }

        this.getS3Client = function () {
            return new AWS.S3({
                endpoint: new AWS.Endpoint(Config['aws']['s3']['endpoint']),
                region: Config.aws.region,
                credentialProvider: getCredentialsProviderChain()
            });
        };

        this.getEc2Client = function () {
            return  new AWS.EC2({
                endpoint: new AWS.Endpoint(Config['aws']['ec2']['endpoint']),
                region: Config['aws']['region'],
                credentialProvider: getCredentialsProviderChain()
            });
        };

        this.getDynamoDbClient = function () {
            return new AWS.DynamoDB({
                endpoint: new AWS.Endpoint(Config.aws.dynamodb.endpoint),
                region: Config.aws.region,
                credentialProvider: getCredentialsProviderChain()
            });
        };

        this.getRoute53Client = function () {
            return new AWS.Route53({
                endpoint: new AWS.Endpoint(Config.aws.route53.endpoint),
                credentialProvider: getCredentialsProviderChain()
            });
        }
    })();

    this.getActionHandler = function (actionHandlers) {
        return function (req, res) {
            log.debug("REQ: " + JSON.stringify(req.body));
            try {
                var handler = validateAction(req, actionHandlers);
                handler(req, function (result) {
                    log.debug("RES: " + JSON.stringify(result));
                    res.send(result);
                }, function (e) {
                    if (e instanceof ValidationException) {
                        res.send(400, e.message);
                    } else {
                        console.warn(e);
                        res.send(500, e);
                    }
                });
            } catch (e) {
                if (e instanceof ValidationException) {
                    res.send(400, e.message);
                } else {
                    console.warn(e);
                    res.send(500, e);
                }
            }
        }
    };

    // SSH
    this.executeSshCommands = function (conn, opts, cmds) {
        var commands = cmds.map(function (cmd) {
            return cmd.join(' ');
        }).join(";\n");
        log.info("Execute Commands:\n" + commands);
        return Q.Promise(function (c, e, p) {
            conn.exec(commands, opts, function (err, stream) {
                var stdout = '';
                var stderr = '';
                var execCode = null;
                var execSignal = null;
                if (err) {
                    e(err);
                    return;
                }
                stream.on('data', function (data, extended) {
                    if (extended === 'stderr') {
                        stderr += data.toString();
                        return;
                    }
                    stdout += data.toString();
                });
                stream.on('end', function () {
                    log.debug('Stream :: EOF');
                });
                stream.on('close', function () {
                    log.debug('Stream :: close');
                    c({code: execCode, signal: execSignal, stdout: stdout, stderr: stderr});
                });
                stream.on('exit', function (code, signal) {
                    log.debug('Stream :: exit :: code: ' + code + ', signal: ' + signal);
                    execCode = code;
                    execSignal = signal;
                });
            });
        });
    };

    function sshConnect(params) {
        var conn = new Connection();
        return Q.Promise(function (c, e, p) {
            conn.on('ready', function () {
                log.info('Connection : ' + params.host + ' : ready');
                c(conn);
            });
            conn.on('error', function (err) {
                log.info('Connection : ' + params.host + ' : error :' + err);
                e(err);
            });
            conn.on('end', function () {
                log.info('Connection : ' + params.host + ' : end');
            });
            conn.on('close', function (had_error) {
                log.info('Connection : ' + params.host + ' : close');
            });
            conn.connect({
                host: params.host,
                port: params.port,
                username: params.username,
                privateKey: params.privateKey
            });
        });
    }

    this.sshConnect = sshConnect;

    this.sftp = function (conn) {
        return Q.Promise(function (c, e, p) {
            conn.sftp(function (err, sftp) {
                if (err) throw err;
                c(sftp);
            });
        });
    };
}

module.exports = new IcarusUtil();