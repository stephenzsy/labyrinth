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

        this.artifactLocalDelete = function (appId, filename) {
            return $http({method: 'POST', url: '/api/artifact/local/delete', data: {appId: appId, filename: filename}});
        };

        this.artifactRemote = function (appId, commitId) {
            return $http({method: 'POST', url: '/api/artifact/remote', data: {appId: appId, commitId: commitId}});
        };

        this.artifactRemoteUpload = function (appId, filename) {
            return $http({method: 'POST', url: '/api/artifact/remote/upload', data: {appId: appId, filename: filename}});
        };

        this.artifactRemoteDelete = function (appId, filename) {
            return $http({method: 'POST', url: '/api/artifact/remote/delete', data: {appId: appId, filename: filename}});
        };

        this.buildArtifact = function (appId, commitId) {
            return $http({method: 'POST', url: '/api/artifact/build', data: {
                type: 'artifact',
                appId: appId,
                commitId: commitId}});
        };

        this.ec2Metadata = function (dnsName) {
            return $http({method: 'POST', url: '/api/ec2/metadata', data: {dnsName: dnsName}});
        };

        this.bootstrapStart = function (server, artifactToDeploy) {
            return $http({method: 'POST', url: '/bootstrap/api/start/i-fakeid', data: {
                server: server,
                appId: 'icarus',
                key: artifactToDeploy.key
            }});
        };

        this.bootstrapNginxConfig = function (appIds) {
            return $http({method: 'POST', url: '/api/bootstrap/nginxConfig', data: {appIds: appIds}});
        };

    }

    angular.module('icarus')
        .service('IcarusService', function ($http) {
            return new IcarusService($http);
        });

})();