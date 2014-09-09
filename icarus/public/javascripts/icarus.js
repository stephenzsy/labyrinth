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
                templateUrl: 'views/package-manager/index.html',
                controller: 'packageManagerController'
            }).when('/package-manager/create', {
                templateUrl: 'views/package-manager/create.html',
                controller: 'createPackageManagerController'
            }).when('/environments', {
                templateUrl: 'views/environments/index.html',
                controller: 'environmentsController'
            }).when('/environments/create', {
                templateUrl: 'views/environments/create.html',
                controller: 'environmentsController'
            }).when('/configurations', {
                templateUrl: 'views/configurations/index.html',
                controller: 'configurationsController'
            }).when('/configurations/create', {
                templateUrl: 'views/configurations/create.html',
                controller: 'createConfigurationSetController'
            }).otherwise({templateUrl: 'views/error.html'});
    });

    app.controller('mainController', function ($scope) {
    });

    function buildObject(spec) {
        var obj = {};
        for (var key in spec) {
            var value = spec[key];
            obj[key] = null;
        }
        return obj;
    }

    app.directive('icarusApiForm', function ($compile, IcarusModels) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                namespace: "&",
                service: "&",
                path: "&",
                model: "&",
                value: "="
            },
            link: function (scope, element) {
                scope.displayName = function (spec) {
                    if (spec.display) {
                        return spec.display;
                    }
                    return spec.key;
                };

                function getSpec(obj, specPath) {
                    var p = specPath.shift();
                    if (p) {
                        return getSpec(obj[p], specPath);
                    }
                    return obj;
                }

                var namespace = scope.namespace();
                var service = scope.service();
                IcarusModels(service, function (modelSpec) {
                    if (namespace != modelSpec.namespace) {
                        throw "Invalid namespace '" + namespace + "' for model '" + service + "'";
                    }

                    var spec = null;

                    if (scope.model()) {
                        spec = scope.model();
                    } else if (scope.path()) {
                        spec = getSpec(modelSpec, scope.path().split('.'));
                    } else {
                        throw "Either model or path must be specified";
                    }
                    scope.spec = spec;

                    var template = '<div ng-switch="spec.type">' +

                        '<div ng-when="object" class="form-group container" ng-repeat="memberSpec in spec.members">' +
                        '<label class="col-sm-2 control-label">{{displayName(memberSpec)}}' +
                        '<span ng-if="memberSpec.required" class="text-danger">*</span></label>' +
                        '<icarus-api-form class="col-sm-10" namespace="namespace()" service="service()" model="memberSpec"></icarus-api-form>' +
                        '</div>' +

                        '<div ng-when="object" class="form-group container" ng-repeat="memberSpec in spec.members">' +
                        '<label class="col-sm-2 control-label">{{displayName(memberSpec)}}' +
                        '<span ng-if="memberSpec.required" class="text-danger">*</span></label>' +
                        '<icarus-api-form class="col-sm-10" namespace="namespace()" service="service()" model="memberSpec"></icarus-api-form>' +
                        '</div>' +

                        '</div>';

                    var newElement = angular.element(template);
                    $compile(newElement)(scope);
                    element.replaceWith(newElement);
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
