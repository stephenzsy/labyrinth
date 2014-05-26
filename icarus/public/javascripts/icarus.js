(function () {
    'use strict';

    angular.module('icarus', [])
        .controller('icarus', function ($scope, icarusService) {
            $scope.apps = [
                {id: 'daedalus', displayName: 'Daedalus', commits: []}
            ];

            $scope.artifactStatus = {};

            icarusService.instances()
                .success(function (data) {
                    $scope.instances = data;
                });

            $scope.apps.forEach(function (app) {
                var appId = app['id'];
                var artifactStatus = $scope.artifactStatus[appId] = {};
                icarusService.current(appId).success(function (data) {
                    var commits = data['commits'];
                    app['commits'] = commits;
                    commits.forEach(function (commit) {
                        var commitStatus = artifactStatus[commit['commitId']] = {};
                        commitStatus['status'] = 'NotAvailable';
                    });
                    console.log($scope.artifactStatus);
                });
            });

            $scope.getBuildArtifactStatus = function (app, commit) {
                var appId = app['id'];
                var commitId = commit['commitId'];
                try {
                    return $scope.artifactStatus[appId][commitId]['status']
                } catch (e) {
                    return 'Unknown';
                }
            }

            function setBuildArtifactStatus(app, commit, status) {
                var appId = app['id'];
                var commitId = commit['commitId'];
                $scope.artifactStatus[appId][commitId]['status'] = status;
            }

            $scope.buildArtifact = function (app, commit) {
                var appId = app['id'];
                var commitId = commit['commitId'];
                setBuildArtifactStatus(app, commit, 'Building');
                icarusService.buildArtifact(appId, commitId).success(function (data) {
                    setBuildArtifactStatus(app, commit, 'Success');
                });
            };

        })
        .service('icarusService', function ($http) {
            return {
                instances: instances,
                current: current,
                artifact: artifact,
                buildArtifact: buildArtifact
            };

            function instances() {
                return $http({method: 'GET', url: '/instances'});
            }

            function current(appId) {
                return $http({method: 'GET', url: '/vcs', params: {appId: appId}});
            }

            function artifact() {
            }

            function buildArtifact(appId, commitId, callback) {
                return $http({method: 'POST', url: '/build', data: {
                    type: 'artifact',
                    appId: appId,
                    commitId: commitId}});
            }
        });
})();