'use strict';
var config = {
    aws: {
        credentials: {
            accessKeyId: 'TO_BE_CONFIGURED',
            secretAccessKey: 'TO_BE_CONFIGURED'
        },
        region: 'TO_BE_CONFIGURED',
        ec2: {
            endpoint: 'TO_BE_CONFIGURED'
        },
        s3: {
            endpoint: 'TO_BE_CONFIGURED'
        }
    },
    apps: {
        appId: {
            localPath: 'TO_BE_CONFIGURED',
            artifact: {
                artifactDirectory: 'TO_BE_CONFIGURED'
            }
        }
    }
};

module.exports = config;