(function () {
    'use strict';

    angular.module('icarus')
        .controller('configurationsController', function ($scope, Configurations) {
        }).controller('createConfigurationSetController', function ($scope, Configurations) {
        }).service('Configurations', function (API) {
            return function (action, params) {
                return API('configurations', action, params);
            }
        });

})();
