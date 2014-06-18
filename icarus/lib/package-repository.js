var Config = require('../config/config');
var IcarusUtil = require('./util');
var Q = require('q');
var child_process = require('child_process');

'use strict';

module.exports = function () {
    var s3 = IcarusUtil.aws.getS3Client();

    function getPackageS3Key(appId, version) {
        if (Config.packages[appId].versionSchema === 'GitCommitId') {
            return Config.aws.s3.deploy.prefix + appId + '/commit/' + appId + '-' + version + '.tar.gz';
        }
        return '';
    }

    function describePackageCommits(appId, commits) {
        return Q.all(commits.map(function (commit) {
            return Q.Promise(function (resolve, reject, progress) {
                s3.headObject({Bucket: Config.aws.s3.deploy.bucket, Key: getPackageS3Key(appId, commit.commitId)}, function (err, data) {
                    if (err) {
                        if (err.code === 'NotFound') {
                            commit['status'] = 'NotFound';
                            resolve(commit);
                            return;
                        }
                        reject(err);
                        return;
                    }
                    commit['status'] = 'Available';
                    resolve(commit);
                });
            });
        }));
    }

    this.getPackageRepoCommits = function (appId) {
        var p = Config.packages[appId];
        return IcarusUtil.spawnCommand('git', ['log', '-5', '--pretty=format:%h,%cd,%s'], {cwd: p.repo.path})
            .then(function (result) {
                var stdout = result.stdout;
                var commits = [];
                stdout.split("\n").forEach(function (line) {
                    var parts = line.trim().split(',');
                    if (parts.length < 3) {
                        return;
                    }
                    var commitId = parts.shift();
                    var date = parts.shift();
                    var releaseNotes = parts.join(',');
                    commits.push({
                        commitId: commitId,
                        date: date,
                        releaseNotes: releaseNotes
                    });
                });
                return commits;
            }).then(function (commits) {
                return describePackageCommits(appId, commits);
            });
    };
};
