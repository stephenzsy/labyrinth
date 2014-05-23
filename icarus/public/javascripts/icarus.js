(function () {
    'use strict';

    angular.module('icarus', [])
        .controller('icarus', function ($scope, icarusService) {
            $scope.apps = [
                {id: 'daedalus', displayName: 'Daedalus'}
            ];

            icarusService.instances()
                .success(function (data) {
                    $scope.instances = data;
                });

            $scope.apps.forEach(function (app) {
                var appId = app['id'];
                app['commits'] = [];
                icarusService.current(appId).success(function (data) {
                    app['commits'] = data['commits'];
                });
            });

            $scope.buildArtifact = function (app, commit) {
                var appId = app['id'];
                var commitId = commit['hash'];
                icarusService.buildArtifact(appId, commitId).success(function (data) {
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