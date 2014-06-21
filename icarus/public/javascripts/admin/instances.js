(function () {
    'use strict';

    angular.module('icarus')
        .controller('adminInstancesController', function ($scope, $window, $AdminInstances) {
            $AdminInstances.GetEc2Configuration().success(function (data) {
                $scope.ec2Config = data;
            });
        }).directive('icarusInstancesList', function () {
            return {
                restrict: 'A',
                templateUrl: 'views/admin/_instances_list.html',
                replace: true
            };
        }).service('$AdminInstances', function ($http) {
            return {
                GetEc2Configuration: function () {
                    return $http({method: 'POST', url: '/admin/instances/', data: {Action: 'GetEc2Configuration'}});
                },
                DescribeInstances: function () {
                    return $http({method: 'POST', url: '/admin/instances/ec2/DescribeInstances'});
                },
                DescribeImages: function () {
                    return $http({method: 'POST', url: '/admin/instances/ec2/DescribeImages'});
                },
                DescribeVpcs: function () {
                    return $http({method: 'POST', url: '/admin/instances/ec2/DescribeVpcs'});
                },
                DescribeSubnets: function () {
                    return $http({method: 'POST', url: '/admin/instances/ec2/DescribeSubnets'});
                }
            }
        });

})();
