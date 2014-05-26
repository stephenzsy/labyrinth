(function () {
    'use strict';

    angular.module('icarus', ['ngRoute'])
        .config(function ($routeProvider, $locationProvider) {
            $locationProvider.html5Mode(true);
            $routeProvider
                .when('/bootstrap/:instanceId', {
                    controller: 'bootstrap'
                });
        })
        .controller('bootstrap', function ($scope, $route, IcarusService) {
            $scope.raw = {
                'DescribeInstances': ''
            };

            $scope.$on('$routeChangeSuccess', function () {
                var instanceId = $route.current.params['instanceId'];

                IcarusService.ec2DescribeInstances([instanceId]).success(function (data) {
                    $scope.raw['DescribeInstances'] = JSON.stringify(data, null, 2);
                });
            });

            // current revision
            IcarusService.currentRevision('icarus').success(function (data) {
                var commit = data.commits[0];
                $scope.currentRevision = commit;
                refreshArtifactsRemote(commit.commitId);
            });

            $scope.artifactBuildStatus = 'NotStarted';
            $scope.buildArtifact = function (commit) {
                $scope.artifactBuildStatus = 'Building';
                IcarusService.buildArtifact('icarus', commit.commitId)
                    .success(function (data) {
                        $scope.artifactBuildStatus = 'Success';
                        $scope.builtArtifact = data;
                        refreshArtifactsLocal();
                    })
                    .error(function (data) {
                        $scope.artifactBuildStatus = 'Error';
                        $scope.artifactBuildError = data;
                    });
            };

            // local artifacts
            $scope.localArtifacts = [];

            function refreshArtifactsLocal() {
                IcarusService.artifactLocal('icarus').success(function (data) {
                    $scope.localArtifacts = data.localArtifacts;
                });
            }

            refreshArtifactsLocal();

            $scope.artifactLocalDelete = function (filename) {
                IcarusService.artifactLocalDelete('icarus', filename).success(function () {
                    refreshArtifactsLocal();
                });
            };

            // uploading
            $scope.artifactRemoteUpload = function (artifact) {
                IcarusService.artifactRemoteUpload('icarus', artifact.filename).success(function () {
                    refreshArtifactsRemote(artifact.commitId);
                });
            };

            // remote artifacts
            $scope.remoteArtifacts = [];
            function refreshArtifactsRemote(commitId) {
                IcarusService.artifactRemote('icarus', commitId).success(function (data) {
                    $scope.remoteArtifacts = data.remoteArtifacts;
                });
            }
        });
})();