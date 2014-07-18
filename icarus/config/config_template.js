'use strict';
var config = {
    aws: {
        credentials: {
            accessKeyId: 'String',
            secretAccessKey: 'String'
        },
        region: 'String',
        ec2: {
            endpoint: 'Endpoint'
        },
        s3: {
            endpoint: 'Endpoint'
        }
    },
    apps: {
        appId: {
            localPath: 'Path',
            artifact: {
                artifactDirectory: 'Path'
            }
        }
    }, security: {
        certSubject: 'String',
        caCertPath: 'Path',
        caPKeyPath: 'Path'
    }
};

module.exports = config;