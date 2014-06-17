var Config = require('../config/config');
var IcarusUtil = require('./util');
var Q = require('q');

'use strict';

module.exports = function () {
    var s3 = IcarusUtil.aws.getS3Client();

    this.getDeployablePackageVersions = function (appId) {
        return Q.Promise(function (c, e, p) {
            s3.listObjects({Bucket: Config.aws.s3.deploy.bucket, Prefix: Config.aws.s3.deploy.prefix + appId + '/'}, function(err, data){
                if(err) {
                    e(err);
                }
                console.log(data);
            });
        });
    }
};
