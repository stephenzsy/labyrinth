(function () {
    'use strict';

    var app = angular.module('icarus', ['ngRoute']);
    app.config(function ($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(true);
        $routeProvider
            .when('/', {
                templateUrl: 'views/index.html',
                controller: 'indexController'
            }).when('/package-manager', {
                templateUrl: 'views/package-manager.html',
                controller: 'packageManagerController'
            }).otherwise({templateUrl: 'views/error.html'});
    });
    app.controller('mainController', function ($scope) {
    });
    app.service('API', function ($http) {
        return function (service, action, params) {
            return $http({method: 'POST', url: '/' + service, data: params});
        };
    });
})();
