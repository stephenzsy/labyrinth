(function () {
    'use strict';

    angular.module('icarus')
        .controller('packageManagerController', function ($scope, PackageManager) {
            PackageManager('ListPackages', {}).then(function (data) {
            });
        }).controller('createPackageManagerController', function ($scope, PackageManager) {
            $scope.formInput = null;
        }).service('PackageManager', function (API) {
            return function (action, params) {
                return API('package-manager', action, params);
            }
        });

})();
