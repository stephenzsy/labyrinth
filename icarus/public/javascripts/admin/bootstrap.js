(function () {
    'use strict';

    angular.module('icarus')
        .controller('adminBootstrapController', function ($scope, $window, $AdminBootstrap) {
            var appId = APP_ID;
            $scope.appId = appId;

            $AdminBootstrap.GetBootstrapPackages().success(function (data) {
                $scope.packages = data;
            });
        }).service('$AdminBootstrap', function ($http) {
            return {
                GetBootstrapPackages: function () {
                    return $http({method: 'POST', url: '/admin/bootstrap', data: {Action: 'GetBootstrapPackages'}});
                },
                ImportPackage: function (appId, version) {
                    return $http({method: 'POST', url: '/admin/packages', data: {Action: 'ImportPackage', AppId: appId, Version: version}});
                },
                GetPackageVersions: function (appId) {
                    return $http({method: 'POST', url: '/admin/packages', data: {Action: 'GetPackageVersions', AppId: appId}});
                },
                ListCommits: function (appId) {
                    return $http({method: 'POST', url: '/admin/packages', data: {Action: 'ListCommits', AppId: appId}});
                },
                BuildPackage: function (appId, commitId) {
                    return $http({method: 'POST', url: '/admin/packages', data: {Action: 'BuildPackage', AppId: appId, CommitId: commitId}});
                }
            }
        });

})();
