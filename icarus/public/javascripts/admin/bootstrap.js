(function () {
    'use strict';

    angular.module('icarus')
        .controller('adminBootstrapController', function ($scope, $window, $AdminBootstrap) {
            $AdminBootstrap.GetBootstrapPackages().success(function (data) {
                $scope.packages = data;
            });

            $scope.selectBootstrapVersion = function (p, v) {
                p['bootstrapVersion'] = v.version;
            };

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
