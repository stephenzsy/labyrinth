(function () {
    'use strict';

    angular.module('icarus')
        .controller('environmentsController', function ($scope, Environments) {
        }).service('Environments', function (API) {
            return function (action, params) {
                return API('package-manager', action, params);
            }
        });

})();
