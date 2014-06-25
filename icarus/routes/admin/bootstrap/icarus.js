var path = require('path');

var Config = require('../../../config/config');

(function () {
    'use strict';

    if (!Config.roles.icarus.bootstrap) {
        module.exports = null;
        return;
    }

    module.exports = function () {
        function printBootstrapScript() {
            var remotePackageLandingDir = path.join('/home/ec2-user/deploy/_package', 'icarus');
            return [
                ['mkdir', '-p', remotePackageLandingDir]
                ['aws']
            ].map(function (cmdArgs) {
                    return cmdArgs.join(" ")
                }).join("\n");
            //  ['aws', '--region', p.region, 's3api', 'get-object', '--bucket', p.s3Bucket, '--key', p.s3Key, p.remotePackagePath], // download
            // ['mkdir', '-p', p.remoteApplicationPath]

        }

        this.printBootstrapScript = printBootstrapScript;
    };
})();