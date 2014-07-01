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
                }).when('/admin/bootstrap', {
                    templateUrl: 'views/admin/bootstrap.html',
                    controller: 'adminBootstrapController'
                }).when('/packages',{
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
            },
            PassengerStatus: function () {
                return $http({method: 'POST', url: '/', data: {Action: 'PassengerStatus'}});
            }
        }
    });
    /*
     angular.module('icarus', [])
     .controller('icarus', function ($scope, icarusService) {
     $scope.apps = [
     {id: 'daedalus', displayName: 'Daedalus', commits: []}
     ];

     $scope.artifactStatus = {};

     icarusService.instances()
     .success(function (data) {
     $scope.instances = data;
     });

     $scope.apps.forEach(function (app) {
     var appId = app['id'];
     var artifactStatus = $scope.artifactStatus[appId] = {};
     icarusService.current(appId).success(function (data) {
     var commits = data['commits'];
     app['commits'] = commits;
     commits.forEach(function (commit) {
     var commitStatus = artifactStatus[commit['commitId']] = {};
     commitStatus['status'] = 'NotAvailable';
     });
     console.log($scope.artifactStatus);
     });
     });

     $scope.getBuildArtifactStatus = function (app, commit) {
     var appId = app['id'];
     var commitId = commit['commitId'];
     try {
     return $scope.artifactStatus[appId][commitId]['status']
     } catch (e) {
     return 'Unknown';
     }
     };

     function setBuildArtifactStatus(app, commit, status) {
     var appId = app['id'];
     var commitId = commit['commitId'];
     $scope.artifactStatus[appId][commitId]['status'] = status;
     }

     $scope.buildArtifact = function (app, commit) {
     var appId = app['id'];
     var commitId = commit['commitId'];
     setBuildArtifactStatus(app, commit, 'Building');
     icarusService.buildArtifact(appId, commitId).success(function (data) {
     setBuildArtifactStatus(app, commit, 'Success');
     });
     };

     })
     .service('icarusService', function ($http) {
     return {
     instances: instances,
     current: current,
     artifact: artifact,
     buildArtifact: buildArtifact
     };

     function instances() {
     return $http({method: 'GET', url: '/instances'});
     }

     function current(appId) {
     return $http({method: 'GET', url: '/vcs', params: {appId: appId}});
     }

     function artifact() {
     }

     function buildArtifact(appId, commitId, callback) {
     return $http({method: 'POST', url: '/build', data: {
     type: 'artifact',
     appId: appId,
     commitId: commitId}});
     }
     });*/
})();