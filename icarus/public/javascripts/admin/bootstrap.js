(function () {
    'use strict';

    angular.module('icarus')
        .controller('adminBootstrapController', function ($scope, $window, $AdminInstances, $AdminPackages, $q) {
            $scope.navs = [
                {text: 'Admin'},
                {text: 'Bootstrap', active: true}
            ];

            var deferred = $q.defer();
            $AdminPackages.ListPackages().success(function (packages) {
                var results = [];
                for (var appId in packages) {
                    var p = packages[appId];
                    if (p.bootstrap) {
                        p['appId'] = appId;
                        results.push(p);
                    }
                }
                $scope.packages = results;
                deferred.resolve(results);
            });

            deferred.promise.then(function (results) {
                results.forEach(function (p) {
                    $AdminPackages.ListCommits(p.appId).success(function (data) {
                        p['versions'] = data;
                    });
                });
            });

            $scope.selectBootstrapVersion = function (p, v) {
                p['bootstrapVersion'] = v.version;
            };

            $scope.buildPackage = function (appId, commitId) {
                $AdminPackages.BuildPackage(appId, commitId).success(function (data) {
                });
            };

            $AdminInstances.DescribeImages().success(function (data) {
                $scope.images = data.Images;
            });

        }).service('$AdminBootstrap', function ($http) {
            return {
                GetBootstrapPackages: function () {
                    return $http({method: 'POST', url: '/admin/bootstrap', data: {Action: 'GetBootstrapPackages'}});
                }
            }
        });

})();
