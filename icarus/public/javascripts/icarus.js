(function () {
    'use strict';

    angular.module('icarus', [])
        .controller('icarus', function ($scope, icarusService) {
            $scope.appIds = ['daedalus'];
            $scope.currentApp = {};

            icarusService.instances()
                .success(function (data) {
                    $scope.instances = data;
                });

            $scope.appIds.forEach(function (appId) {
                icarusService.current(appId).success(function (data) {
                    $scope.currentApp[appId] = data;
                });
            });
        })
        .service('icarusService', function ($http) {
            return {
                instances: instances,
                current: current,
                artifact: artifact
            };

            function instances() {
                return $http({method: 'GET', url: '/instances'});
            }

            function current(appId) {
                return $http({method: 'GET', url: '/current', params: {appId: appId}});
            }

            function artifact() {
            }
        });
})();