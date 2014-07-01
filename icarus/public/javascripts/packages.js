(function () {
    'use strict';

    angular.module('icarus')
        .controller('adminPackagesController', function ($scope, $window, $AdminPackages) {

            $AdminPackages.ListPackages().success(function (data) {
                {
                    var packages = [];
                    for (var key in data) {
                        var p = data[key];
                        p['id'] = key;
                        packages.push(p);
                    }
                    $scope.packages = packages;
                }

            });

            $scope.importPackage = function (appId, version) {
                $AdminPackages.ImportPackage(appId, version).success(function (data) {
                });
            };

            $scope.buildPackage = function (appId, commitId) {
                $AdminPackages.BuildPackage(appId, commitId).success(function (data) {
                });
            }

        }).service('$AdminPackages', function ($http) {
            return {
                ListPackages: function () {
                    return $http({method: 'POST', url: '/admin/packages', data: {Action: 'ListPackages'}});
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
