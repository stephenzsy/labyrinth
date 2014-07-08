(function () {
    'use strict';

    var app = angular.module('icarus', ['ngRoute'])
        .config(function ($routeProvider, $locationProvider) {
            $locationProvider.html5Mode(true);
            $routeProvider
                .when('/', {
                    templateUrl: 'views/index.html',
                    controller: 'indexController'
                }).when('/admin/instances', {
                    templateUrl: 'views/admin/instances.html',
                    controller: 'adminInstancesController'
                }).when('/admin/instances/launch', {
                    templateUrl: 'views/admin/instances_launch.html',
                    controller: 'adminInstancesLaunchController'
                }).when('/admin/instance/:instanceId', {
                    templateUrl: 'views/admin/instance.html',
                    controller: 'adminInstanceController'
                }).when('/admin/bootstrap', {
                    templateUrl: 'views/admin/bootstrap.html',
                    controller: 'adminBootstrapController'
                }).when('/admin/package/:packageId', {
                    templateUrl: 'views/admin/package.html',
                    controller: 'adminPackageController'
                }).when('/packages', {
                    templateUrl: 'views/packages.html',
                    controller: 'packagesController'
                }).otherwise({templateUrl: 'views/error.html'});
        });
    app.directive('icarusHeader', function () {
        return {
            restrict: 'A',
            templateUrl: 'views/_banner.html',
            replace: true
        };
    }).directive('icarusNav', function () {
        return {
            restrict: 'A',
            templateUrl: 'views/_nav.html',
            replace: true
        };
    }).directive('icarusSimpleObject', function ($compile) {
        return {
            restrict: 'A',
            scope: {
                obj: '&icarusSimpleObject'
            },
            link: function (scope, element) {
                var obj = scope.obj();
                if (angular.isObject(obj)) {
                    if (angular.isArray(obj)) {
                        $compile('<div ng-repeat="element in obj()"><div>+</div>' +
                            '<div class="margin-indent-2" icarus-simple-object="element"></div>' +
                            '</div>')(scope).appendTo(element);
                    } else {
                        $compile('<div ng-repeat="(objKey, objValue) in obj()">' +
                            '<strong>{{objKey}}</strong>' +
                            '<div class="margin-indent-2" icarus-simple-object="objValue"></div>' +
                            '</div>')(scope).appendTo(element);
                    }
                } else {
                    $compile('<div>{{obj()}}</div>')(scope).appendTo(element);
                }
            }
        };
    });
    app.controller('mainController', function ($scope, $Icarus) {
        $Icarus.ListRoles().success(function (roles) {
            $scope.roles = roles;
        });
    });
    app.service('$Icarus', function ($http) {
        return {
            ListRoles: function () {
                return $http({method: 'POST', url: '/', data: {Action: 'ListRoles', AppId: 'icarus'}});
            }
        }
    });

})();