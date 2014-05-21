(function () {
    'use strict';

    angular.module('icarus', [])
        .controller('icarus', function ($scope, icarusService) {
            $scope.apps = [
                {id: 'daedalus', displayName: 'Daedalus'}
            ];

            icarusService.instances()
                .success(function (data) {
                    $scope.instances = data;
                });

            $scope.apps.forEach(function (app) {
                var appId = app['id'];
                app['commits'] = [];
                icarusService.current(appId).success(function (data) {
                    app['commits'] = data['commits'];
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
                return $http({method: 'GET', url: '/vcs', params: {appId: appId}});
            }

            function artifact() {
            }
        });
})();