(function () {
    'use strict'

    angular.module('icarus')
        .controller('packageManagerController', function ($scope, PackageManager) {
            PackageManager('ListPackages', {}).then(function (data) {
                console.log();
            });
        }).service('PackageManager', function (API) {
            return function (action, params) {
                return API('package-manager', action, params);
            }
        });

})();
