(function () {
    'use strict';

    angular.module('icarus')
        .controller('adminPackagesController', function ($scope, $window, $AdminPackages) {
            var appId = APP_ID;
            $scope.appId = appId;

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

                if (appId) {
                    $scope.currentPackage = data[appId];
                    /*
                     $AdminPackages.GetPackageVersions(appId).success(function (data) {
                     var descriptions = {};
                     data.forEach(function (versionDescription) {
                     descriptions[versionDescription.Version] = versionDescription;
                     });
                     $scope.versionDescriptions = descriptions;
                     });
                     */
                    if ($scope.currentPackage.build.type === 'build') {
                        $AdminPackages.ListCommits(appId).success(function (data) {
                            $scope.commits = data.commits;
                        });
                    }
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
