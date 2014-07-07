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

        function printConfig() {
            var config = {
                roles: {
                    icarus: {
                        admin: false,
                        bootstrap: false
                    }
                },
                aws: {
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


        function expandIndent(indent) {
            var whitespace = '';
            for (var i = 0; i < indent; ++i) {
                whitespace += '  ';
            }
            return whitespace;
        }

        function printStanza(stanza, indent, lines) {
            for (var key in stanza) {
                var value = stanza[key];
                if (typeof(value) === 'object') {
                    lines.push(expandIndent(indent) + key + " {");
                    printStanza(value, indent + 1, lines);
                    lines.push(expandIndent(indent) + "}");
                } else {
                    lines.push(expandIndent(indent) + key + ' ' + value + ";");
                }
            }
            return lines;
        }

        this.beginBootstrapWorkflow = function (params) {
            var sshParams = {
                host: params.server,
                port: 22,
                username: 'ec2-user',
                privateKey: require('fs').readFileSync(Config.aws.ec2.keyPath)
            };
            var bootstrapScriptPath = path.resolve('scripts/bootstrap.rb');
            var bootstrapScriptRemotePath = path.join('/var/app/_bootstrap', 'bootstrap.rb');

            var configRemotePath = path.join('/var/app/_config/icarus', 'config.js');
            var s3 = IcarusUtil.aws.getS3Client();
            var package_url = s3.getSignedUrl('getObject', {
                Bucket: Config.aws.s3.deploy.bucket,
                Key: PackageUtil.getPackageS3Key('icarus', params.commitId),
                Expires: 900});
            var nginxConfig = printStanza(Config.nginx.stanza, 0, []).join("\n");
            var nginxConfigRemotePath = '/var/app/_config/nginx/nginx.conf';

            return IcarusUtil.sshConnect(sshParams).then(function (conn) {
                return IcarusUtil.sftp(conn).then(function (sftp) {
                    function scpBootstrapScript() {
                        return Q.ninvoke(sftp, 'fastPut', bootstrapScriptPath, bootstrapScriptRemotePath);
                    }

                    function scpConfig() {
                        var ws = sftp.createWriteStream(configRemotePath);
                        var config = printConfig();
                        ws.write(config);
                        ws.end();
                    }

                    function scpNginxConfig() {
                        var ws = sftp.createWriteStream(nginxConfigRemotePath);
                        ws.write(nginxConfig);
                        ws.end();
                    }

                    function remoteMkdir(path) {
                        return Q.ninvoke(sftp, 'mkdir', path);
                    }

                    return Q.ninvoke(remoteMkdir('/var/app/_bootstrap'))
                        .then(scpBootstrapScript, scpBootstrapScript) // copy bootstrap script to remote destination
                        .then(remoteMkdir('/var/app/_config'))
                        .then(remoteMkdir('/var/app/_config/icarus'), remoteMkdir('/var/app/_config/icarus'))
                        .then(remoteMkdir('/var/app/_config/nginx'), remoteMkdir('/var/app/_config/nginx'))
                        .then(remoteMkdir('/var/app/_package'), remoteMkdir('/var/app/_package'))
                        .then(remoteMkdir('/var/app/_package/icarus'), remoteMkdir('/var/app/_package/icarus'))
                        .then(scpConfig, scpConfig) // scp Config
                        .then(scpNginxConfig, scpNginxConfig); // scp Nginx Config

                }).then(function () {
                    return IcarusUtil.executeSshCommands(conn, {pty: false}, [
                        // ['uname', '-a'],
                        // ['node', '--version'],
                        ['rbenv', 'global', '2.1.2'],
                        //  ['ruby', '--version'],
                        ['chmod', '755', bootstrapScriptRemotePath],
                        [bootstrapScriptRemotePath,
                            '--app-id', APP_ID,
                            '--app-deployment-dir', '/var/app/_package/icarus',
                            '--package-url', "'" + package_url + "'",
                            '--icarus-config-path', configRemotePath,
                            '--nginx-config-path', nginxConfigRemotePath
                        ],
                    ]);
                }).then(function (exitStatus) {
                    console.log(exitStatus);
                    return IcarusUtil.executeSshCommands(conn, {pty: true}, [
                        ['sudo', 'service', 'nginx', 'restart']
                    ]);
                }).then(function (exitStatus) {
                    console.log(exitStatus);
                    conn.end();
                    return exitStatus;
                });
            }).then(function (exitStatus) {
                return 'ok'
            });
        }
    };
})();