'use strict';
var Config = require('../config/config');
var AWS = require('aws-sdk');
var child_process = require('child_process');
var Q = require('q');
var log = require('log4js').getLogger('Icarus');

function ValidationException(message) {
    this.message = message;
}

var IcarusUtil = {

    ValidationException: ValidationException,

    validateAction: function (req, mapping) {
        if (!req.body.Action || !mapping[req.body.Action]) {
            throw new ValidationException("Invalid Action: " + req.body.Action);
        }
        return mapping[req.body.Action];
    },

    validateAppId: function (req) {
        var appId = req.body.AppId;
        if (!appId || !Config.packages[appId]) {
            throw new ValidationException("Invalid AppId: " + appId);
        }
        return appId;
    },

    validateMajorVersion: function (req, appId) {
        var majorVersion = req.body.MajorVersion;
        if (!majorVersion || !Config.packages[appId].majorVersions.indexOf(majorVersion) < 0) {
            throw new ValidationException("Invalid MajorVersion: " + majorVersion);
        }
        return majorVersion;
    },


    spawnCommand: function spawn(command, args, options) {
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
    },

    aws: {
        getS3Client: function () {
            return new AWS.S3({
                endpoint: new AWS.Endpoint(Config['aws']['s3']['endpoint']),
                region: Config.aws.region,
                credentials: new AWS.Credentials(Config['aws']['credentials']['accessKeyId'], Config['aws']['credentials']['secretAccessKey']),
                logger: process.stdout
            });
        },
        getEc2Client: function () {
            return  new AWS.EC2({
                endpoint: new AWS.Endpoint(Config['aws']['ec2']['endpoint']),
                region: Config['aws']['region'],
                credentials: new AWS.Credentials(Config['aws']['credentials']['accessKeyId'], Config['aws']['credentials']['secretAccessKey'])
            });
        }
    },

    getActionHandler: function (ActionHandlers) {
        return function (req, res) {
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
        }
    }
};

module.exports = IcarusUtil;