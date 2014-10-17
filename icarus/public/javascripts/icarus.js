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
            }).when('/configurations/create_set', {
                templateUrl: 'views/configurations/create_set.html',
                controller: 'createConfigurationSetController'
            }).otherwise({templateUrl: 'views/error.html'});
    });

    app.controller('mainController', function ($scope) {
    });

    function parseTarget(target, spec) {
        if (!target) {
            return spec;
        }
        var parts = /^([@\.#!])(\w+)(.*)$/.exec(target);
        if (parts) {
            var d = parts[1];
            var n = parts[2];
            var r = parts[3];
            if (d === '@') {
                spec = spec.actions[n];
            } else if (d === '#') {
                spec = spec.structures[n];
            } else if (d === '.') {
                spec = spec.members[n];
            } else if (d === '!') {
                spec = spec[n];
            }
            target = r;
        } else {
            throw "Unrecognized target for spec: " + target;
        }
        return parseTarget(target, spec);
    }

    function buildModel(spec, serviceSpec) {
        if (angular.isUndefined(spec)) {
            return undefined;
        }
        if (angular.isString(spec)) {
            spec = parseTarget(spec, serviceSpec)
        }
        switch (spec.type) {
            case 'object':
                var obj = {};
                for (var key in spec.members) {
                    obj[key] = buildModel(spec.members[key], serviceSpec);
                }
                return obj;
            case 'map':
                return {};
            case 'string':
                return null;
            default:
                throw "Undefined type for spec: " + spec.type;
        }
    }

    app.directive('icarusApiFormModel', function () {
        return {
            restrict: 'A',
            transclude: true,
            scope: {
                model: "=icarusApiFormModel"
            }
        }
    });

    app.directive('icarusApiForm', function ($q, $compile, IcarusApiModel) {
        return {
            restrict: 'E',
            scope: {
                namespace: "@",
                service: "@",
                target: "@",
                model: "="
            },
            templateUrl: '/views/_api_support/_form_template.html',
            link: function (scope, element) {
                function getModel(spec) {
                    return scope.model;
                }

                function expandObjectMemberSpecs(spec) {
                    var results = [];
                    for (var key in spec.members) {
                        var member = spec.members[key];
                        member['_key'] = key;
                        results.push(member);
                    }
                    return results;
                }

                scope.expandObjectMemberSpecs = expandObjectMemberSpecs;
                scope.getModel = getModel;
                scope.getObjectKeys = function (obj) {
                    return Object.keys(obj);
                };

                IcarusApiModel(scope.service).then(function (serviceSpec) {
                    var target = parseTarget(scope.target, serviceSpec);
                    scope.spec = target;
                    scope.model = {};
                }, function (err) {
                    console.error(err);
                });

            }
        };
    });

    var TEMPLATE_CACHE = {};
    var MODEL_CACHE = {};

    app.service('IcarusApiModelTemplate', function ($q, $http) {
        return function (service, query) {
            var url = service + "?" + jQuery.param(query);
            if (TEMPLATE_CACHE[url]) {
                return $q(function () {
                    return TEMPLATE_CACHE[url];
                });
            } else {
                var deferred = $q.defer();
                $http.get('/api-form/' + url).success(function (data) {
                    TEMPLATE_CACHE[url] = data;
                    deferred.resolve(data);
                }).error(function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            }
        }
    });

    app.service('IcarusApiModel', function ($q, $http) {
        return function (service) {
            if (MODEL_CACHE[service]) {
                return $q(function () {
                    return MODEL_CACHE[service];
                });
            } else {
                var deferred = $q.defer();
                $http.get('/service/' + service).success(function (data) {
                    MODEL_CACHE[service] = data;
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
