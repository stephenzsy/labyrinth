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

    app.directive('icarusApiForm', function ($q, $compile, IcarusModels, IcarusTemplates) {
        return {
            restrict: 'E',
            scope: {
                namespace: "&",
                service: "&",
                inputAction: "&",
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
                $q.all([
                    IcarusModels(service),
                    IcarusTemplates('/views/_api_support/_form_template.html')
                ]).then(function (result) {
                    var spec = result[0];
                    var template = result[1];

                    // validate namespace
                    if (spec.namespace !== scope.namespace()) {
                        throw "Namespace mismatch, ModelSpec: " + spec.namespace + ", Provided: " + scope.namespace();
                    }
                    console.log(scope.inputAction(), scope.model());


                    if (scope.inputAction()) {
                        scope.spec = spec.actions[scope.inputAction()].input;
                    } else if (scope.model()) {
                        scope.spec = scope.model();
                    }

                    var newElement = $compile(template)(scope);
                    element.append(newElement);
                });
            }
        };
    });

    var TEMPLATES_CACHE = {};
    var MODELS_CACHE = {};

    app.service('IcarusTemplates', function ($q, $http) {
        return function (url) {
            if (TEMPLATES_CACHE[url]) {
                return $q(function () {
                    return TEMPLATES_CACHE[url];
                });
            } else {
                var deferred = $q.defer();
                $http.get(url).success(function (data) {
                    TEMPLATES_CACHE[url] = data;
                    deferred.resolve(data);
                }).error(function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            }
        }
    });

    app.service('IcarusModels', function ($q, $http) {
        return function (service) {
            if (MODELS_CACHE[service]) {
                return $q(function () {
                    return MODELS_CACHE[service];
                });
            } else {
                var deferred = $q.defer();
                $http.get('/api/models/' + service + '.json').success(function (data) {
                    MODELS_CACHE[service] = data;
                    deferred.resolve(data);
                }).error(function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            }
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
