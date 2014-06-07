(function () {
    'use strict';

    angular.module('icarus')
        .controller('adminPackagesController', function ($scope, $window, $AdminPackages) {
            var appId = $window.location.pathname.match(/\/(\w*)$/)[1];
            $scope.appId = appId;
            $AdminPackages.ListPackages().success(function (data) {
                $scope.packages = data;
            });
        }).service('$AdminPackages', function ($http) {
            return {
                ListPackages: function () {
                    return $http({method: 'POST', url: '/admin/packages', data: {Action: 'ListPackages'}});
                }
            }
        });

})();
