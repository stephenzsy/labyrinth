'use strict';
var Config = require('../config/config');
var AWS = require('aws-sdk');

function ValidationException(message) {
    this.message = message;
}

module.exports = {

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

    aws: {
        getS3Client: function () {
            return new AWS.S3({
                endpoint: new AWS.Endpoint(Config['aws']['s3']['endpoint']),
                region: Config.aws.region,
                credentials: new AWS.Credentials(Config['aws']['credentials']['accessKeyId'], Config['aws']['credentials']['secretAccessKey']),
                logger: process.stdout
            });
        }
    }
};