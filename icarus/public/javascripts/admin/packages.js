(function () {
    'use strict';

    angular.module('icarus')
        .controller('adminPackagesController', function ($scope, $location, $AdminPackages) {
            var appId = $location.path().match(/\/(\w+)$/)[1];
            $scope.appId = appId;
            $AdminPackages.ListPackages().success(function (data) {
                $scope.packages = data;
            });
            if (appId) {
            } else {
            }
        }).service('$AdminPackages', function ($http) {
            return {
                ListPackages: function () {
                    return $http({method: 'POST', url: '/admin/packages', data: {Action: 'ListPackages'}});
                }
            }
        });

})();
