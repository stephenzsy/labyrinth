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

            IcarusService.currentRevision('icarus').success(function (data) {
                $scope.currentRevision = data.commits[0];
            });

            $scope.localArtifacts = [];

            function refreshArtifactsLocal() {
                IcarusService.artifactLocal('icarus').success(function (data) {
                    $scope.localArtifacts = data.localArtifacts;
                });
            }

            refreshArtifactsLocal();

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
        });
})();