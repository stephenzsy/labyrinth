(function () {
    'use strict';

    angular.module('icarus')
        .controller('adminBootstrapController', function ($scope, $window, $AdminInstances, $AdminPackages, $q) {
            $scope.navs = [
                {text: 'Admin', noLink: true},
                {text: 'Bootstrap', noLink: true, active: true}
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

            $AdminInstances.DescribeInstances().success(function (data) {
                var instances = [];
                data.Reservations.forEach(function (reservation) {
                    reservation.Instances.forEach(function (instance) {
                        instances.push(instance);
                    });
                });
                $scope.instances = instances;
            });

            $AdminInstances.DescribeImages().success(function (data) {
                $scope.images = data.Images;
            });
            $AdminInstances.DescribeVpcs().success(function (data) {
                $scope.vpcs = data.Vpcs;
            });
            $AdminInstances.DescribeSubnets().success(function (data) {
                $scope.subnets = data.Subnets;
            });


            $scope.launchInstanceModal = function (imageId) {
                $scope.launchInstanceOptions = {
                    imageId: imageId,
                    instanceType: 't1.micro'
                };
                $("#launchInstanceModal").modal();
            };

            $scope.launchInstance = function (options) {
                console.log(options);
            };

        }).service('$AdminBootstrap', function ($http) {
            return {
                GetBootstrapPackages: function () {
                    return $http({method: 'POST', url: '/admin/bootstrap', data: {Action: 'GetBootstrapPackages'}});
                }
            }
        });

})();
