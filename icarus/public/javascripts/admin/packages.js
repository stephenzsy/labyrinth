(function () {
    'use strict';

    angular.module('icarus')
        .controller('adminPackagesController', function ($scope, $window, $AdminPackages) {
            var appId = null;
            {
                var m = $window.location.pathname.match(/\/packages\/(\w*)$/);
                if (m) {
                    appId = m[1]
                }
            }
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
                }
            });

            $scope.importPackage = function (appId) {
                $AdminPackages.ImportPackage(appId).success(function (data) {
                });
            };

        }).service('$AdminPackages', function ($http) {
            return {
                ListPackages: function () {
                    return $http({method: 'POST', url: '/admin/packages', data: {Action: 'ListPackages'}});
                },
                ImportPackage: function (appId) {
                    return $http({method: 'POST', url: '/admin/packages', data: {Action: 'ImportPackage', AppId: appId}});
                },
                GetLatestVersion: function (appId, majorVersion) {
                    return $http({method: 'POST', url: '/admin/packages', data: {Action: 'GetLatestVersion', AppId: appId, MajorVersion: majorVersion}});
                }
            }
        });

})();
