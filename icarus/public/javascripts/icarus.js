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
            }).when('/package-manager/create', {
                templateUrl: 'views/package-manager/_create.html',
                controller: 'createPackageManagerController'
            }).otherwise({templateUrl: 'views/error.html'});
    });

    app.controller('mainController', function ($scope) {
    });

    function buildModelObject(modelSpec, model) {
        var obj = {};
        for (var key in model) {
            var value = model[key];
            obj[key] = null;
        }
        return obj;
    }

    app.directive('icarusApiForm', function (IcarusModels) {
        return {
            restrict: 'E',
            templateUrl: 'views/_api_support/_form_template.html',
            replace: true,
            scope: {
                namespace: "&",
                service: "&",
                action: "&"
            },
            link: function (scope) {
                var namespace = scope.namespace();
                var service = scope.service();
                var action = scope.action();
                IcarusModels(service, function (modelSpec) {
                    if (namespace != modelSpec.namespace) {
                        throw "Invalid namespace '" + namespace + "' for model '" + service + "'";
                    }
                    var modelTarget = modelSpec.actions[action].input;
                    scope.formInputModel = modelTarget;
                    scope.formInputObject = buildModelObject(modelTarget);
                });
            }
        };
    });

    app.service('IcarusModels', function ($http) {
        var models = {};
        return function (service, callback) {
            if (models[service]) {
                callback(models[service]);
            }
            $http.get('/api/models/' + service + '.json').success(function (data) {
                models[service] = data;
                callback(models[service]);
            }).error(function (err) {
                console.error("Failed to load model for: " + service, err);
            });
        }

    });

    app.service('API', function ($http) {
        return function (service, action, params) {
            return $http({
                method: 'POST',
                url: '/' + service,
                data: params,
                headers: {
                    'x-icarus-action': action
                }
            });
        };
    });
})();
