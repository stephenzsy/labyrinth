var path = require('path');
var Q = require('q');

var Config = require('../../../config/config');
var IcarusUtil = require('../../../lib/util');
var PackageUtil = require('../package-util');

(function () {
    'use strict';

    var APP_ID = 'icarus';

    if (!Config.roles.icarus.bootstrap) {
        module.exports = null;
        return;
    }

    module.exports = function () {

        function testExecuteBootstrapScript(parameters, callback) {
            var s3 = IcarusUtil.aws.getS3Client();
            var remotePackageLandingDir = path.join(process.env.HOME, 'deploy', '_package', 'icarus');
            var args = [].concat(
                ['--app-id', 'icarus'],
                ['--app-deployment-dir', remotePackageLandingDir],
                ['--package-url', s3.getSignedUrl('getObject', {
                    Bucket: Config.aws.s3.deploy.bucket,
                    Key: PackageUtil.getPackageS3Key('icarus', parameters.commitId),
                    Expires: 900
                })],
                ['--icarus-config-url', path.join(Config.build.path, 'config', 'config.js')]
            );

            IcarusUtil.spawnCommand(path.join(Config.packages.icarus.repo.path, 'scripts/bootstrap.rb'), args).done(callback);
        }

        function printConfig(callback) {
            var config = {
                roles: {
                    icarus: {
                        admin: false,
                        bootstrap: false
                    }
                },
                aws: {
                    credentials: Config.aws.credentials,
                    s3: {
                        endpoint: Config.aws.s3.endpoint,
                        deploy: Config.aws.s3.deploy
                    }
                }};
            return "module.exports=" + JSON.stringify(config) + ";\n";
        }

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

        this.testExecuteBootstrapScript = testExecuteBootstrapScript;

        this.printBootstrapScript = printBootstrapScript;

        this.printConfig = printConfig;

        this.beginBootstrapWorkflow = function (params) {
            var sshParams = {
                host: params.server,
                port: 22,
                username: 'ec2-user',
                privateKey: require('fs').readFileSync(Config.aws.ec2.keyPath)
            };
            return IcarusUtil.sshConnect(sshParams).then(function (conn) {
                return IcarusUtil.sftp(conn).then(function (sftp) {
                    return Q.Promise(function (c, e, p) {
                        sftp.readdir('/home/ec2-user', function (err, list) {
                            if (err) throw err;
                            console.dir(list);
                            c();
                        });
                    });
                }).then(function () {
                    return IcarusUtil.executeSshCommands(conn, [
                        ['uname', '-a'],
                        ['node', '--version']
                    ]);
                }).then(function (exitStatus) {
                    conn.end();
                    return exitStatus;
                });
            }).then(function (exitStatus) {
                console.log(exitStatus);
                return 'ok'
            });
        }
    };
})();