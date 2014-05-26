(function () {
    'use strict';

    function IcarusService($http) {
        this.ec2DescribeInstances = function (instanceIds) {
            return $http({method: 'POST', url: '/api/ec2/describeInstances', data: {InstanceIds: instanceIds}});
        };

        this.currentRevision = function (appId) {
            return $http({method: 'GET', url: '/vcs', params: {appId: appId}});
        };

        this.artifactLocal = function (appId) {
            return $http({method: 'POST', url: '/api/artifact/local', data: {appId: appId}});
        };

        this.buildArtifact = function (appId, commitId) {
            return $http({method: 'POST', url: '/api/artifact/build', data: {
                type: 'artifact',
                appId: appId,
                commitId: commitId}});
        };
    }

    angular.module('icarus')
        .service('IcarusService', function ($http) {
            return new IcarusService($http);
        });

})();