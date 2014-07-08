(function () {
    'use strict';

    var app = angular.module('icarus');

    app.controller('adminInstancesController', function ($scope, $AdminInstances) {
        $AdminInstances.GetEc2Configuration().success(function (data) {
            $scope.ec2Config = data;
        });

        function refreshInstancesList() {
            return $AdminInstances.DescribeInstances().success(function (data) {
                $scope.instances = data;
            });
        }

        $scope.instanceActions = {
            terminate: true
        };

        refreshInstancesList();

        $scope.terminateInstance = function (instance) {
            $AdminInstances.request({
                Action: 'TerminateInstance',
                InstanceId: instance.InstanceId
            }).success(function (data) {
                refreshInstancesList();
            }).error(function (data) {
                console.log(data);
            });
        };

    });
    app.controller('adminInstancesLaunchController', function ($scope, $AdminInstances, $location) {
        $scope.navs = [
            {text: 'Admin', noLink: true},
            {text: 'Instances', href: '/admin/instances'},
            {text: 'Launch', noLink: true, active: true}
        ];

        $AdminInstances.GetEc2Configuration().success(function (data) {
            $scope.ec2Config = data;
        });

        $scope.ec2SubnetSelector = {};
        $AdminInstances.DescribeSubnets().success(function (data) {
            var subnets = data.Subnets;
            $scope.ec2SubnetSelector = {
                subnets: subnets,
                selected: data.Subnets[Math.floor(Math.random() * subnets.length)].SubnetId // random select subnet by default
            };
        });

        $scope.ec2SecurityGroupsSelector = {};
        $AdminInstances.DescribeSecurityGroups().success(function (data) {
            var securityGroups = data.SecurityGroups;
            $scope.ec2SecurityGroupsSelector = {
                securityGroups: securityGroups,
                selected: {}
            };
        });

        $AdminInstances.DescribeImages().success(function (data) {
            var images = data.Images;
            $scope.ec2ImageSelector = {
                images: images
            };
        });

        $scope.selectedInstanceType = 't2.micro';

        $scope.launchInstance = function () {
            console.log($scope.selectedInstanceType);
            console.log($scope.ec2SecurityGroupsSelector.selected);
            console.log($scope.ec2SubnetSelector.selected);
            var selectedSecurityGroups = [];
            for (var key in $scope.ec2SecurityGroupsSelector.selected) {
                if ($scope.ec2SecurityGroupsSelector.selected[key]) {
                    selectedSecurityGroups.push(key);
                }
            }

            $AdminInstances.request({
                Action: 'LaunchInstance',
                ImageId: $scope.ec2ImageSelector.selected,
                InstanceType: $scope.selectedInstanceType,
                Subnet: $scope.ec2SubnetSelector.selected,
                SecurityGroups: selectedSecurityGroups
            }).success(function (data) {
                console.log(data);
                $location.url('/admin/instances');
            }).error(function (data) {
                console.log(data);
            });
        };

    });

    // Controller for single instance
    app.controller('adminInstanceController', function ($scope, $AdminInstances, $route) {
        var instanceId = $route.current.params.instanceId;

        $scope.navs = [
            {text: 'Admin', noLink: true},
            {text: 'Instances', href: '/admin/instances'},
            {text: instanceId, noLink: true, active: true}
        ];

        $scope.instanceId = instanceId;

        $AdminInstances.ListPackages(instanceId).success(function (data) {
            console.log(data);
        });
    });


    app.directive('icarusInstancesList', function () {
        return {
            restrict: 'A',
            templateUrl: 'views/admin/_instances_list.html',
            replace: true
        };
    }).directive('icarusAdminKeyValueModal', function () {
        return {
            restrict: 'A',
            templateUrl: 'views/admin/_key_value_modal.html',
            scope: {
                title: '@title',
                icarusAdminKeyValueModal: '&icarusAdminKeyValueModal'
            },
            replace: true
        };
    }).service('$AdminInstances', function ($http) {
        return {
            request: function (params) {
                return $http({method: 'POST', url: '/admin/instances/', data: params});
            },
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
            },
            DescribeSecurityGroups: function () {
                return $http({method: 'POST', url: '/admin/instances/ec2/DescribeSecurityGroups'});
            },
            ListPackages: function (instanceId) {
                return $http({method: 'POST', url: '/admin/instances/', data: {Action: 'ListPackages', InstanceId: instanceId}});
            }
        }
    });

})();
