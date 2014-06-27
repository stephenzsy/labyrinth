var Config = require('../../config/config');

(function () {
    'use strict';

    if (!Config.roles.icarus.admin) {
        module.exports = null;
        return;
    }

    function PackageUtil() {

        function getPackageFilename(appId, commitId) {
            return appId + '-' + commitId + '.tar.gz';
        }

        function getPackageS3Key(appId, commitId) {
            return  Config.aws.s3.deploy.prefix + appId + '/commit/' + getPackageFilename(appId, commitId);
        }

        this.getPackageFilename = getPackageFilename;
        this.getPackageS3Key = getPackageS3Key;
    }

    module.exports = new PackageUtil();
})();
