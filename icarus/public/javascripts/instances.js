(function () {
    'use strict';

    angular.module('icarus', [])
        .controller('instances', function ($scope, icarusService) {
            icarusService.instances()
                .success(function (data) {
                    $scope.instances = data;
                });
        })
        .service('icarusService', function ($http) {
            return {
                instances: instances
            };

            function instances() {
                return $http({method: 'GET', url: '/instances'});
            }
        });
})();