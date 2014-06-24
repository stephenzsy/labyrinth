var Config = require('../../config/config');

(function () {
    'use strict';

    function getPackageFilename(appId, commitId) {
        return appId + '-' + commitId + '.tar.gz';
    }

    module.exports = {

        getPackageFilename: getPackageFilename,

        getPackageS3Key: function (appId, commitId) {
            return  Config.aws.s3.deploy.prefix + appId + '/commit/' + getPackageFilename(appId, commitId);
        }
    };
})();
