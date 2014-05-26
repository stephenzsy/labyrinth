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
        .controller('bootstrap', function ($scope, $route, BootstrapService) {
            $scope.raw = {
                'DescribeInstances': ''
            };

            $scope.$on('$routeChangeSuccess', function () {
                var instanceId = $route.current.params['instanceId'];

                BootstrapService.describeInstances([instanceId]).success(function (data) {
                    $scope.raw['DescribeInstances'] = JSON.stringify(data, null, 2);
                });
            });

            BootstrapService.currentRevision('icarus').success(function (data) {
                $scope.currentRevision = data.commits[0];
            });
        })
        .service('BootstrapService', function ($http) {
            return {
                describeInstances: describe_instances,
                currentRevision: currentRevision,
                artifact: artifact,
                buildArtifact: buildArtifact
            };

            function describe_instances(instanceIds) {
                return $http({method: 'POST', url: 'ec2/describeInstances', data: {InstanceIds: instanceIds}});
            }

            function currentRevision(appId) {
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