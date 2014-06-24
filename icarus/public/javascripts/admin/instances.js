(function () {
    'use strict';

    $("[data-toggle='tooltip']").tooltip();

    angular.module('icarus')
        .controller('adminInstancesController', function ($scope, $AdminInstances) {
            $AdminInstances.GetEc2Configuration().success(function (data) {
                $scope.ec2Config = data;
            });

            $AdminInstances.DescribeInstances().success(function (data) {
                $scope.instances = data;
            });

        }).controller('adminInstancesLaunchController', function ($scope, $AdminInstances, $location) {
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

            $scope.selectedInstanceType = 't1.micro';

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
        }).directive('icarusInstancesList', function () {
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
                }
            }
        });

})();