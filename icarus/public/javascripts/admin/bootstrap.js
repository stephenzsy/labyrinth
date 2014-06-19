(function () {
    'use strict';

    angular.module('icarus')
        .controller('adminBootstrapController', function ($scope, $window, $AdminBootstrap, $AdminPackages, $q) {
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
                        console.log(data);
                        p['versions'] = data;
                        console.log($scope.packages);
                    });
                });
            });

            $scope.selectBootstrapVersion = function (p, v) {
                p['bootstrapVersion'] = v.version;
            };

        }).service('$AdminBootstrap', function ($http) {
            return {
                GetBootstrapPackages: function () {
                    return $http({method: 'POST', url: '/admin/bootstrap', data: {Action: 'GetBootstrapPackages'}});
                }
            }
        });

})();
