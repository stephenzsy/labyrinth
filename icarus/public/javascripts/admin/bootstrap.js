(function () {
    'use strict';

    angular.module('icarus')
        .controller('adminBootstrapController', function ($scope, $window, $AdminInstances, $AdminPackages, $AdminBootstrap, $q) {
            $scope.navs = [
                {text: 'Admin', noLink: true},
                {text: 'Bootstrap', noLink: true, active: true}
            ];

            function refreshPackages() {
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
            }

            refreshPackages();

            $scope.selectBootstrapVersion = function (p, v) {
                p['bootstrapVersion'] = v.version;
            };

            $scope.buildPackage = function (appId, commitId) {
                $AdminPackages.BuildPackage(appId, commitId).success(function (data) {
                    refreshPackages();
                });
            };

            $scope.bootstrapPackage = {
            };

            $scope.selectBootstrapPackageVersion = function (appId, commitId) {
                $scope.bootstrapPackage[appId] = commitId;
            };

            $AdminInstances.DescribeInstances().success(function (data) {
                $scope.instances = data;
            });


            $scope.instanceActions = {
                bootstrap: true
            };

            var bootstrapInstance_ = null;
            $scope.bootstrapInstance = function (instance) {
                if (instance) {
                    bootstrapInstance_ = instance;
                }
                return bootstrapInstance_;
            };

            $scope.startBootstrap = function () {
                for (var appId in $scope.bootstrapPackage) {
                    var commitId = $scope.bootstrapPackage[appId];
                    $AdminBootstrap.BootstrapServer($scope.bootstrapInstance(), appId, commitId).success(function (data) {
                        console.log(data);
                    });
                }
            }

        }).service('$AdminBootstrap', function ($http) {
            return {
                GetBootstrapPackages: function () {
                    return $http({method: 'POST', url: '/admin/bootstrap', data: {Action: 'GetBootstrapPackages'}});
                },
                BootstrapServer: function (instance, appId, commitId) {
                    return $http({method: 'POST', url: '/admin/bootstrap', data: {
                        Action: 'BootstrapServer',
                        Server: instance.PublicDnsName,
                        AppId: appId,
                        CommitId: commitId}});
                }
            }
        });

})();
