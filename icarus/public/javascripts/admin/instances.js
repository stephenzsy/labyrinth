(function () {
    'use strict';

    angular.module('icarus')
        .controller('adminInstancesController', function ($scope, $window, $AdminInstances) {
        }).service('$AdminInstances', function ($http) {
            return {
                DescribeInstances: function () {
                    return $http({method: 'POST', url: '/admin/instances', data: {Action: 'DescribeInstances'}});
                },
                DescribeImages: function () {
                    return $http({method: 'POST', url: '/admin/instances/ec2/DescribeImages'});
                }
            }
        });

})();
